<script setup lang="ts">
// Form masuk dan daftar (email + password). Dipakai pages/login.vue dan pages/daftar.vue.
import { MIN_PASSWORD, signInWithEmail, signUpWithEmail, validateCredentials } from '~/utils/email-auth'

const props = defineProps<{ mode: 'login' | 'register' }>()
const isRegister = computed(() => props.mode === 'register')

const supabase = useSupabaseClient()
const email = ref('')
const password = ref('')
const confirm = ref('')
const showPassword = ref(false)
const loading = ref(false)
const error = ref<string | null>(null)
const checkEmail = ref(false)

async function submit() {
  error.value = validateCredentials({
    email: email.value,
    password: password.value,
    confirm: isRegister.value ? confirm.value : undefined,
  })
  if (error.value) return
  loading.value = true
  try {
    if (isRegister.value) {
      const { signedIn } = await signUpWithEmail(supabase, email.value, password.value)
      if (!signedIn) {
        checkEmail.value = true
        return
      }
    } else {
      await signInWithEmail(supabase, email.value, password.value)
    }
    await navigateTo('/dashboard')
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div v-if="checkEmail" class="mt-6 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-900 ring-1 ring-emerald-200" role="status">
    Akun dibuat. Buka link konfirmasi yang kami kirim ke <strong>{{ email.trim() }}</strong>, lalu masuk.
  </div>

  <form v-else class="mt-6 space-y-4" novalidate @submit.prevent="submit">
    <div v-if="error" class="flex gap-3 rounded-lg bg-red-50 p-3 text-sm text-red-800 ring-1 ring-red-200" role="alert">
      <UiIcon name="warning" :size="18" class="mt-0.5 shrink-0 text-red-500" />
      <span>{{ error }}</span>
    </div>

    <div>
      <label for="auth-email" class="label">Email</label>
      <input id="auth-email" v-model="email" type="email" class="input" autocomplete="email" inputmode="email" placeholder="nama@contoh.com" required>
    </div>

    <div>
      <label for="auth-password" class="label">Password</label>
      <div class="relative">
        <input
          id="auth-password"
          v-model="password"
          :type="showPassword ? 'text' : 'password'"
          class="input pr-16"
          :autocomplete="isRegister ? 'new-password' : 'current-password'"
          :minlength="isRegister ? MIN_PASSWORD : undefined"
          required
        >
        <button
          type="button"
          class="absolute inset-y-0 right-0 px-3 text-xs font-semibold text-slate-500 hover:text-slate-800"
          :aria-pressed="showPassword"
          @click="showPassword = !showPassword"
        >
          {{ showPassword ? 'Sembunyikan' : 'Lihat' }}
        </button>
      </div>
      <p v-if="isRegister" class="mt-1.5 text-xs text-slate-500">Minimal {{ MIN_PASSWORD }} karakter.</p>
    </div>

    <div v-if="isRegister">
      <label for="auth-confirm" class="label">Ulangi password</label>
      <input id="auth-confirm" v-model="confirm" :type="showPassword ? 'text' : 'password'" class="input" autocomplete="new-password" required>
    </div>

    <button type="submit" class="btn-primary btn-lg w-full" :disabled="loading">
      <template v-if="loading">{{ isRegister ? 'Membuat akun…' : 'Masuk…' }}</template>
      <template v-else>{{ isRegister ? 'Buat akun' : 'Masuk' }}</template>
    </button>
  </form>

  <p class="mt-6 text-center text-sm text-slate-600">
    <template v-if="isRegister">
      Sudah punya akun?
      <NuxtLink to="/login" class="font-semibold text-brand-700 hover:underline">Masuk</NuxtLink>
    </template>
    <template v-else>
      Belum punya akun?
      <NuxtLink to="/daftar" class="font-semibold text-brand-700 hover:underline">Daftar gratis</NuxtLink>
    </template>
  </p>
</template>
