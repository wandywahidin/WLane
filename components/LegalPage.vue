<script setup lang="ts">
defineProps<{ title: string; updated: string }>()
</script>

<template>
  <div class="min-h-dvh bg-white">
    <header class="border-b border-slate-200">
      <div class="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
        <AppLogo />
        <NuxtLink to="/" class="btn-ghost"><UiIcon name="arrow-left" :size="16" /> Beranda</NuxtLink>
      </div>
    </header>
    <article class="prose prose-slate mx-auto max-w-3xl px-4 py-12 sm:px-6 prose-headings:tracking-tight prose-a:text-brand-700 prose-h2:mt-10 prose-h2:text-xl">
      <h1>{{ title }}</h1>
      <p class="lead !mt-2 !text-base text-slate-500">Terakhir diperbarui: {{ updated }}</p>
      <slot />
    </article>
  </div>
</template>
