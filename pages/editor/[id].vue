<script setup lang="ts">
import type { StepKind } from '~/types/demo'
import type { Area } from '~/utils/area'
import type { StepPatch } from '~/composables/useEditor'

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
const shareOpen = ref(false)

useSeoMeta({ title: () => `${demo.value?.title || 'Editor'} — WLane` })

const imageUrl = (path: string) => publicImageUrl(supabase, path)
const active = computed(() => steps.value[activeIndex.value] ?? null)
const status = computed(() => (demo.value ? demoStatus(demo.value) : 'draft'))
const shareUrl = computed(() => (demo.value ? publicDemoUrl(origin.value, demo.value.slug) : ''))
const shareCode = computed(() => (demo.value ? embedCode(origin.value, demo.value.slug) : ''))
// Hanya langkah sorotan yang butuh hotspot.
const missingHotspots = computed(() => steps.value.filter(s => s.kind !== 'modal' && s.hotspot_x === null).length)

const SAVE = {
  idle: { label: 'Semua perubahan tersimpan otomatis', icon: 'cloud', cls: 'text-slate-400' },
  saving: { label: 'Menyimpan…', icon: 'refresh', cls: 'text-slate-500' },
  saved: { label: 'Tersimpan', icon: 'check-circle', cls: 'text-emerald-600' },
  error: { label: 'Gagal menyimpan, mencoba lagi…', icon: 'cloud-x', cls: 'text-red-600' },
} as const

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
  const before = steps.value.length
  const failed = await editor.addImages(files)
  fileErrors.value = failed.map(f => `${f.name}: ${REASON[f.error] ?? f.error}`)
  if (steps.value.length > before) activeIndex.value = before
}

async function run(fn: () => Promise<void>, message: string) {
  stepError.value = null
  try { await fn() } catch { stepError.value = message; await editor.load().catch(() => {}) }
}

const toRemove = ref<string | null>(null)
function onRemove() {
  const id = toRemove.value
  toRemove.value = null
  if (id) void run(() => editor.removeStep(id), 'Gagal menghapus langkah')
}

function onArea(a: Area) {
  if (active.value) editor.updateStep(active.value.id, { hotspot_x: a.x, hotspot_y: a.y, area_w: a.w, area_h: a.h })
}
function onKind(kind: StepKind) {
  if (active.value) editor.setKind(active.value.id, kind)
}
function onPatch(patch: StepPatch) {
  if (active.value) editor.updateStep(active.value.id, patch)
}

async function onTitle(e: Event) {
  const title = (e.target as HTMLInputElement).value.trim()
  if (demo.value && title && title !== demo.value.title) {
    await run(() => editor.rename(title), 'Gagal mengganti judul')
  }
}

async function onPublish() {
  await editor.publish()
  if (!publishError.value) shareOpen.value = true
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

function onKey(e: KeyboardEvent) {
  const t = e.target as HTMLElement
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName)) return
  if (e.key === 'ArrowDown' && activeIndex.value < steps.value.length - 1) { activeIndex.value++; e.preventDefault() }
  if (e.key === 'ArrowUp' && activeIndex.value > 0) { activeIndex.value--; e.preventDefault() }
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="flex h-dvh flex-col bg-slate-100">
    <!-- bilah atas -->
    <header class="z-20 flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-slate-200 bg-white px-3 py-2.5 sm:px-4">
      <NuxtLink to="/dashboard" class="btn-icon text-slate-500" aria-label="Kembali ke Demo saya" title="Demo saya">
        <UiIcon name="arrow-left" />
      </NuxtLink>

      <div class="min-w-0 flex-1 basis-48">
        <input
          v-if="demo"
          class="w-full max-w-md truncate rounded-md border-0 bg-transparent px-2 py-1 text-base font-bold text-slate-900 hover:bg-slate-100 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
          :value="demo.title"
          aria-label="Judul demo"
          maxlength="120"
          @change="onTitle"
        >
        <div class="flex items-center gap-2 px-2">
          <StatusBadge v-if="demo" :status="status" />
          <span class="inline-flex items-center gap-1 text-xs" :class="SAVE[saveState].cls" role="status">
            <UiIcon :name="SAVE[saveState].icon" :size="14" :class="{ 'animate-spin': saveState === 'saving' }" />
            {{ SAVE[saveState].label }}
          </span>
        </div>
      </div>

      <div class="ml-auto flex items-center gap-2">
        <button type="button" class="btn-ghost" :disabled="!demo || steps.length === 0" @click="onPreview">
          <UiIcon name="eye" :size="18" />
          <span class="hidden sm:inline">Pratinjau</span>
        </button>
        <button v-if="status !== 'draft'" type="button" class="btn-secondary" @click="shareOpen = true">
          <UiIcon name="share" :size="18" />
          <span class="hidden sm:inline">Bagikan</span>
        </button>
        <button type="button" class="btn-primary" :disabled="busy || !demo" @click="onPublish">
          <UiIcon name="bolt" :size="18" />
          {{ status === 'published' ? 'Terbitkan' : status === 'published_dirty' ? 'Terbitkan perubahan' : 'Terbitkan' }}
        </button>
      </div>
    </header>

    <!-- pesan -->
    <div v-if="loadError || publishError || addError || stepError || fileErrors.length" class="space-y-2 border-b border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
      <p v-for="m in [loadError, publishError, addError, stepError].filter(Boolean)" :key="m!" class="flex items-center gap-2">
        <UiIcon name="warning" :size="16" class="text-red-500" /> {{ m }}
      </p>
      <div v-if="fileErrors.length" class="flex gap-2">
        <UiIcon name="warning" :size="16" class="mt-0.5 text-red-500" />
        <div>
          <p class="font-semibold">Beberapa file tidak diunggah:</p>
          <ul class="mt-1 list-disc pl-5">
            <li v-for="m in fileErrors" :key="m">{{ m }}</li>
          </ul>
        </div>
        <button type="button" class="ml-auto self-start text-red-500 hover:text-red-700" aria-label="Tutup" @click="fileErrors = []">
          <UiIcon name="x" :size="16" />
        </button>
      </div>
    </div>
    <div v-else-if="status === 'published_dirty'" class="flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
      <UiIcon name="warning" :size="16" class="text-amber-500" />
      Penonton masih melihat versi lama. Klik <strong>Terbitkan perubahan</strong> agar perubahan Anda tampil.
    </div>
    <div v-else-if="steps.length > 0 && missingHotspots > 0 && status === 'draft'" class="flex items-center gap-2 border-b border-slate-200 bg-white px-4 py-2 text-sm text-slate-600">
      <UiIcon name="cursor" :size="16" class="text-amber-500" />
      {{ missingHotspots }} langkah belum punya hotspot. Klik atau tarik di gambar untuk menandainya.
    </div>

    <!-- isi -->
    <main v-if="demo" class="grid min-h-0 flex-1 grid-rows-[auto_1fr_auto] lg:grid-cols-[17rem_minmax(0,1fr)_20rem] lg:grid-rows-1">
      <EditorStepList
        class="border-b border-slate-200 bg-white lg:border-r lg:border-b-0"
        :steps="steps"
        :active-index="activeIndex"
        :image-url="imageUrl"
        :busy="busy"
        @select="activeIndex = $event"
        @reorder="(from, to) => run(() => editor.reorder(from, to), 'Gagal mengubah urutan')"
        @remove="toRemove = $event"
        @add="onAdd"
      />
      <EditorStepCanvas
        class="overflow-auto p-4 sm:p-8"
        :step="active"
        :image-url="imageUrl"
        :busy="busy"
        @area="onArea"
        @add="onAdd"
      />
      <EditorStepPanel
        class="overflow-auto border-t border-slate-200 bg-white lg:border-t-0 lg:border-l"
        :step="active"
        :index="activeIndex"
        @kind="onKind"
        @patch="onPatch"
      />
    </main>
    <div v-else-if="!loadError" class="grid flex-1 place-items-center text-sm text-slate-400">Memuat editor…</div>

    <!-- hapus langkah -->
    <UiModal :open="!!toRemove" title="Hapus langkah ini?" @close="toRemove = null">
      <p class="text-sm text-slate-600">Langkah dihapus dari draft. Versi yang sudah terbit tidak berubah sampai Anda menerbitkan lagi.</p>
      <template #actions>
        <button type="button" class="btn-secondary" @click="toRemove = null">Batal</button>
        <button type="button" class="btn-danger" @click="onRemove">Hapus langkah</button>
      </template>
    </UiModal>

    <!-- bagikan -->
    <UiModal :open="shareOpen" title="Bagikan demo" size="lg" @close="shareOpen = false">
      <div v-if="status === 'published'" class="mb-5 flex items-center gap-3 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800 ring-1 ring-emerald-200">
        <UiIcon name="check-circle" class="text-emerald-600" />
        Demo sudah terbit. Siapa saja yang punya link bisa membukanya, tanpa login.
      </div>

      <div class="space-y-5">
        <div>
          <label for="share-url" class="label flex items-center gap-1.5"><UiIcon name="link" :size="16" /> Link publik</label>
          <div class="flex gap-2">
            <input id="share-url" readonly :value="shareUrl" class="input font-mono text-xs" @focus="($event.target as HTMLInputElement).select()">
            <button type="button" class="btn-secondary" @click="copy(shareUrl, 'link')">
              <UiIcon :name="copied === 'link' ? 'check' : 'copy'" :size="16" />
              {{ copied === 'link' ? 'Tersalin' : 'Salin' }}
            </button>
          </div>
        </div>
        <div>
          <label for="share-code" class="label flex items-center gap-1.5"><UiIcon name="code" :size="16" /> Tanam di website (iframe)</label>
          <textarea id="share-code" readonly rows="3" :value="shareCode" class="input resize-none font-mono text-xs" @focus="($event.target as HTMLTextAreaElement).select()" />
          <button type="button" class="btn-secondary mt-2" @click="copy(shareCode, 'code')">
            <UiIcon :name="copied === 'code' ? 'check' : 'copy'" :size="16" />
            {{ copied === 'code' ? 'Tersalin' : 'Salin kode' }}
          </button>
        </div>
      </div>

      <template #actions>
        <button type="button" class="btn-ghost text-red-600 hover:bg-red-50 hover:text-red-700 sm:mr-auto" :disabled="busy" @click="editor.unpublish(); shareOpen = false">
          Batalkan terbit
        </button>
        <a :href="shareUrl" target="_blank" rel="noopener" class="btn-secondary">
          <UiIcon name="external" :size="16" /> Buka demo
        </a>
        <button type="button" class="btn-primary" @click="shareOpen = false">Selesai</button>
      </template>
    </UiModal>
  </div>
</template>
