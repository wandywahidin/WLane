import { ref } from 'vue'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Demo, Step, StepKind } from '../types/demo'
import { DEFAULT_MODAL_BUTTON } from '../utils/modal-buttons'
import { deleteImages, imagePath, listDemoImages, uploadImage } from '../utils/image-store'
import { prepareImages } from '../utils/image-compress'
import { moveItem } from '../utils/positions'
import { orphanedImages } from '../utils/orphans'
import { readConfigInt } from '../utils/app-config'

export type SaveState = 'idle' | 'saving' | 'saved' | 'error'
export type StepPatch = Partial<Pick<Step,
  'hotspot_x' | 'hotspot_y' | 'area_w' | 'area_h' | 'tooltip_text' | 'tooltip_placement'
  | 'kind' | 'modal_title' | 'modal_body' | 'buttons'
>>
export type AddImageError = 'type' | 'size' | 'decode' | 'upload'

const RETRY_MS = 2000

export function publishErrorMessage(message: string | undefined): string {
  const m = message ?? ''
  if (m.includes('PUBLISH_EMPTY')) return 'Tambahkan minimal satu langkah'
  const parts: string[] = []
  const missing = m.match(/PUBLISH_MISSING_HOTSPOT:([\d,]+)/)
  if (missing) parts.push(`Langkah ${missing[1]!.split(',').join(', ')} belum punya hotspot`)
  const incomplete = m.match(/PUBLISH_INCOMPLETE_MODAL:([\d,]+)/)
  if (incomplete) parts.push(`Langkah ${incomplete[1]!.split(',').join(', ')}: lengkapi modal (judul, tombol, dan link https://)`)
  if (parts.length) return parts.join('. ')
  return 'Gagal menerbitkan, coba lagi'
}

export function useEditor(
  demoId: string,
  opts: { debounceMs?: number; client?: SupabaseClient } = {},
) {
  const client = opts.client ?? useSupabaseClient()
  const debounceMs = opts.debounceMs ?? 800

  const demo = ref<Demo | null>(null)
  const steps = ref<Step[]>([])
  const activeIndex = ref(0)
  const saveState = ref<SaveState>('idle')
  const publishError = ref<string | null>(null)
  const addError = ref<string | null>(null)
  const busy = ref(false)

  // ---------- muat ----------
  async function load(): Promise<void> {
    const [d, s] = await Promise.all([
      client.from('demos').select('*').eq('id', demoId).single(),
      client.from('steps').select('*').eq('demo_id', demoId).order('position', { ascending: true }),
    ])
    if (d.error) throw d.error
    if (s.error) throw s.error
    demo.value = d.data as Demo
    steps.value = (s.data ?? []) as Step[]
    activeIndex.value = 0
  }

  async function refreshDemo(): Promise<void> {
    const { data, error } = await client.from('demos').select('*').eq('id', demoId).single()
    if (!error && data) demo.value = data as Demo
  }

  // ---------- autosave ----------
  let pending: Record<string, StepPatch> = {}
  let timer: ReturnType<typeof setTimeout> | null = null
  let inflight: Promise<boolean> | null = null

  function schedule(ms: number) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => { timer = null; void flush() }, ms)
  }

  function updateStep(id: string, patch: StepPatch): void {
    const step = steps.value.find(s => s.id === id)
    if (!step) return
    const safe: StepPatch = patch.buttons ? { ...patch, buttons: patch.buttons.map(b => ({ ...b })) } : patch
    Object.assign(step, safe)
    pending[id] = { ...pending[id], ...safe }
    // Saat error, retry yang sudah terjadwal ikut membawa patch baru ini.
    if (saveState.value !== 'error') schedule(debounceMs)
  }

  function setKind(id: string, kind: StepKind): void {
    const step = steps.value.find(s => s.id === id)
    if (!step) return
    if (kind === 'modal' && (step.buttons?.length ?? 0) === 0) {
      updateStep(id, { kind, buttons: [{ ...DEFAULT_MODAL_BUTTON }] })
    } else {
      updateStep(id, { kind })
    }
  }

  /** Mengirim semua patch tertunda. true kalau semuanya tersimpan. */
  async function flush(): Promise<boolean> {
    // Tunggu semua simpan yang berjalan, termasuk yang dimulai pemanggil lain saat kita menunggu.
    while (inflight) await inflight
    if (timer) { clearTimeout(timer); timer = null }
    const batch = pending
    pending = {}
    const ids = Object.keys(batch)
    if (ids.length === 0) {
      // Tidak ada yang tertunda (mis. patch gagal milik langkah yang sudah dihapus): tidak ada error lagi.
      if (saveState.value === 'error' || saveState.value === 'saving') saveState.value = 'saved'
      return true
    }

    saveState.value = 'saving'
    inflight = (async () => {
      let ok = true
      for (const id of ids) {
        try {
          const { error } = await client.from('steps').update(batch[id]!).eq('id', id)
          if (error) throw error
        } catch {
          ok = false
          // patch yang gagal dikembalikan; edit yang lebih baru tetap menang
          pending[id] = { ...batch[id], ...pending[id] }
        }
      }
      return ok
    })()
    const ok = await inflight
    inflight = null

    if (!ok) {
      saveState.value = 'error'
      schedule(RETRY_MS)
      return false
    }
    if (Object.keys(pending).length > 0) {
      saveState.value = 'saving'
      schedule(debounceMs)
    } else {
      saveState.value = 'saved'
    }
    return true
  }

  function hasPendingChanges(): boolean {
    return Object.keys(pending).length > 0 || inflight !== null || saveState.value === 'error'
  }

  // ---------- langkah ----------
  async function addImages(files: File[]): Promise<Array<{ name: string; error: AddImageError }>> {
    addError.value = null
    const failed: Array<{ name: string; error: AddImageError }> = []
    const ownerId = demo.value?.owner_id
    if (!ownerId) throw new Error('DEMO_NOT_LOADED')

    busy.value = true
    try {
      const prepared = await prepareImages(files)
      for (const item of prepared) {
        if (item.error || !item.result) {
          failed.push({ name: item.file.name, error: item.error ?? 'decode' })
          continue
        }
        const path = imagePath(ownerId, demoId, item.result.blob.type === 'image/jpeg' ? 'jpg' : 'webp')
        try {
          await uploadImage(client, path, item.result.blob)
        } catch {
          failed.push({ name: item.file.name, error: 'upload' })
          continue
        }
        const { data, error } = await client
          .from('steps')
          .insert({
            // position diberikan database (0006) supaya unggahan dan hapus bersamaan tidak bentrok
            demo_id: demoId,
            image_path: path,
            image_width: item.result.width,
            image_height: item.result.height,
            tooltip_text: '',
            tooltip_placement: 'auto',
          })
          .select()
          .single()
        if (error) {
          await deleteImages(client, [path]).catch(() => {})
          if (error.message?.includes('LIMIT_STEPS')) {
            const max = await readConfigInt(client, 'max_steps_per_demo', 20)
            addError.value = `Batas ${max} langkah tercapai`
            break
          }
          failed.push({ name: item.file.name, error: 'upload' })
          continue
        }
        steps.value = [...steps.value, data as Step]
      }
    } finally {
      busy.value = false
    }
    return failed
  }

  function applyOrder(ordered: Step[]) {
    steps.value = ordered.map((s, i) => ({ ...s, position: i }))
  }

  async function removeStep(id: string): Promise<void> {
    delete pending[id]
    // Hapus dan rapikan urutan dalam satu transaksi di database.
    // File tidak dihapus di sini: mungkin masih dipakai versi terbit.
    const { error } = await client.rpc('delete_step', { p_step_id: id })
    if (error) throw error
    const remaining = steps.value.filter(s => s.id !== id)
    applyOrder(remaining)
    if (activeIndex.value >= remaining.length) activeIndex.value = Math.max(0, remaining.length - 1)
  }

  async function reorder(from: number, to: number): Promise<void> {
    if (from === to) return
    const before = steps.value
    const activeId = before[activeIndex.value]?.id
    const next = moveItem(before, from, to)
    applyOrder(next)
    activeIndex.value = Math.max(0, steps.value.findIndex(s => s.id === activeId))
    const { error } = await client.rpc('reorder_steps', { p_demo_id: demoId, p_step_ids: next.map(s => s.id) })
    if (error) {
      steps.value = before
      throw error
    }
  }

  // ---------- terbit ----------
  async function cleanupOrphans(): Promise<void> {
    const ownerId = demo.value?.owner_id
    if (!ownerId) return
    try {
      const stored = await listDemoImages(client, ownerId, demoId)
      // Baca ulang dari database: tab lain mungkin sudah menambah langkah.
      const { data: rows, error } = await client.from('steps').select('image_path').eq('demo_id', demoId)
      if (error) return
      const draftPaths = ((rows ?? []) as Array<{ image_path: string }>).map(s => s.image_path)
      const snapshotPaths = (demo.value?.published_snapshot ?? []).map(s => s.image_path)
      await deleteImages(client, orphanedImages(stored, draftPaths, snapshotPaths))
    } catch {
      // Pembersihan gagal tidak membatalkan terbit; dicoba lagi saat terbit berikutnya.
    }
  }

  async function publish(): Promise<void> {
    publishError.value = null
    busy.value = true
    try {
      if (!(await flush())) {
        publishError.value = 'Perubahan belum tersimpan, coba lagi'
        return
      }
      const { error } = await client.rpc('publish_demo', { p_demo_id: demoId })
      if (error) {
        publishError.value = publishErrorMessage(error.message)
        return
      }
      await refreshDemo()
      await cleanupOrphans()
    } finally {
      busy.value = false
    }
  }

  async function unpublish(): Promise<void> {
    publishError.value = null
    busy.value = true
    try {
      const { error } = await client.rpc('unpublish_demo', { p_demo_id: demoId })
      if (error) {
        publishError.value = 'Gagal membatalkan terbit, coba lagi'
        return
      }
      await refreshDemo()
      await cleanupOrphans()
    } finally {
      busy.value = false
    }
  }

  async function rename(title: string): Promise<void> {
    const { error } = await client.from('demos').update({ title }).eq('id', demoId)
    if (error) throw error
    if (demo.value) demo.value = { ...demo.value, title }
  }

  return {
    demo, steps, activeIndex, saveState, publishError, addError, busy,
    load, updateStep, setKind, flush, hasPendingChanges, addImages, removeStep, reorder, publish, unpublish, rename,
  }
}

