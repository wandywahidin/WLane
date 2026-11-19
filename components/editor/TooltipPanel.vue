<script setup lang="ts">
import type { Step, TooltipPlacement } from '~/types/demo'
import UiIcon from '../UiIcon.vue'

const MAX = 280
defineProps<{ step: Step | null; index: number }>()
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
  <aside class="flex flex-col gap-5 p-5">
    <div>
      <p class="text-xs font-semibold tracking-wide text-slate-400 uppercase">Langkah {{ index + 1 }}</p>
      <h2 class="mt-0.5 text-sm font-bold text-slate-900">Tooltip</h2>
    </div>

    <template v-if="step">
      <div>
        <label for="tooltip-text" class="label">Teks</label>
        <textarea
          id="tooltip-text"
          rows="5"
          :maxlength="MAX"
          :value="step.tooltip_text"
          placeholder="Contoh: Klik untuk menambah transaksi baru"
          class="input resize-y leading-relaxed"
          @input="emit('text', ($event.target as HTMLTextAreaElement).value)"
        />
        <div class="mt-1.5 flex items-center justify-between text-xs">
          <span class="text-slate-400">Singkat dan jelas, satu tindakan per langkah.</span>
          <span class="tabular-nums" :class="step.tooltip_text.length >= MAX ? 'font-semibold text-red-600' : 'text-slate-400'">
            {{ step.tooltip_text.length }}/{{ MAX }}
          </span>
        </div>
      </div>

      <fieldset>
        <legend class="label">Posisi tooltip</legend>
        <div class="grid grid-cols-3 gap-1.5">
          <button
            v-for="o in options"
            :key="o.value"
            type="button"
            class="rounded-lg px-2 py-2 text-xs font-semibold ring-1 transition"
            :class="step.tooltip_placement === o.value
              ? 'bg-brand-600 text-white ring-brand-600'
              : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50'"
            :aria-pressed="step.tooltip_placement === o.value"
            @click="emit('placement', o.value)"
          >
            {{ o.label }}
          </button>
        </div>
        <p class="mt-2 text-xs text-slate-400">Di layar HP tooltip selalu tampil di bawah gambar.</p>
      </fieldset>

      <div class="rounded-xl bg-slate-50 p-3 text-xs text-slate-500 ring-1 ring-slate-200">
        <div class="flex items-center gap-1.5 font-semibold text-slate-700">
          <UiIcon name="cursor" :size="14" /> Hotspot
        </div>
        <p class="mt-1">
          <template v-if="step.hotspot_x !== null">Posisi {{ step.hotspot_x }}% × {{ step.hotspot_y }}%. Klik gambar untuk memindahkan.</template>
          <template v-else>Belum ditaruh. Langkah tanpa hotspot tidak bisa diterbitkan.</template>
        </p>
      </div>
    </template>
    <p v-else class="text-sm text-slate-400">Tambahkan langkah terlebih dahulu.</p>
  </aside>
</template>
