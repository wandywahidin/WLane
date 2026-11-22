<script setup lang="ts">
import type { DemoListItem } from '~/types/demo'

definePageMeta({ middleware: 'auth' })
useSeoMeta({ title: 'Demo saya — WLane' })

const supabase = useSupabaseClient()
const { demos, load, create, remove, error } = useDemos()
const loading = ref(true)
const busy = ref(false)

const createOpen = ref(false)
const newTitle = ref('')
const toDelete = ref<DemoListItem | null>(null)

onMounted(async () => {
  try { await load() } catch { /* error.value sudah diisi */ }
  loading.value = false
})

function openCreate() {
  newTitle.value = ''
  createOpen.value = true
}

async function onCreate() {
  const title = newTitle.value.trim()
  if (!title) return
  busy.value = true
  try {
    const demo = await create(title)
    createOpen.value = false
    await navigateTo(`/editor/${demo.id}`)
  } catch { /* pesan ditampilkan lewat error */ } finally {
    busy.value = false
  }
}

async function onDelete() {
  if (!toDelete.value) return
  busy.value = true
  try {
    await remove(toDelete.value.id)
    toDelete.value = null
  } catch { /* error */ } finally {
    busy.value = false
  }
}

const imageUrl = (path: string) => publicImageUrl(supabase, path)
const fmt = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
</script>

<template>
  <div class="min-h-dvh">
    <AppHeader />

    <main class="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold tracking-tight sm:text-3xl">Demo saya</h1>
          <p class="mt-1 text-sm text-slate-500">Panduan interaktif yang Anda buat untuk website Anda.</p>
        </div>
        <button type="button" class="btn-primary" :disabled="busy" @click="openCreate">
          <UiIcon name="plus" :size="18" />
          Buat demo
        </button>
      </div>

      <div v-if="error" class="mt-6 flex gap-3 rounded-lg bg-red-50 p-3 text-sm text-red-800 ring-1 ring-red-200" role="alert">
        <UiIcon name="warning" :size="18" class="mt-0.5 text-red-500" />
        {{ error }}
      </div>

      <!-- memuat -->
      <div v-if="loading" class="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div v-for="i in 3" :key="i" class="card animate-pulse overflow-hidden">
          <div class="aspect-[16/10] bg-slate-100" />
          <div class="space-y-2 p-4"><div class="h-4 w-2/3 rounded bg-slate-100" /><div class="h-3 w-1/3 rounded bg-slate-100" /></div>
        </div>
      </div>

      <!-- kosong -->
      <div v-else-if="demos.length === 0" class="card mt-8 flex flex-col items-center px-6 py-16 text-center">
        <div class="grid size-14 place-items-center rounded-2xl bg-brand-50 text-brand-600">
          <UiIcon name="cursor" :size="28" />
        </div>
        <h2 class="mt-4 text-lg font-bold">Belum ada demo</h2>
        <p class="mt-1 max-w-sm text-sm text-slate-500">
          Buat demo pertama: unggah beberapa screenshot, tandai bagian yang harus diklik, lalu bagikan link-nya.
        </p>
        <button type="button" class="btn-primary mt-6" @click="openCreate">
          <UiIcon name="plus" :size="18" />
          Buat demo
        </button>
      </div>

      <!-- daftar -->
      <ul v-else class="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <li v-for="demo in demos" :key="demo.id" class="card group flex flex-col overflow-hidden transition hover:shadow-md hover:ring-slate-300">
          <NuxtLink :to="`/editor/${demo.id}`" class="relative block aspect-[16/10] overflow-hidden bg-slate-100">
            <img
              v-if="demo.thumbnail_path"
              :src="imageUrl(demo.thumbnail_path)"
              alt=""
              loading="lazy"
              class="size-full object-cover object-top transition duration-300 group-hover:scale-[1.02]"
            >
            <div v-else class="grid size-full place-items-center text-slate-300">
              <UiIcon name="photo" :size="40" />
            </div>
            <span class="absolute top-3 left-3"><StatusBadge :status="demoStatus(demo)" /></span>
          </NuxtLink>

          <div class="flex flex-1 flex-col p-4">
            <NuxtLink :to="`/editor/${demo.id}`" class="line-clamp-1 font-semibold text-slate-900 hover:text-brand-700">
              {{ demo.title || 'Tanpa judul' }}
            </NuxtLink>
            <p class="mt-1 text-xs text-slate-500">
              {{ demo.step_count }} langkah · Diubah {{ fmt.format(new Date(demo.updated_at)) }}
            </p>

            <div class="mt-4 flex items-center gap-1 border-t border-slate-100 pt-3">
              <NuxtLink :to="`/editor/${demo.id}`" class="btn-ghost px-2.5 py-1.5">
                <UiIcon name="pencil" :size="16" />
                Edit
              </NuxtLink>
              <a
                v-if="demo.status === 'published'"
                :href="`/d/${demo.slug}`"
                target="_blank"
                rel="noopener"
                class="btn-ghost px-2.5 py-1.5"
              >
                <UiIcon name="external" :size="16" />
                Lihat
              </a>
              <button
                type="button"
                class="btn-icon ml-auto text-slate-400 hover:bg-red-50 hover:text-red-600"
                :aria-label="`Hapus ${demo.title}`"
                :disabled="busy"
                @click="toDelete = demo"
              >
                <UiIcon name="trash" :size="18" />
              </button>
            </div>
          </div>
        </li>
      </ul>
    </main>

    <!-- modal buat demo -->
    <UiModal :open="createOpen" title="Buat demo baru" @close="createOpen = false">
      <form id="create-form" @submit.prevent="onCreate">
        <label for="new-title" class="label">Judul demo</label>
        <input
          id="new-title"
          v-model="newTitle"
          class="input"
          maxlength="120"
          placeholder="Contoh: Cara menambah transaksi"
          autofocus
          required
        >
        <p class="mt-2 text-xs text-slate-500">Judul tampil di halaman demo dan saat link dibagikan.</p>
      </form>
      <template #actions>
        <button type="button" class="btn-secondary" @click="createOpen = false">Batal</button>
        <button type="submit" form="create-form" class="btn-primary" :disabled="busy || !newTitle.trim()">
          {{ busy ? 'Membuat…' : 'Buat dan buka editor' }}
        </button>
      </template>
    </UiModal>

    <!-- modal hapus -->
    <UiModal :open="!!toDelete" title="Hapus demo?" @close="toDelete = null">
      <p class="text-sm text-slate-600">
        Demo <strong class="text-slate-900">{{ toDelete?.title }}</strong> beserta semua screenshot-nya akan dihapus permanen.
        Link dan iframe yang sudah dibagikan akan berhenti berfungsi.
      </p>
      <template #actions>
        <button type="button" class="btn-secondary" @click="toDelete = null">Batal</button>
        <button type="button" class="btn-danger" :disabled="busy" @click="onDelete">
          {{ busy ? 'Menghapus…' : 'Hapus demo' }}
        </button>
      </template>
    </UiModal>
  </div>
</template>
