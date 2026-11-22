<script setup lang="ts">
useSeoMeta({ title: 'Masuk — WLane' })

const supabase = useSupabaseClient()
const route = useRoute()
// Error OAuth bisa datang lewat hash, yang hanya ada di browser.
const errorMessage = ref<string | null>(null)
onMounted(() => { errorMessage.value = authErrorMessage(authErrorParams(route.query, route.hash)) })
const loading = ref(false)

// Login dev (hardcode) hanya ada saat `npm run dev`; import dinamis ini dibuang dari build production.
const DevLogin = import.meta.dev ? defineAsyncComponent(() => import('~/components/DevLogin.vue')) : null

async function signIn() {
  loading.value = true
  try {
    await signInWithGoogle(supabase, window.location.origin)
  } catch {
    loading.value = false
    errorMessage.value = 'Login gagal, coba lagi'
  }
}
</script>

<template>
  <main class="relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-12">
    <div class="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60rem_40rem_at_50%_-10%,var(--color-brand-100),transparent)]" />

    <div class="w-full max-w-sm">
      <div class="mb-8 flex justify-center">
        <AppLogo />
      </div>

      <div class="card p-8">
        <h1 class="text-center text-2xl font-bold tracking-tight">Selamat datang</h1>
        <p class="mt-2 text-center text-sm text-slate-500">Masuk untuk membuat dan mengelola panduan interaktif Anda.</p>

        <div v-if="errorMessage" class="mt-6 flex gap-3 rounded-lg bg-red-50 p-3 text-sm text-red-800 ring-1 ring-red-200" role="alert">
          <UiIcon name="warning" :size="18" class="mt-0.5 text-red-500" />
          <span>{{ errorMessage }}</span>
        </div>

        <button type="button" class="btn-secondary btn-lg mt-6 w-full" :disabled="loading" @click="signIn">
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.45a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.57-5.17 3.57-8.81Z" />
            <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.92l-3.88-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.95H1.27v3.1A12 12 0 0 0 12 24Z" />
            <path fill="#FBBC05" d="M5.27 14.28A7.2 7.2 0 0 1 4.9 12c0-.79.14-1.56.37-2.28v-3.1H1.27a12 12 0 0 0 0 10.76l4-3.1Z" />
            <path fill="#EA4335" d="M12 4.77c1.76 0 3.34.61 4.59 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.27 6.62l4 3.1C6.22 6.88 8.87 4.77 12 4.77Z" />
          </svg>
          {{ loading ? 'Mengalihkan…' : 'Mulai dengan Google' }}
        </button>

        <component :is="DevLogin" v-if="DevLogin" />
      </div>

      <p class="mt-6 text-center text-xs leading-relaxed text-slate-500">
        Dengan masuk, Anda menyetujui
        <NuxtLink to="/syarat" class="font-medium text-slate-700 underline-offset-2 hover:underline">syarat penggunaan</NuxtLink>
        dan
        <NuxtLink to="/privasi" class="font-medium text-slate-700 underline-offset-2 hover:underline">kebijakan privasi</NuxtLink>.
      </p>
    </div>
  </main>
</template>
