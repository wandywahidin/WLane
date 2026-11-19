<script setup lang="ts">
import type { Step, TooltipPlacement } from '~/types/demo'

const MAX = 280
defineProps<{ step: Step | null }>()
const emit = defineEmits<{
  text: [value: string]
  placement: [value: TooltipPlacement]
}>()

const options: Array<{ value: TooltipPlacement; label: string }> = [
  { value: 'auto', label: 'Otomatis' },
  { value: 'top', label: 'Atas' },
  { value: 'bottom', label: 'Bawah' },
  { value: 'left', label: 'Kiri' },
  { value: 'right', label: 'Kanan' },
]
</script>

<template>
  <aside class="tooltip-panel">
    <h2>Tooltip</h2>
    <template v-if="step">
      <label for="tooltip-text">Teks</label>
      <textarea
        id="tooltip-text"
        rows="5"
        :maxlength="MAX"
        :value="step.tooltip_text"
        placeholder="Contoh: Klik untuk menambah transaksi"
        @input="emit('text', ($event.target as HTMLTextAreaElement).value)"
      />
      <p class="count" :class="{ full: step.tooltip_text.length >= MAX }">{{ step.tooltip_text.length }}/{{ MAX }}</p>

      <label for="tooltip-placement">Posisi</label>
      <select
        id="tooltip-placement"
        :value="step.tooltip_placement"
        @change="emit('placement', ($event.target as HTMLSelectElement).value as TooltipPlacement)"
      >
        <option v-for="o in options" :key="o.value" :value="o.value">{{ o.label }}</option>
      </select>
    </template>
    <p v-else class="muted">Pilih langkah terlebih dahulu.</p>
  </aside>
</template>

<style scoped>
.tooltip-panel { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
h2 { font-size: 1rem; margin: 0 0 4px; }
label { font-size: 0.85rem; font-weight: 600; }
textarea { resize: vertical; }
.count { margin: 0 0 8px; font-size: 0.8rem; color: var(--muted); text-align: right; }
.count.full { color: var(--danger); }
.muted { color: var(--muted); }
</style>
