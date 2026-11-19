import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fakeSupabase, type QueryCall, type Result } from './helpers/fake-supabase'

const m = vi.hoisted(() => ({
  log: [] as string[],
  stored: [] as string[],
  prepared: [] as unknown[],
}))

vi.mock('../../utils/image-store', () => ({
  imagePath: vi.fn((u: string, d: string) => `${u}/${d}/new-${m.log.length}.webp`),
  uploadImage: vi.fn(async (_c: unknown, p: string) => { m.log.push(`upload:${p}`) }),
  listDemoImages: vi.fn(async () => m.stored),
  deleteImages: vi.fn(async (_c: unknown, paths: string[]) => { m.log.push(`deleteImages:${paths.join(',')}`) }),
}))
vi.mock('../../utils/image-compress', () => ({
  prepareImages: vi.fn(async () => m.prepared),
}))

import { useEditor } from '../../composables/useEditor'
import { deleteImages, imagePath } from '../../utils/image-store'

const demoRow = { id: 'd1', owner_id: 'u1', title: 'Demo', slug: 'abcd1234', status: 'draft',
  published_snapshot: null, published_at: null, created_at: '', updated_at: '' }
const stepRow = (id: string, position: number, image_path = `u1/d1/${id}.webp`) => ({
  id, demo_id: 'd1', position, image_path, image_width: 100, image_height: 50,
  hotspot_x: null, hotspot_y: null, tooltip_text: '', tooltip_placement: 'auto',
})

type H = (c: QueryCall) => Result | undefined
function setup(opts: { handler?: H; rpc?: (fn: string, args: unknown) => Result; steps?: unknown[] } = {}) {
  const steps = opts.steps ?? [stepRow('s1', 0), stepRow('s2', 1), stepRow('s3', 2)]
  const fake = fakeSupabase((c) => {
    const custom = opts.handler?.(c)
    if (custom) return custom
    if (c.table === 'demos' && c.op === 'select') return { data: demoRow }
    if (c.table === 'steps' && c.op === 'select') return { data: steps }
    return { data: null }
  }, (fn, args) => opts.rpc?.(fn, args) ?? { data: null }, m.log)
  const editor = useEditor('d1', { client: fake.client })
  return { ...fake, editor }
}

beforeEach(() => {
  m.log.length = 0
  m.stored = []
  m.prepared = []
  vi.mocked(deleteImages).mockClear()
})
afterEach(() => { vi.useRealTimers() })

describe('autosave', () => {
  it('dua updateStep dalam 800 ms → satu update berisi patch gabungan', async () => {
    vi.useFakeTimers()
    const { editor, calls } = setup()
    await editor.load()
    editor.updateStep('s1', { tooltip_text: 'Klik di sini' })
    await vi.advanceTimersByTimeAsync(400)
    editor.updateStep('s1', { hotspot_x: 10, hotspot_y: 20 })
    await vi.advanceTimersByTimeAsync(799)
    expect(calls.filter(c => c.op === 'update')).toHaveLength(0)
    await vi.advanceTimersByTimeAsync(1)

    const updates = calls.filter(c => c.op === 'update')
    expect(updates).toHaveLength(1)
    expect(updates[0]!.payload).toEqual({ tooltip_text: 'Klik di sini', hotspot_x: 10, hotspot_y: 20 })
    expect(updates[0]!.filters).toContainEqual(['eq', 'id', 's1'])
    expect(editor.saveState.value).toBe('saved')
    expect(editor.steps.value[0]!.tooltip_text).toBe('Klik di sini')
  })

  it('gagal karena jaringan → error, retry otomatis 2 detik → saved, patch terakhir terkirim', async () => {
    vi.useFakeTimers()
    let fail = true
    const { editor, calls } = setup({
      handler: (c) => {
        if (c.op !== 'update') return undefined
        if (fail) { fail = false; return { error: { message: 'TypeError: Failed to fetch' } } }
        return { data: null }
      },
    })
    await editor.load()
    editor.updateStep('s1', { tooltip_text: 'satu' })
    await vi.advanceTimersByTimeAsync(800)
    expect(editor.saveState.value).toBe('error')

    // edit lagi saat masih error: harus ikut terkirim bersama patch yang gagal
    editor.updateStep('s1', { tooltip_placement: 'top' })
    await vi.advanceTimersByTimeAsync(2000)

    const updates = calls.filter(c => c.op === 'update')
    expect(updates.length).toBeGreaterThanOrEqual(2)
    expect(updates.at(-1)!.payload).toEqual({ tooltip_text: 'satu', tooltip_placement: 'top' })
    expect(editor.saveState.value).toBe('saved')
  })
})

describe('autosave (review akhir)', () => {
  it('publish menunggu SEMUA simpan yang sedang berjalan, termasuk yang antre di belakang', async () => {
    vi.useFakeTimers()
    const gates: Array<() => void> = []
    const { editor, log } = setup({
      handler: (c) => {
        if (c.op !== 'update') return undefined
        const text = (c.payload as { tooltip_text?: string }).tooltip_text
        return new Promise((resolve) => {
          gates.push(() => { log.push(`done:${text}`); resolve({ data: null }) })
        }) as unknown as ReturnType<NonNullable<H>>
      },
      rpc: () => ({ data: '2026-11-19T10:00:00Z' }),
    })
    await editor.load()
    editor.updateStep('s1', { tooltip_text: 'a' })
    await vi.advanceTimersByTimeAsync(800) // simpan A berjalan
    editor.updateStep('s1', { tooltip_text: 'b' })
    await vi.advanceTimersByTimeAsync(800) // simpan B antre di belakang A
    const publishing = editor.publish()
    await vi.advanceTimersByTimeAsync(0)
    gates.shift()!() // A selesai → B mulai
    await vi.advanceTimersByTimeAsync(0)
    while (gates.length) { gates.shift()!(); await vi.advanceTimersByTimeAsync(0) }
    await publishing

    expect(log.indexOf('done:b')).toBeGreaterThan(-1)
    expect(log.indexOf('done:b')).toBeLessThan(log.indexOf('rpc:publish_demo'))
  })

  it('error tidak macet kalau patch yang gagal milik langkah yang lalu dihapus', async () => {
    vi.useFakeTimers()
    const { editor } = setup({
      handler: c => (c.op === 'update' ? { error: { message: 'Failed to fetch' } } : undefined),
      rpc: () => ({ data: '2026-11-19T10:00:00Z' }),
    })
    await editor.load()
    editor.updateStep('s1', { tooltip_text: 'x' })
    await vi.advanceTimersByTimeAsync(800)
    expect(editor.saveState.value).toBe('error')

    await editor.removeStep('s1')
    await vi.advanceTimersByTimeAsync(2000)
    expect(editor.saveState.value).not.toBe('error')
    expect(editor.hasPendingChanges()).toBe(false)
    await editor.publish()
    expect(editor.publishError.value).toBeNull()
  })
})

describe('publish', () => {
  it('pembersihan memakai path langkah draft dari database, bukan state tab ini', async () => {
    m.stored = ['a', 'b', 'c']
    let loads = 0
    let published = false
    const { editor } = setup({
      rpc: (fn) => { if (fn === 'publish_demo') published = true; return { data: '2026-11-19T10:00:00Z' } },
      handler: (c) => {
        if (c.table === 'steps' && c.op === 'select') {
          loads++
          // tab lain sudah menambah langkah 'c' setelah tab ini memuat
          return { data: loads === 1 ? [stepRow('s1', 0, 'a')] : [stepRow('s1', 0, 'a'), stepRow('s9', 1, 'c')] }
        }
        if (c.table === 'demos' && c.op === 'select' && published) {
          return { data: { ...demoRow, status: 'published', published_snapshot: [{ image_path: 'a' }] } }
        }
        return undefined
      },
    })
    await editor.load()
    await editor.publish()
    expect(deleteImages).toHaveBeenCalledWith(expect.anything(), ['b'])
  })

  it('PUBLISH_MISSING_HOTSPOT:2,4 → pesan nomor langkah, tanpa hapus file', async () => {
    const { editor } = setup({ rpc: () => ({ error: { message: 'PUBLISH_MISSING_HOTSPOT:2,4' } }) })
    await editor.load()
    await editor.publish()
    expect(editor.publishError.value).toBe('Langkah 2, 4 belum punya hotspot')
    expect(deleteImages).not.toHaveBeenCalled()
  })

  it('PUBLISH_EMPTY → Tambahkan minimal satu langkah, tanpa hapus file', async () => {
    const { editor } = setup({ rpc: () => ({ error: { message: 'PUBLISH_EMPTY' } }) })
    await editor.load()
    await editor.publish()
    expect(editor.publishError.value).toBe('Tambahkan minimal satu langkah')
    expect(deleteImages).not.toHaveBeenCalled()
  })

  it('berhasil → menghapus file yang tidak dipakai draft maupun snapshot', async () => {
    m.stored = ['a', 'b', 'c']
    let published = false
    const { editor } = setup({
      steps: [stepRow('s1', 0, 'a')],
      rpc: (fn) => { if (fn === 'publish_demo') published = true; return { data: '2026-11-19T10:00:00Z' } },
      handler: (c) => {
        if (c.table === 'demos' && c.op === 'select' && published) {
          return { data: { ...demoRow, status: 'published', published_at: '2026-11-19T10:00:00Z',
            updated_at: '2026-11-19T10:00:00Z', published_snapshot: [{ image_path: 'a' }, { image_path: 'b' }] } }
        }
        return undefined
      },
    })
    await editor.load()
    await editor.publish()
    expect(editor.publishError.value).toBeNull()
    expect(deleteImages).toHaveBeenCalledWith(expect.anything(), ['c'])
    expect(editor.demo.value?.status).toBe('published')
  })

  it('menyimpan perubahan tertunda sebelum memanggil publish_demo', async () => {
    const { editor, log } = setup({ rpc: () => ({ data: '2026-11-19T10:00:00Z' }) })
    await editor.load()
    editor.updateStep('s1', { hotspot_x: 1, hotspot_y: 2 })
    await editor.publish()
    expect(log.indexOf('update:steps')).toBeGreaterThan(-1)
    expect(log.indexOf('update:steps')).toBeLessThan(log.indexOf('rpc:publish_demo'))
  })
})

describe('langkah', () => {
  it('removeStep tidak menghapus file; hapus + rapikan urutan lewat satu RPC delete_step', async () => {
    const { editor, rpc, calls } = setup()
    await editor.load()
    await editor.removeStep('s2')
    expect(deleteImages).not.toHaveBeenCalled()
    expect(rpc).toHaveBeenCalledWith('delete_step', { p_step_id: 's2' })
    expect(rpc).not.toHaveBeenCalledWith('reorder_steps', expect.anything())
    expect(calls.filter(c => c.op === 'delete')).toHaveLength(0)
    expect(editor.steps.value.map(s => [s.id, s.position])).toEqual([['s1', 0], ['s3', 1]])
  })

  it('reorder(0,2) memanggil reorder_steps dengan urutan moveItem', async () => {
    const { editor, rpc } = setup()
    await editor.load()
    await editor.reorder(0, 2)
    expect(rpc).toHaveBeenCalledWith('reorder_steps', { p_demo_id: 'd1', p_step_ids: ['s2', 's3', 's1'] })
    expect(editor.steps.value.map(s => s.id)).toEqual(['s2', 's3', 's1'])
  })

  it('addImages([valid, heic]) mengunggah 1 file dan melaporkan heic', async () => {
    const valid = new File(['x'], 'x.png', { type: 'image/png' })
    const heic = new File(['y'], 'x.heic', { type: 'image/heic' })
    m.prepared = [
      { file: valid, result: { blob: new Blob(['w']), width: 1920, height: 1080 } },
      { file: heic, error: 'type' },
    ]
    const { editor, calls } = setup({
      steps: [],
      handler: (c) => c.table === 'steps' && c.op === 'insert'
        ? { data: { ...stepRow('new', 0), ...(c.payload as object), id: 'new' } }
        : undefined,
    })
    await editor.load()
    const failed = await editor.addImages([valid, heic])

    expect(failed).toEqual([{ name: 'x.heic', error: 'type' }])
    expect(m.log.filter(l => l.startsWith('upload:'))).toHaveLength(1)
    const insert = calls.find(c => c.op === 'insert')!
    expect(insert.payload).toMatchObject({ demo_id: 'd1', image_width: 1920, image_height: 1080 })
    // posisi diberikan database supaya unggahan + hapus bersamaan tidak membuat celah
    expect(insert.payload).not.toHaveProperty('position')
    expect(editor.steps.value).toHaveLength(1)
  })

  it('hasil kompresi JPEG (fallback Safari) disimpan dengan ekstensi .jpg', async () => {
    const f = new File(['x'], 'x.png', { type: 'image/png' })
    m.prepared = [{ file: f, result: { blob: new Blob(['j'], { type: 'image/jpeg' }), width: 10, height: 10 } }]
    const { editor } = setup({
      steps: [],
      handler: c => (c.table === 'steps' && c.op === 'insert' ? { data: { ...stepRow('n', 0), ...(c.payload as object) } } : undefined),
    })
    await editor.load()
    await editor.addImages([f])
    expect(imagePath).toHaveBeenLastCalledWith('u1', 'd1', 'jpg')
  })

  it('LIMIT_STEPS → berhenti, pesan batas, file langkah gagal dihapus', async () => {
    const f1 = new File(['1'], '1.png', { type: 'image/png' })
    const f2 = new File(['2'], '2.png', { type: 'image/png' })
    const ok = { blob: new Blob(['w']), width: 10, height: 10 }
    m.prepared = [{ file: f1, result: ok }, { file: f2, result: ok }]
    const { editor } = setup({
      handler: (c) => {
        if (c.table === 'steps' && c.op === 'insert') return { error: { message: 'LIMIT_STEPS', code: 'P0001' } }
        if (c.table === 'app_config') return { data: { value: 20 } }
        return undefined
      },
    })
    await editor.load()
    await editor.addImages([f1, f2])

    expect(editor.addError.value).toBe('Batas 20 langkah tercapai')
    const uploads = m.log.filter(l => l.startsWith('upload:'))
    expect(uploads).toHaveLength(1) // file kedua tidak dicoba
    expect(deleteImages).toHaveBeenCalledWith(expect.anything(), [uploads[0]!.slice('upload:'.length)])
  })
})
