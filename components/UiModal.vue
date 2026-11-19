<script setup lang="ts">
const props = withDefaults(defineProps<{ open: boolean; title: string; size?: 'md' | 'lg' }>(), { size: 'md' })
const emit = defineEmits<{ close: [] }>()

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.open) emit('close')
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0"
      leave-active-class="transition duration-100 ease-in"
      leave-to-class="opacity-0"
    >
      <div v-if="open" class="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
        <div class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" @click="emit('close')" />
        <div
          role="dialog"
          aria-modal="true"
          :aria-label="title"
          class="card relative w-full p-6 shadow-xl"
          :class="size === 'lg' ? 'max-w-2xl' : 'max-w-md'"
        >
          <div class="mb-4 flex items-start justify-between gap-4">
            <h2 class="text-lg font-bold text-slate-900">{{ title }}</h2>
            <button type="button" class="btn-icon -m-2 text-slate-400 hover:text-slate-600" aria-label="Tutup" @click="emit('close')">
              <UiIcon name="x" />
            </button>
          </div>
          <slot />
          <div v-if="$slots.actions" class="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <slot name="actions" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
