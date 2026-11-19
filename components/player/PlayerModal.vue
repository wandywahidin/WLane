<script setup lang="ts">
import { computed } from 'vue'
import type { StepButton } from '../../types/demo'
import { isSafeUrl } from '../../utils/modal-buttons'

const props = defineProps<{ title: string; body: string; buttons: StepButton[]; noDim?: boolean }>()
const emit = defineEmits<{ (e: 'next'): void; (e: 'back'): void }>()

// Tombol link hanya dirender untuk URL https://.
const visible = computed(() => props.buttons.filter(b => b.action !== 'link' || isSafeUrl(b.url)))

function onClick(b: StepButton) {
  if (b.action === 'next') emit('next')
  else if (b.action === 'back') emit('back')
}
</script>

<template>
  <!-- no-dim: peredupan digambar oleh pemanggil (player memasang lapisan ini di luar kotak gambar). -->
  <div
    class="modal-layer absolute inset-0 z-[4] flex items-center justify-center rounded-xl p-3 leading-normal"
    :class="{ 'bg-slate-900/55': !noDim }"
  >
    <div data-test="modal" class="card modal-card flex max-h-full w-full max-w-md flex-col overflow-hidden text-left" role="dialog" aria-modal="true">
      <div data-test="modal-body" class="modal-scroll min-h-0 flex-1 overflow-auto">
        <h2 v-if="title" class="modal-title font-bold text-slate-900 [overflow-wrap:anywhere]">{{ title }}</h2>
        <p v-if="body" class="modal-text text-slate-600 [overflow-wrap:anywhere] whitespace-pre-line">{{ body }}</p>
      </div>
      <div v-if="visible.length" data-test="modal-footer" class="modal-footer flex shrink-0 flex-wrap justify-end gap-2">
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

<style scoped>
.modal-layer { container-type: size; }
.modal-card { padding: 1.25rem; gap: 0.75rem; }
.modal-title { font-size: 1.125rem; line-height: 1.4; }
.modal-text { font-size: 0.875rem; margin-top: 0.5rem; }
.modal-title + .modal-text { margin-top: 0.5rem; }
.modal-footer { padding-top: 0.25rem; }

/* Ruang pendek (iframe kecil): padat supaya judul, awal teks, dan tombol muat. */
@container (max-height: 15rem) {
  .modal-card { padding: 0.625rem 0.75rem; gap: 0.375rem; }
  .modal-title { font-size: 0.9375rem; line-height: 1.25; }
  .modal-text { font-size: 0.75rem; line-height: 1.3; margin-top: 0.25rem; }
  .modal-footer { gap: 0.375rem; padding-top: 0; }
  .modal-footer :is(a, button) { padding: 0.3rem 0.65rem; font-size: 0.75rem; }
}
</style>
