<script setup lang="ts">
const route = useRoute()
const links = [
  { to: '/dashboard', label: 'Demo saya', icon: 'play' as const },
  { to: '/akun', label: 'Akun', icon: 'user' as const },
]
</script>

<template>
  <header class="sticky top-0 z-30 border-b border-slate-200 bg-white/85 backdrop-blur">
    <div class="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
      <AppLogo to="/dashboard" />
      <nav class="flex items-center gap-1">
        <NuxtLink
          v-for="l in links"
          :key="l.to"
          :to="l.to"
          class="btn-ghost"
          :class="{ 'bg-slate-100 text-slate-900': route.path.startsWith(l.to) }"
        >
          <UiIcon :name="l.icon" :size="18" />
          <span class="hidden sm:inline">{{ l.label }}</span>
        </NuxtLink>
      </nav>
    </div>
  </header>
</template>
