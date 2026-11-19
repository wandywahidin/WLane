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
    .select('image_path, image_width, image_height, hotspot_x, hotspot_y, tooltip_text, tooltip_placement')
    .eq('demo_id', demo.id)
    .order('position', { ascending: true })
  return { title: demo.title, slug: demo.slug, steps: (rows ?? []) as SnapshotStep[] }
}

async function loadPublished(): Promise<PublishedDemo | null> {
  const { data, error } = await supabase.rpc('get_published_demo', { p_slug: slug })
  if (error) throw error
  return (data as PublishedDemo | null) ?? null
}

const { data, pending } = await useAsyncData(
  `demo:${slug}:${preview ? 'preview' : 'published'}`,
  () => (preview ? loadPreview() : loadPublished()),
  { server: !preview },
)

const found = computed(() => !!data.value && data.value.steps.length > 0)

if (import.meta.server && !preview && !found.value) {
  const event = useRequestEvent()
  if (event) setResponseStatus(event, 404)
}

const imageUrl = (path: string) => publicImageUrl(supabase, path)
const first = computed<Pick<Step, 'image_path'> | undefined>(() => data.value?.steps[0])

useSeoMeta({
  title: () => (found.value ? `${data.value!.title} — Panduan Interaktif` : 'Demo tidak ditemukan'),
  ogTitle: () => (found.value ? data.value!.title : 'Demo tidak ditemukan'),
  ogDescription: 'Panduan interaktif langkah demi langkah.',
  ogImage: () => (first.value ? imageUrl(first.value.image_path) : undefined),
  twitterCard: 'summary_large_image',
  robots: () => (preview || !found.value ? 'noindex, nofollow' : undefined),
})
</script>

<template>
  <div class="page" :class="{ embed }">
    <header v-if="!embed && found" class="head">
      <h1>{{ data!.title }}</h1>
      <span v-if="preview" class="badge">Pratinjau draft</span>
    </header>

    <p v-if="pending" class="state">Memuat…</p>
    <PlayerDemoPlayer v-else-if="found" :steps="data!.steps" :image-url="imageUrl" :fit="embed" />
    <div v-else class="state not-found">
      <h1>Demo tidak ditemukan</h1>
      <p>Link ini mungkin salah, atau demonya belum atau tidak lagi diterbitkan.</p>
    </div>

    <footer v-if="!embed" class="foot">
      Dibuat dengan <NuxtLink to="/">Panduan Interaktif</NuxtLink>
    </footer>
  </div>
</template>

<style scoped>
.page { max-width: 1280px; margin: 0 auto; padding: 16px; }
.page.embed { padding: 0; max-width: none; }
.head { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.head h1 { font-size: 1.25rem; margin: 0; }
.badge { font-size: 0.8rem; background: #fef0c7; color: #93370d; padding: 2px 8px; border-radius: 99px; }
.state { text-align: center; padding: 48px 16px; color: var(--muted); }
.not-found h1 { color: var(--fg); font-size: 1.4rem; }
.foot { margin-top: 24px; text-align: center; font-size: 0.85rem; color: var(--muted); }
</style>
