<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
useSeoMeta({ title: 'Akun — Panduan Interaktif' })

const supabase = useSupabaseClient()
const email = ref<string | null>(null)
const confirmText = ref('')
const busy = ref(false)
const error = ref<string | null>(null)

onMounted(async () => {
  const { data } = await supabase.auth.getUser()
  email.value = data.user?.email ?? null
})

async function onSignOut() {
  await supabase.auth.signOut()
  await navigateTo('/')
}

async function onDelete() {
  if (confirmText.value !== 'HAPUS') return
  busy.value = true
  error.value = null
  try {
    await deleteAccount(supabase)
    await navigateTo('/')
  } catch {
    error.value = 'Gagal menghapus akun, coba lagi.'
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="container narrow">
    <NuxtLink to="/dashboard">← Demo saya</NuxtLink>
    <h1>Akun</h1>
    <p v-if="email">Masuk sebagai <strong>{{ email }}</strong></p>
    <button type="button" @click="onSignOut">Keluar</button>

    <section class="danger-zone">
      <h2>Hapus akun</h2>
      <p>
        Semua demo, langkah, dan screenshot Anda akan dihapus permanen. Link dan iframe yang sudah
        dibagikan akan menampilkan "Demo tidak ditemukan". Tindakan ini tidak bisa dibatalkan.
      </p>
      <label for="confirm">Ketik <strong>HAPUS</strong> untuk konfirmasi</label>
      <input id="confirm" v-model="confirmText" autocomplete="off" placeholder="HAPUS">
      <p v-if="error" class="error" role="alert">{{ error }}</p>
      <button type="button" class="danger" :disabled="busy || confirmText !== 'HAPUS'" @click="onDelete">
        {{ busy ? 'Menghapus…' : 'Hapus akun dan semua data' }}
      </button>
    </section>
  </div>
</template>

<style scoped>
.narrow { max-width: 560px; }
.danger-zone { margin-top: 32px; padding: 16px; border: 1px solid #f4c7c3; border-radius: var(--radius); display: grid; gap: 8px; }
.danger-zone h2 { margin: 0; font-size: 1.1rem; color: var(--danger); }
.danger-zone p { margin: 0; }
</style>
