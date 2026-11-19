<script setup lang="ts">
import type { Demo } from '~/types/demo'

definePageMeta({ middleware: 'auth' })
useSeoMeta({ title: 'Demo saya — Panduan Interaktif' })

const { demos, load, create, remove, error } = useDemos()
const loading = ref(true)
const busy = ref(false)

onMounted(async () => {
  try { await load() } catch { /* error.value sudah diisi */ }
  loading.value = false
})

async function onCreate() {
  const title = window.prompt('Judul demo', 'Demo baru')?.trim()
  if (!title) return
  busy.value = true
  try {
    const demo = await create(title)
    await navigateTo(`/editor/${demo.id}`)
  } catch { /* pesan ditampilkan lewat error */ } finally {
    busy.value = false
  }
}

async function onDelete(demo: Demo) {
  if (!window.confirm(`Hapus demo "${demo.title}" beserta semua gambarnya? Tindakan ini tidak bisa dibatalkan.`)) return
  busy.value = true
  try { await remove(demo.id) } catch { /* error */ } finally { busy.value = false }
}

const fmt = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
</script>

<template>
  <div class="container">
    <header class="top">
      <h1>Demo saya</h1>
      <nav>
        <NuxtLink to="/akun">Akun</NuxtLink>
        <button type="button" class="primary" :disabled="busy" @click="onCreate">Buat demo</button>
      </nav>
    </header>

    <p v-if="error" class="error" role="alert">{{ error }}</p>
    <p v-if="loading">Memuat…</p>
    <p v-else-if="demos.length === 0" class="empty">Belum ada demo. Klik "Buat demo" untuk memulai.</p>

    <ul v-else class="list">
      <li v-for="demo in demos" :key="demo.id">
        <NuxtLink :to="`/editor/${demo.id}`" class="title">{{ demo.title || 'Tanpa judul' }}</NuxtLink>
        <span class="status" :data-status="demoStatus(demo)">{{ DEMO_STATUS_LABEL[demoStatus(demo)] }}</span>
        <time :datetime="demo.updated_at">Diubah {{ fmt.format(new Date(demo.updated_at)) }}</time>
        <button type="button" class="danger" :disabled="busy" @click="onDelete(demo)">Hapus</button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.top { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }
.top nav { display: flex; gap: 12px; align-items: center; }
.list { list-style: none; padding: 0; margin: 16px 0; display: grid; gap: 8px; }
.list li {
  display: grid; grid-template-columns: 1fr auto auto auto; gap: 12px; align-items: center;
  padding: 12px 16px; border: 1px solid var(--border); border-radius: var(--radius);
}
.title { font-weight: 600; text-decoration: none; }
.status { font-size: 0.85rem; padding: 2px 8px; border-radius: 99px; background: var(--surface); }
.status[data-status='published'] { color: var(--ok); }
.status[data-status='published_dirty'] { color: #b54708; }
time { color: var(--muted); font-size: 0.85rem; }
.empty { color: var(--muted); }
@media (max-width: 640px) {
  .list li { grid-template-columns: 1fr auto; }
  time { grid-column: 1; }
}
</style>
