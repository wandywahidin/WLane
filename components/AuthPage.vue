<script setup lang="ts">
// Kerangka halaman masuk/daftar: logo, kartu, dan catatan syarat & privasi.
defineProps<{ title: string; subtitle: string }>()
</script>

<template>
  <main class="relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-12">
    <div class="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60rem_40rem_at_50%_-10%,var(--color-brand-100),transparent)]" />

    <div class="w-full max-w-sm">
      <div class="mb-8 flex justify-center">
        <AppLogo />
      </div>

      <div class="card p-8">
        <h1 class="text-center text-2xl font-bold tracking-tight">{{ title }}</h1>
        <p class="mt-2 text-center text-sm text-slate-500">{{ subtitle }}</p>
        <slot />
      </div>

      <p class="mt-6 text-center text-xs leading-relaxed text-slate-500">
        Dengan melanjutkan, Anda menyetujui
        <NuxtLink to="/syarat" class="font-medium text-slate-700 underline-offset-2 hover:underline">syarat penggunaan</NuxtLink>
        dan
        <NuxtLink to="/privasi" class="font-medium text-slate-700 underline-offset-2 hover:underline">kebijakan privasi</NuxtLink>.
      </p>
    </div>
  </main>
</template>
