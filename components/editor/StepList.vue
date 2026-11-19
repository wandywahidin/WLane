<script setup lang="ts">
import { ref } from 'vue'
import type { Step } from '../../types/demo'
import { stepArea } from '../../utils/area'
import { buttonIssues } from '../../utils/modal-buttons'
import UiIcon from '../UiIcon.vue'

const props = defineProps<{ steps: Step[]; activeIndex: number; imageUrl: (path: string) => string; busy?: boolean }>()

const isModal = (s: Step) => s.kind === 'modal'
// Sama dengan aturan terbit: sorotan butuh hotspot; modal butuh judul, tombol, label, dan link https://.
function incomplete(s: Step): boolean {
  if (!isModal(s)) return s.hotspot_x === null
  const buttons = s.buttons ?? []
  return !s.modal_title?.trim() || buttons.length === 0 || buttons.some(b => buttonIssues(b).length > 0)
}
function caption(s: Step): string {
  if (isModal(s)) return s.modal_title?.trim() ? s.modal_title : 'Modal tanpa judul'
  if (s.hotspot_x === null) return 'Belum ada hotspot'
  return s.tooltip_text || 'Tanpa tooltip'
}
function areaStyle(s: Step) {
  const a = stepArea(s)
  return a && { left: `${a.x - a.w / 2}%`, top: `${a.y - a.h / 2}%`, width: `${a.w}%`, height: `${a.h}%` }
}
const emit = defineEmits<{
  select: [index: number]
  reorder: [from: number, to: number]
  remove: [id: string]
  add: [files: File[]]
}>()

const dragFrom = ref<number | null>(null)
const dragOver = ref<number | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

function onDrop(to: number) {
  if (props.busy) return
  if (dragFrom.value !== null && dragFrom.value !== to) emit('reorder', dragFrom.value, to)
  dragFrom.value = null
  dragOver.value = null
}

function onFiles(e: Event) {
  const input = e.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  if (files.length) emit('add', files)
  input.value = ''
}

function move(i: number, delta: number) {
  const to = i + delta
  if (to >= 0 && to < props.steps.length) emit('reorder', i, to)
}
</script>

<template>
  <aside class="flex min-h-0 flex-col">
    <div class="flex items-center justify-between px-4 pt-4 pb-3">
      <h2 class="text-sm font-bold text-slate-900">Langkah <span class="font-medium text-slate-400">{{ steps.length }}</span></h2>
    </div>

    <ol class="flex min-h-0 flex-1 gap-3 overflow-auto px-4 pb-3 lg:flex-col">
      <li
        v-for="(step, i) in steps"
        :key="step.id"
        class="group relative w-40 shrink-0 rounded-xl p-1.5 ring-1 transition lg:w-auto"
        :class="[
          i === activeIndex ? 'bg-brand-50 ring-2 ring-brand-500' : 'bg-white ring-slate-200 hover:ring-slate-300',
          i === dragOver ? 'ring-2 ring-brand-400 ring-dashed' : '',
        ]"
        :draggable="busy ? 'false' : 'true'"
        @dragstart="dragFrom = i"
        @dragover.prevent="dragOver = i"
        @dragleave="dragOver = null"
        @drop.prevent="onDrop(i)"
        @dragend="dragFrom = null; dragOver = null"
      >
        <button type="button" class="block w-full cursor-pointer text-left" :aria-label="`Langkah ${i + 1}`" @click="emit('select', i)">
          <div class="relative overflow-hidden rounded-lg bg-slate-100">
            <img :src="imageUrl(step.image_path)" alt="" loading="lazy" draggable="false" class="aspect-[16/10] w-full object-cover object-top">
            <span
              class="absolute top-1.5 left-1.5 z-[1] grid size-6 place-items-center rounded-full text-xs font-bold text-white shadow"
              :class="incomplete(step) ? 'bg-amber-500' : 'bg-brand-600'"
            >{{ i + 1 }}</span>
            <template v-if="isModal(step)">
              <span class="absolute inset-0 grid place-items-center bg-slate-900/45">
                <span class="grid size-8 place-items-center rounded-lg bg-white text-brand-600 shadow" title="Modal">
                  <UiIcon name="window" :size="18" />
                </span>
              </span>
            </template>
            <span
              v-else-if="areaStyle(step)"
              class="absolute rounded-sm border-2 border-brand-600 bg-brand-500/15"
              :style="areaStyle(step)!"
            />
            <span
              v-else-if="step.hotspot_x !== null && step.hotspot_y !== null"
              class="absolute size-2.5 -translate-1/2 rounded-full bg-brand-600 ring-2 ring-white"
              :style="{ left: `${step.hotspot_x}%`, top: `${step.hotspot_y}%` }"
            />
          </div>
          <p
            class="mt-1.5 line-clamp-1 px-0.5 text-xs"
            :class="(isModal(step) ? step.modal_title?.trim() : step.tooltip_text) ? 'text-slate-600' : 'text-slate-400 italic'"
          >
            {{ caption(step) }}
          </p>
        </button>

        <div class="absolute top-2.5 right-2.5 flex gap-0.5 rounded-lg bg-white/95 p-0.5 opacity-100 shadow-sm ring-1 ring-slate-200 transition lg:opacity-0 lg:group-hover:opacity-100 lg:focus-within:opacity-100">
          <button type="button" title="Naik" class="btn-icon p-1 text-slate-500 hover:bg-slate-100" :disabled="busy || i === 0" @click="move(i, -1)">
            <UiIcon name="chevron-up" :size="14" />
          </button>
          <button type="button" title="Turun" class="btn-icon p-1 text-slate-500 hover:bg-slate-100" :disabled="busy || i === steps.length - 1" @click="move(i, 1)">
            <UiIcon name="chevron-down" :size="14" />
          </button>
          <button type="button" title="Hapus langkah" class="btn-icon p-1 text-slate-500 hover:bg-red-50 hover:text-red-600" :disabled="busy" @click="emit('remove', step.id)">
            <UiIcon name="trash" :size="14" />
          </button>
        </div>
      </li>
    </ol>

    <div class="border-t border-slate-200 p-4">
      <input ref="fileInput" type="file" accept="image/png,image/jpeg,image/webp" multiple hidden @change="onFiles">
      <button type="button" class="btn-secondary w-full" :disabled="busy" @click="fileInput?.click()">
        <UiIcon :name="busy ? 'refresh' : 'plus'" :size="18" :class="{ 'animate-spin': busy }" />
        {{ busy ? 'Mengunggah…' : 'Tambah langkah' }}
      </button>
      <p class="mt-2 text-center text-[11px] text-slate-400">PNG, JPG, WebP · maks. 10 MB</p>
    </div>
  </aside>
</template>
