<script setup lang="ts">
import type { Step, StepKind, TooltipPlacement } from '../../types/demo'
import type { StepPatch } from '../../composables/useEditor'
import UiIcon from '../UiIcon.vue'
import ButtonEditor from './ButtonEditor.vue'

const MAX_TOOLTIP = 280
const MAX_TITLE = 80
const MAX_BODY = 500

defineProps<{ step: Step | null; index: number }>()
const emit = defineEmits<{
  kind: [value: StepKind]
  patch: [value: StepPatch]
}>()

const KINDS: Array<{ value: StepKind; label: string }> = [
  { value: 'hotspot', label: 'Sorotan' },
  { value: 'modal', label: 'Modal' },
]

const options: Array<{ value: TooltipPlacement; label: string }> = [
  { value: 'auto', label: 'Otomatis' },
  { value: 'top', label: 'Atas' },
  { value: 'bottom', label: 'Bawah' },
  { value: 'left', label: 'Kiri' },
  { value: 'right', label: 'Kanan' },
]

const valueOf = (e: Event) => (e.target as HTMLInputElement | HTMLTextAreaElement).value
</script>

<template>
  <aside class="flex flex-col gap-5 p-5">
    <div>
      <p class="text-xs font-semibold tracking-wide text-slate-400 uppercase">Langkah {{ index + 1 }}</p>
      <h2 class="mt-0.5 text-sm font-bold text-slate-900">Jenis langkah</h2>
    </div>

    <template v-if="step">
      <div class="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1" role="group" aria-label="Jenis langkah">
        <button
          v-for="k in KINDS"
          :key="k.value"
          type="button"
          class="rounded-lg px-2 py-1.5 text-sm font-semibold transition"
          :class="step.kind === k.value ? 'bg-white text-brand-700 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'"
          :aria-pressed="step.kind === k.value"
          @click="step.kind !== k.value && emit('kind', k.value)"
        >{{ k.label }}</button>
      </div>

      <!-- Sorotan -->
      <template v-if="step.kind !== 'modal'">
        <div>
          <label for="tooltip-text" class="label">Teks tooltip</label>
          <textarea
            id="tooltip-text"
            rows="5"
            :maxlength="MAX_TOOLTIP"
            :value="step.tooltip_text"
            placeholder="Contoh: Klik untuk menambah transaksi baru"
            class="input resize-y leading-relaxed"
            @input="emit('patch', { tooltip_text: valueOf($event).slice(0, MAX_TOOLTIP) })"
          />
          <div class="mt-1.5 flex items-center justify-between text-xs">
            <span class="text-slate-400">Singkat dan jelas, satu tindakan per langkah.</span>
            <span class="tabular-nums" :class="step.tooltip_text.length >= MAX_TOOLTIP ? 'font-semibold text-red-600' : 'text-slate-400'">
              {{ step.tooltip_text.length }}/{{ MAX_TOOLTIP }}
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
              @click="emit('patch', { tooltip_placement: o.value })"
            >
              {{ o.label }}
            </button>
          </div>
          <p class="mt-2 text-xs text-slate-400">Di layar HP tooltip selalu tampil di bawah gambar.</p>
        </fieldset>

        <div class="rounded-xl bg-slate-50 p-3 text-xs text-slate-500 ring-1 ring-slate-200">
          <div class="flex items-center gap-1.5 font-semibold text-slate-700">
            <UiIcon name="cursor" :size="14" /> Area sorotan
          </div>
          <p class="mt-1">
            <template v-if="step.hotspot_x !== null && step.area_w != null">
              Kotak {{ step.area_w }}% × {{ step.area_h }}%. Tarik kotak untuk memindahkan, tarik sudutnya untuk mengubah ukuran.
            </template>
            <template v-else-if="step.hotspot_x !== null">Titik di {{ step.hotspot_x }}% × {{ step.hotspot_y }}%. Klik atau tarik di gambar untuk menjadikannya kotak.</template>
            <template v-else>Belum ditaruh. Langkah tanpa hotspot tidak bisa diterbitkan.</template>
          </p>
        </div>
      </template>

      <!-- Modal -->
      <template v-else>
        <div>
          <label for="modal-title" class="label">Judul</label>
          <input
            id="modal-title"
            class="input"
            :maxlength="MAX_TITLE"
            :value="step.modal_title"
            placeholder="Contoh: Selamat datang"
            :aria-invalid="step.modal_title.trim() === '' ? 'true' : undefined"
            @input="emit('patch', { modal_title: valueOf($event).slice(0, MAX_TITLE) })"
          >
          <div class="mt-1.5 flex items-center justify-between text-xs">
            <span :class="step.modal_title.trim() === '' ? 'text-red-600' : 'text-slate-400'">
              {{ step.modal_title.trim() === '' ? 'Judul wajib diisi sebelum terbit.' : '' }}
            </span>
            <span class="tabular-nums" :class="step.modal_title.length >= MAX_TITLE ? 'font-semibold text-red-600' : 'text-slate-400'">
              {{ step.modal_title.length }}/{{ MAX_TITLE }}
            </span>
          </div>
        </div>

        <div>
          <label for="modal-body" class="label">Teks</label>
          <textarea
            id="modal-body"
            rows="5"
            :maxlength="MAX_BODY"
            :value="step.modal_body"
            placeholder="Contoh: Panduan ini menunjukkan cara mencatat transaksi pertama."
            class="input resize-y leading-relaxed"
            @input="emit('patch', { modal_body: valueOf($event).slice(0, MAX_BODY) })"
          />
          <div class="mt-1.5 flex justify-end text-xs">
            <span class="tabular-nums" :class="step.modal_body.length >= MAX_BODY ? 'font-semibold text-red-600' : 'text-slate-400'">
              {{ step.modal_body.length }}/{{ MAX_BODY }}
            </span>
          </div>
        </div>

        <fieldset>
          <legend class="label">Tombol</legend>
          <ButtonEditor :buttons="step.buttons ?? []" @update="emit('patch', { buttons: $event })" />
        </fieldset>
      </template>
    </template>
    <p v-else class="text-sm text-slate-400">Tambahkan langkah terlebih dahulu.</p>
  </aside>
</template>
