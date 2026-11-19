<script setup lang="ts">
import type { ButtonAction, StepButton } from '../../types/demo'
import { buttonIssues, EXTRA_MODAL_BUTTON, MAX_BUTTONS } from '../../utils/modal-buttons'
import UiIcon from '../UiIcon.vue'

const props = defineProps<{ buttons: StepButton[] }>()
const emit = defineEmits<{ update: [buttons: StepButton[]] }>()

const ACTIONS: Array<{ value: ButtonAction; label: string }> = [
  { value: 'next', label: 'Lanjut' },
  { value: 'back', label: 'Kembali' },
  { value: 'link', label: 'Buka link' },
]

function copy(): StepButton[] {
  return props.buttons.map(b => ({ ...b }))
}

function patch(i: number, p: Partial<StepButton>) {
  const next = copy()
  next[i] = { ...next[i], ...p }
  emit('update', next)
}

function setPrimary(i: number, on: boolean) {
  // Paling banyak satu tombol utama.
  emit('update', copy().map((b, j) => ({ ...b, primary: j === i ? on : false })))
}

function add() {
  if (props.buttons.length >= MAX_BUTTONS) return
  emit('update', [...copy(), { ...EXTRA_MODAL_BUTTON }])
}

function remove(i: number) {
  emit('update', copy().filter((_, j) => j !== i))
}
</script>

<template>
  <div class="space-y-3">
    <div
      v-for="(b, i) in buttons"
      :key="i"
      class="space-y-2 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200"
    >
      <div class="flex items-center justify-between">
        <span class="text-xs font-semibold text-slate-500">Tombol {{ i + 1 }}</span>
        <button
          type="button"
          class="btn-icon p-1 text-slate-500 hover:bg-red-50 hover:text-red-600"
          title="Hapus tombol"
          :aria-label="`Hapus tombol ${i + 1}`"
          :disabled="buttons.length <= 1"
          @click="remove(i)"
        >
          <UiIcon name="trash" :size="14" />
        </button>
      </div>

      <div>
        <label :for="`btn-label-${i}`" class="sr-only">Label tombol {{ i + 1 }}</label>
        <input
          :id="`btn-label-${i}`"
          data-test="button-label"
          class="input"
          :class="{ 'ring-2 ring-red-500': buttonIssues(b).includes('label') }"
          maxlength="30"
          placeholder="Label tombol"
          :value="b.label"
          :aria-invalid="buttonIssues(b).includes('label') ? 'true' : undefined"
          @input="patch(i, { label: ($event.target as HTMLInputElement).value })"
        >
        <p v-if="buttonIssues(b).includes('label')" class="mt-1 text-xs text-red-600">Label tidak boleh kosong.</p>
      </div>

      <div class="grid grid-cols-3 gap-1" role="group" :aria-label="`Aksi tombol ${i + 1}`">
        <button
          v-for="a in ACTIONS"
          :key="a.value"
          type="button"
          class="rounded-lg px-1.5 py-1.5 text-xs font-semibold ring-1 transition"
          :class="b.action === a.value
            ? 'bg-brand-600 text-white ring-brand-600'
            : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50'"
          :aria-pressed="b.action === a.value"
          @click="patch(i, { action: a.value })"
        >
          {{ a.label }}
        </button>
      </div>

      <div v-if="b.action === 'link'">
        <label :for="`btn-url-${i}`" class="sr-only">URL tombol {{ i + 1 }}</label>
        <input
          :id="`btn-url-${i}`"
          data-test="button-url"
          type="url"
          class="input font-mono text-xs"
          :class="{ 'ring-2 ring-red-500': buttonIssues(b).includes('url') }"
          maxlength="500"
          placeholder="https://contoh.com"
          :value="b.url ?? ''"
          :aria-invalid="buttonIssues(b).includes('url') ? 'true' : undefined"
          @input="patch(i, { url: ($event.target as HTMLInputElement).value })"
        >
        <p v-if="buttonIssues(b).includes('url')" class="mt-1 text-xs text-red-600">Link harus diawali https://</p>
      </div>

      <label class="flex cursor-pointer items-center gap-2 text-xs text-slate-600">
        <input
          data-test="button-primary"
          type="checkbox"
          class="size-4 accent-brand-600"
          :checked="!!b.primary"
          @change="setPrimary(i, ($event.target as HTMLInputElement).checked)"
        >
        Tombol utama
      </label>
    </div>

    <button
      type="button"
      class="btn-secondary w-full"
      :disabled="buttons.length >= MAX_BUTTONS"
      @click="add"
    >
      + Tambah tombol
    </button>
  </div>
</template>
