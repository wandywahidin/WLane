<script setup lang="ts">
definePageMeta({ ssr: false })
useSeoMeta({ title: 'Masuk — Panduan Interaktif' })

const supabase = useSupabaseClient()
const route = useRoute()
const errorMessage = computed(() => authErrorMessage(authErrorParams(route.query, route.hash)))
const loading = ref(false)

async function signIn() {
  loading.value = true
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin + '/dashboard' },
  })
  if (error) loading.value = false
}
</script>

<template>
  <main class="login">
    <h1>Masuk</h1>
    <p>Buat panduan interaktif untuk website Anda.</p>
    <p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p>
    <button type="button" :disabled="loading" @click="signIn">Mulai dengan Google</button>
    <p class="legal">
      Dengan masuk, Anda menyetujui <NuxtLink to="/syarat">syarat penggunaan</NuxtLink>
      dan <NuxtLink to="/privasi">kebijakan privasi</NuxtLink>.
    </p>
  </main>
</template>

<style scoped>
.login { max-width: 420px; margin: 15vh auto; padding: 0 16px; text-align: center; }
.error { color: #b42318; background: #fef3f2; padding: 8px 12px; border-radius: 6px; }
.legal { font-size: 0.85rem; color: #555; }
</style>
