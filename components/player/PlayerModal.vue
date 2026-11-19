<script setup lang="ts">
import { computed } from 'vue'
import type { StepButton } from '../../types/demo'
import { isSafeUrl } from '../../utils/modal-buttons'

const props = defineProps<{ title: string; body: string; buttons: StepButton[] }>()
const emit = defineEmits<{ (e: 'next'): void; (e: 'back'): void }>()

// Tombol link hanya dirender untuk URL https://.
const visible = computed(() => props.buttons.filter(b => b.action !== 'link' || isSafeUrl(b.url)))

function onClick(b: StepButton) {
  if (b.action === 'next') emit('next')
  else if (b.action === 'back') emit('back')
}
</script>

<template>
  <div class="absolute inset-0 z-[3] flex items-center justify-center rounded-xl bg-slate-900/55 p-3 leading-normal">
    <div data-test="modal" class="card flex max-h-full w-full max-w-md flex-col gap-3 overflow-auto p-5 text-left" role="dialog" aria-modal="true">
      <h2 v-if="title" class="text-lg font-bold text-slate-900 [overflow-wrap:anywhere]">{{ title }}</h2>
      <p v-if="body" class="text-sm text-slate-600 [overflow-wrap:anywhere] whitespace-pre-line">{{ body }}</p>
      <div v-if="visible.length" class="mt-1 flex flex-wrap justify-end gap-2">
        <template v-for="(b, i) in visible" :key="i">
          <a
            v-if="b.action === 'link'"
            data-test="modal-button"
            :href="b.url"
            target="_blank"
            rel="noopener noreferrer"
            :class="b.primary ? 'btn-primary' : 'btn-secondary'"
          >{{ b.label }}</a>
          <button
            v-else
            data-test="modal-button"
            type="button"
            :class="b.primary ? 'btn-primary' : 'btn-secondary'"
            @click="onClick(b)"
          >{{ b.label }}</button>
        </template>
      </div>
    </div>
  </div>
</template>
