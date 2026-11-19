<script setup lang="ts">
import type { TooltipPlacement } from '~/types/demo'

definePageMeta({ middleware: 'auth' })

const route = useRoute()
const supabase = useSupabaseClient()
const demoId = String(route.params.id)
const editor = useEditor(demoId)
const { demo, steps, activeIndex, saveState, publishError, addError, busy } = editor

const loadError = ref<string | null>(null)
const fileErrors = ref<string[]>([])
const stepError = ref<string | null>(null)
const copied = ref<string | null>(null)
const origin = ref('')

useSeoMeta({ title: () => `${demo.value?.title || 'Editor'} — Panduan Interaktif` })

const imageUrl = (path: string) => publicImageUrl(supabase, path)
const active = computed(() => steps.value[activeIndex.value] ?? null)
const status = computed(() => (demo.value ? demoStatus(demo.value) : 'draft'))
const shareUrl = computed(() => (demo.value ? publicDemoUrl(origin.value, demo.value.slug) : ''))
const shareCode = computed(() => (demo.value ? embedCode(origin.value, demo.value.slug) : ''))
const saveLabel = computed(() => ({
  idle: '',
  saving: 'Menyimpan…',
  saved: 'Tersimpan',
  error: 'Gagal menyimpan, mencoba lagi…',
}[saveState.value]))

const REASON: Record<string, string> = {
  type: 'format tidak didukung (hanya PNG, JPG, WebP)',
  size: 'lebih dari 10 MB',
  decode: 'gambar rusak atau tidak bisa dibaca',
  upload: 'gagal diunggah',
}

function warnUnsaved(e: BeforeUnloadEvent) {
  if (editor.hasPendingChanges()) e.preventDefault()
}

onMounted(async () => {
  origin.value = window.location.origin
  window.addEventListener('beforeunload', warnUnsaved)
  try {
    await editor.load()
  } catch {
    loadError.value = 'Demo tidak ditemukan atau gagal dimuat.'
  }
})
onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', warnUnsaved)
  void editor.flush()
})

async function onAdd(files: File[]) {
  fileErrors.value = []
  const failed = await editor.addImages(files)
  fileErrors.value = failed.map(f => `${f.name}: ${REASON[f.error] ?? f.error}`)
  if (steps.value.length && !active.value) activeIndex.value = 0
}

async function run(fn: () => Promise<void>, message: string) {
  stepError.value = null
  try { await fn() } catch { stepError.value = message; await editor.load().catch(() => {}) }
}

function onRemove(id: string) {
  if (!window.confirm('Hapus langkah ini?')) return
  void run(() => editor.removeStep(id), 'Gagal menghapus langkah')
}

function onPlace(pos: { x: number; y: number }) {
  if (active.value) editor.updateStep(active.value.id, { hotspot_x: pos.x, hotspot_y: pos.y })
}
function onText(value: string) {
  if (active.value) editor.updateStep(active.value.id, { tooltip_text: value.slice(0, 280) })
}
function onPlacement(value: TooltipPlacement) {
  if (active.value) editor.updateStep(active.value.id, { tooltip_placement: value })
}

async function onTitle(e: Event) {
  const title = (e.target as HTMLInputElement).value.trim()
  if (demo.value && title && title !== demo.value.title) {
    await run(() => editor.rename(title), 'Gagal mengganti judul')
  }
}

async function onPreview() {
  if (!demo.value) return
  await editor.flush()
  window.open(`/d/${demo.value.slug}?preview=1`, '_blank', 'noopener')
}

async function copy(text: string, what: string) {
  try {
    await navigator.clipboard.writeText(text)
    copied.value = what
    setTimeout(() => { copied.value = null }, 1500)
  } catch {
    window.prompt('Salin teks ini:', text)
  }
}
</script>

<template>
  <div class="editor">
    <header class="bar">
      <NuxtLink to="/dashboard" class="back">← Demo saya</NuxtLink>
      <input
        v-if="demo"
        class="title"
        :value="demo.title"
        aria-label="Judul demo"
        maxlength="120"
        @change="onTitle"
      >
      <span class="save" :class="saveState" role="status">{{ saveLabel }}</span>
      <div class="actions">
        <button type="button" :disabled="!demo || steps.length === 0" @click="onPreview">Pratinjau</button>
        <button v-if="status !== 'draft'" type="button" :disabled="busy" @click="editor.unpublish()">Batalkan terbit</button>
        <button type="button" class="primary" :disabled="busy || !demo" @click="editor.publish()">Terbitkan</button>
      </div>
    </header>

    <p v-if="loadError" class="error container">{{ loadError }}</p>

    <div v-if="publishError || addError || stepError || fileErrors.length" class="messages" role="alert">
      <p v-if="publishError" class="error">{{ publishError }}</p>
      <p v-if="addError" class="error">{{ addError }}</p>
      <p v-if="stepError" class="error">{{ stepError }}</p>
      <ul v-if="fileErrors.length" class="error">
        <li v-for="m in fileErrors" :key="m">{{ m }}</li>
      </ul>
    </div>

    <section v-if="demo && status !== 'draft'" class="share">
      <p v-if="status === 'published_dirty'" class="dirty">Ada perubahan yang belum diterbitkan. Klik "Terbitkan" agar penonton melihatnya.</p>
      <div class="share-row">
        <label for="share-url">Link publik</label>
        <input id="share-url" readonly :value="shareUrl" @focus="($event.target as HTMLInputElement).select()">
        <button type="button" @click="copy(shareUrl, 'link')">{{ copied === 'link' ? 'Tersalin' : 'Salin' }}</button>
      </div>
      <div class="share-row">
        <label for="share-code">Kode iframe</label>
        <input id="share-code" readonly :value="shareCode" @focus="($event.target as HTMLInputElement).select()">
        <button type="button" @click="copy(shareCode, 'code')">{{ copied === 'code' ? 'Tersalin' : 'Salin' }}</button>
      </div>
    </section>

    <main v-if="demo" class="layout">
      <EditorStepList
        :steps="steps"
        :active-index="activeIndex"
        :image-url="imageUrl"
        :busy="busy"
        @select="activeIndex = $event"
        @reorder="(from, to) => run(() => editor.reorder(from, to), 'Gagal mengubah urutan')"
        @remove="onRemove"
        @add="onAdd"
      />
      <EditorStepCanvas :step="active" :image-url="imageUrl" @place="onPlace" />
      <EditorTooltipPanel :step="active" @text="onText" @placement="onPlacement" />
    </main>
  </div>
</template>

<style scoped>
.bar {
  display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
  padding: 10px 16px; border-bottom: 1px solid var(--border); background: var(--bg);
  position: sticky; top: 0; z-index: 2;
}
.back { text-decoration: none; white-space: nowrap; }
.title { flex: 1 1 200px; max-width: 420px; font-weight: 600; }
.save { font-size: 0.85rem; color: var(--muted); min-width: 90px; }
.save.saved { color: var(--ok); }
.save.error { color: var(--danger); }
.actions { display: flex; gap: 8px; margin-left: auto; flex-wrap: wrap; }
.messages, .share { padding: 8px 16px; }
.messages p, .messages ul { margin: 4px 0; }
.share { background: var(--surface); border-bottom: 1px solid var(--border); display: grid; gap: 6px; }
.dirty { margin: 0; color: #b54708; font-size: 0.9rem; }
.share-row { display: grid; grid-template-columns: 110px 1fr auto; gap: 8px; align-items: center; }
.share-row label { font-size: 0.85rem; font-weight: 600; }
.layout {
  display: grid; grid-template-columns: 200px minmax(0, 1fr) 260px; gap: 16px; padding: 16px;
  align-items: start;
}
@media (max-width: 900px) {
  .layout { grid-template-columns: 1fr; }
  .share-row { grid-template-columns: 1fr auto; }
  .share-row label { grid-column: 1 / -1; }
}
</style>
