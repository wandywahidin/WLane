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
  <section class="dev">
    <p><strong>Mode dev</strong> — akun hardcode untuk Supabase lokal</p>
    <p class="creds">{{ DEV_EMAIL }} / {{ DEV_PASSWORD }}</p>
    <button type="button" :disabled="loading" @click="signIn">Masuk sebagai akun dev</button>
    <p v-if="error" class="error">{{ error }}</p>
  </section>
</template>

<style scoped>
.dev { margin-top: 24px; padding: 12px; border: 2px dashed #f79009; border-radius: 8px; background: #fffaeb; }
.dev p { margin: 4px 0; }
.creds { font-family: ui-monospace, monospace; }
</style>
