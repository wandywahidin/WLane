<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
useSeoMeta({ title: 'Akun — WLane' })

const supabase = useSupabaseClient()
const email = ref<string | null>(null)
const confirmText = ref('')
const busy = ref(false)
const error = ref<string | null>(null)
const deleteOpen = ref(false)

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
  <div class="min-h-dvh">
    <AppHeader />

    <main class="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
      <h1 class="text-2xl font-bold tracking-tight sm:text-3xl">Akun</h1>

      <section class="card mt-8 flex flex-wrap items-center gap-4 p-6">
        <div class="grid size-12 place-items-center rounded-full bg-brand-100 text-lg font-bold text-brand-700 uppercase">
          {{ email?.[0] ?? '?' }}
        </div>
        <div class="min-w-0 flex-1">
          <p class="text-xs font-semibold tracking-wide text-slate-400 uppercase">Masuk sebagai</p>
          <p class="truncate font-semibold text-slate-900">{{ email ?? '…' }}</p>
        </div>
        <button type="button" class="btn-secondary" @click="onSignOut">
          <UiIcon name="logout" :size="18" /> Keluar
        </button>
      </section>

      <section class="card mt-6 overflow-hidden ring-red-200">
        <div class="border-b border-red-100 bg-red-50/60 px-6 py-4">
          <h2 class="font-bold text-red-700">Zona berbahaya</h2>
        </div>
        <div class="flex flex-wrap items-center gap-4 p-6">
          <div class="min-w-0 flex-1 basis-64">
            <p class="font-semibold text-slate-900">Hapus akun dan semua data</p>
            <p class="mt-1 text-sm text-slate-500">
              Semua demo, langkah, dan screenshot dihapus permanen. Link dan iframe yang sudah dibagikan akan berhenti berfungsi.
            </p>
          </div>
          <button type="button" class="btn-danger" @click="deleteOpen = true; confirmText = ''">
            <UiIcon name="trash" :size="18" /> Hapus akun
          </button>
        </div>
      </section>
    </main>

    <UiModal :open="deleteOpen" title="Hapus akun secara permanen?" @close="deleteOpen = false">
      <p class="text-sm text-slate-600">Tindakan ini tidak bisa dibatalkan. Ketik <strong class="font-mono text-slate-900">HAPUS</strong> untuk konfirmasi.</p>
      <input v-model="confirmText" class="input mt-4 font-mono" autocomplete="off" placeholder="HAPUS" aria-label="Ketik HAPUS untuk konfirmasi">
      <p v-if="error" class="mt-3 text-sm text-red-600" role="alert">{{ error }}</p>
      <template #actions>
        <button type="button" class="btn-secondary" @click="deleteOpen = false">Batal</button>
        <button type="button" class="btn-danger" :disabled="busy || confirmText !== 'HAPUS'" @click="onDelete">
          {{ busy ? 'Menghapus…' : 'Hapus akun dan semua data' }}
        </button>
      </template>
    </UiModal>
  </div>
</template>
