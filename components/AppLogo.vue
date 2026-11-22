<script setup lang="ts">
withDefaults(defineProps<{ to?: string; dark?: boolean }>(), { to: '/', dark: false })
</script>

<template>
  <NuxtLink :to="to" class="inline-flex items-center gap-2.5 font-bold tracking-tight" :class="dark ? 'text-white' : 'text-slate-900'">
    <span class="grid size-8 place-items-center rounded-lg bg-brand-600 text-white shadow-sm shadow-brand-600/30">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <rect x="3" y="4.5" width="18" height="12" rx="2" />
        <circle cx="14.5" cy="10.5" r="2.2" fill="currentColor" stroke="none" />
        <path d="M8.5 20h7" stroke-linecap="round" />
      </svg>
    </span>
    <span>WLane<span class="text-brand-600" :class="{ 'text-brand-300': dark }">.</span></span>
  </NuxtLink>
</template>
