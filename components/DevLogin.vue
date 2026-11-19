<script setup lang="ts">
// Hanya dimuat saat `npm run dev` (lihat pages/login.vue); tidak ikut build production.
import { DEV_EMAIL, DEV_PASSWORD, devSignIn } from '~/utils/dev-login'

const supabase = useSupabaseClient()
const loading = ref(false)
const error = ref<string | null>(null)

async function signIn() {
  loading.value = true
  error.value = null
  try {
    await devSignIn(supabase)
    await navigateTo('/dashboard')
  } catch (e) {
    error.value = `Login dev gagal: ${(e as Error).message}`
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="mt-6 rounded-xl border-2 border-dashed border-amber-300 bg-amber-50 p-4">
    <div class="flex items-center gap-2 text-xs font-bold tracking-wide text-amber-800 uppercase">
      <UiIcon name="bolt" :size="14" />
      Mode dev
    </div>
    <p class="mt-1 text-xs text-amber-900/80">Akun hardcode, hanya untuk Supabase lokal.</p>
    <dl class="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 font-mono text-xs text-amber-950">
      <dt class="text-amber-700">email</dt><dd>{{ DEV_EMAIL }}</dd>
      <dt class="text-amber-700">pass</dt><dd>{{ DEV_PASSWORD }}</dd>
    </dl>
    <button type="button" class="btn mt-3 w-full bg-amber-500 text-white hover:bg-amber-600" :disabled="loading" @click="signIn">
      Masuk sebagai akun dev
    </button>
    <p v-if="error" class="mt-2 text-xs text-red-700">{{ error }}</p>
  </div>
</template>
