<script setup lang="ts">
import type { PublishedDemo, SnapshotStep, Step } from '~/types/demo'

const route = useRoute()
const supabase = useSupabaseClient()
const slug = String(route.params.slug)
const embed = computed(() => route.query.embed === '1')
const preview = route.query.preview === '1'

// Pratinjau: hanya pemilik (RLS) dan hanya di browser, membaca draft dari tabel steps.
async function loadPreview(): Promise<PublishedDemo | null> {
  const { data: demo } = await supabase.from('demos').select('id, title, slug').eq('slug', slug).maybeSingle()
  if (!demo) return null
  const { data: rows } = await supabase
    .from('steps')
    .select('image_path, image_width, image_height, hotspot_x, hotspot_y, tooltip_text, tooltip_placement, kind, area_w, area_h, modal_title, modal_body, buttons')
    .eq('demo_id', demo.id)
    .order('position', { ascending: true })
  return { title: demo.title, slug: demo.slug, steps: (rows ?? []) as SnapshotStep[] }
}

async function loadPublished(): Promise<PublishedDemo | null> {
  const { data, error } = await supabase.rpc('get_published_demo', { p_slug: slug })
  if (error) throw error
  return (data as PublishedDemo | null) ?? null
}

// `false` (bukan null) untuk "tidak ada": useAsyncData mengambil ulang di klien kalau hasilnya null,
// yang membuat hydration tidak cocok.
const { data, pending } = await useAsyncData(
  `demo:${slug}:${preview ? 'preview' : 'published'}`,
  async () => (await (preview ? loadPreview() : loadPublished())) ?? false,
  { server: !preview },
)

const demo = computed<PublishedDemo | null>(() => data.value || null)
const found = computed(() => !!demo.value && demo.value.steps.length > 0)

if (import.meta.server && !preview && !found.value) {
  const event = useRequestEvent()
  if (event) setResponseStatus(event, 404)
}

const imageUrl = (path: string) => publicImageUrl(supabase, path)
const first = computed<Pick<Step, 'image_path'> | undefined>(() => demo.value?.steps[0])

useSeoMeta({
  title: () => (found.value ? `${demo.value!.title} — Panduan Interaktif` : 'Demo tidak ditemukan'),
  ogTitle: () => (found.value ? demo.value!.title : 'Demo tidak ditemukan'),
  ogDescription: 'Panduan interaktif langkah demi langkah.',
  ogImage: () => (first.value ? imageUrl(first.value.image_path) : undefined),
  twitterCard: 'summary_large_image',
  robots: () => (preview || !found.value ? 'noindex, nofollow' : undefined),
})
useHead({ bodyAttrs: { class: () => (embed.value ? 'bg-white' : '') } })
</script>

<template>
  <div v-if="embed" class="bg-white">
    <p v-if="pending" class="grid h-screen place-items-center text-sm text-slate-400">Memuat…</p>
    <PlayerDemoPlayer v-else-if="found" :steps="demo!.steps" :image-url="imageUrl" fit />
    <div v-else class="grid h-screen place-items-center p-6 text-center">
      <div>
        <h1 class="text-lg font-bold">Demo tidak ditemukan</h1>
        <p class="mt-1 text-sm text-slate-500">Demo ini belum atau tidak lagi diterbitkan.</p>
      </div>
    </div>
  </div>

  <div v-else class="flex min-h-dvh flex-col">
    <div v-if="preview" class="flex items-center justify-center gap-2 bg-amber-400 px-4 py-2 text-sm font-semibold text-amber-950">
      <UiIcon name="eye" :size="16" />
      Pratinjau draft — hanya Anda yang bisa melihat ini
    </div>

    <header v-if="found" class="mx-auto w-full max-w-6xl px-4 pt-6 pb-4 sm:px-6 sm:pt-10">
      <p class="text-xs font-semibold tracking-wide text-brand-600 uppercase">Panduan interaktif</p>
      <h1 class="mt-1 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{{ demo!.title }}</h1>
      <p class="mt-1 text-sm text-slate-500">Klik titik biru yang berdenyut untuk lanjut ke langkah berikutnya.</p>
    </header>

    <main class="flex-1 px-4 pb-10 sm:px-6">
      <p v-if="pending" class="py-24 text-center text-sm text-slate-400">Memuat…</p>
      <PlayerDemoPlayer v-else-if="found" :steps="demo!.steps" :image-url="imageUrl" />
      <div v-else class="mx-auto flex max-w-md flex-col items-center py-24 text-center">
        <div class="grid size-14 place-items-center rounded-2xl bg-slate-100 text-slate-400">
          <UiIcon name="photo" :size="28" />
        </div>
        <h1 class="mt-4 text-xl font-bold">Demo tidak ditemukan</h1>
        <p class="mt-2 text-sm text-slate-500">Link ini mungkin salah, atau demonya belum atau tidak lagi diterbitkan.</p>
        <NuxtLink to="/" class="btn-secondary mt-6">Ke beranda</NuxtLink>
      </div>
    </main>

    <footer class="border-t border-slate-200 py-5 text-center text-xs text-slate-500">
      Dibuat dengan <NuxtLink to="/" class="font-semibold text-slate-700 hover:text-brand-700">Panduan Interaktif</NuxtLink>
    </footer>
  </div>
</template>
