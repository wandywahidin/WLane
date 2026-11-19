<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Step } from '../../types/demo'
import { areaFromClick, areaFromDrag, moveArea, resizeArea, stepArea, type Area } from '../../utils/area'
import { clickToPercent } from '../../utils/hotspot'
import { anchorPoint, resolvePlacement } from '../../utils/tooltip-placement'
import PlayerModal from '../player/PlayerModal.vue'
import PlayerTooltip from '../player/PlayerTooltip.vue'
import UiIcon from '../UiIcon.vue'

type Corner = 'nw' | 'ne' | 'sw' | 'se'
type Drag =
  | { mode: 'draw'; pointerId: number; start: { x: number; y: number } }
  | { mode: 'move'; pointerId: number; start: { x: number; y: number }; origin: Area }
  | { mode: 'resize'; pointerId: number; corner: Corner; origin: Area }

const props = defineProps<{ step: Step | null; imageUrl: (path: string) => string; busy?: boolean }>()
const emit = defineEmits<{ area: [area: Area]; add: [files: File[]] }>()

const CORNERS: Corner[] = ['nw', 'ne', 'sw', 'se']

const img = ref<HTMLImageElement | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const dropping = ref(false)
const drag = ref<Drag | null>(null)
// Kotak sementara selama menarik; dikirim ke luar sekali saat pointer dilepas.
const draft = ref<Area | null>(null)

const isModal = computed(() => props.step?.kind === 'modal')
const savedArea = computed(() => (props.step ? stepArea(props.step) : null))
const area = computed(() => draft.value ?? savedArea.value)
const hasPoint = computed(() => !area.value && props.step?.hotspot_x != null && props.step?.hotspot_y != null)
const hasMark = computed(() => !!area.value || hasPoint.value)
const center = computed(() =>
  area.value
    ? { x: area.value.x, y: area.value.y }
    : { x: Number(props.step?.hotspot_x ?? 0), y: Number(props.step?.hotspot_y ?? 0) },
)
// Pratinjau tooltip di editor memakai aturan desktop player.
const placement = computed(() => (props.step ? resolvePlacement(props.step.tooltip_placement, center.value, 1280) : 'bottom'))
const anchor = computed(() => anchorPoint(placement.value, center.value, area.value))
const boxStyle = computed(() => area.value && {
  left: `${area.value.x - area.value.w / 2}%`,
  top: `${area.value.y - area.value.h / 2}%`,
  width: `${area.value.w}%`,
  height: `${area.value.h}%`,
})

watch(() => props.step?.id, () => { drag.value = null; draft.value = null })

function toPercent(e: PointerEvent) {
  return clickToPercent(e.clientX, e.clientY, img.value!.getBoundingClientRect())
}

function onPointerDown(e: PointerEvent) {
  if (!img.value || !props.step || isModal.value) return
  if (e.pointerType === 'mouse' && e.button !== 0) return
  const target = e.target as HTMLElement
  const corner = target.closest?.('[data-handle]')?.getAttribute('data-handle') as Corner | null | undefined
  const p = toPercent(e)
  if (corner && savedArea.value) {
    drag.value = { mode: 'resize', pointerId: e.pointerId, corner, origin: savedArea.value }
  } else if (target.closest?.('[data-area]') && savedArea.value) {
    drag.value = { mode: 'move', pointerId: e.pointerId, start: p, origin: savedArea.value }
  } else {
    drag.value = { mode: 'draw', pointerId: e.pointerId, start: p }
  }
  draft.value = null
  e.preventDefault()
  const el = e.currentTarget as HTMLElement | null
  try { el?.setPointerCapture?.(e.pointerId) } catch { /* happy-dom / pointer sudah lepas */ }
}

function onPointerMove(e: PointerEvent) {
  const d = drag.value
  if (!d || d.pointerId !== e.pointerId || !img.value) return
  const p = toPercent(e)
  if (d.mode === 'draw') draft.value = areaFromDrag(d.start, p)
  else if (d.mode === 'move') draft.value = moveArea(d.origin, p.x - d.start.x, p.y - d.start.y)
  else draft.value = resizeArea(d.origin, d.corner, p)
}

function onPointerUp(e: PointerEvent) {
  const d = drag.value
  if (!d || d.pointerId !== e.pointerId || !img.value) return
  onPointerMove(e)
  const result = draft.value
  drag.value = null
  draft.value = null
  if (d.mode === 'draw') {
    // Tarikan terlalu kecil dianggap klik: kotak ukuran bawaan.
    emit('area', result ?? areaFromClick(d.start.x, d.start.y))
  } else if (result && !sameArea(result, d.origin)) {
    emit('area', result)
  }
}

function onPointerCancel() {
  drag.value = null
  draft.value = null
}

function sameArea(a: Area, b: Area) {
  return a.x === b.x && a.y === b.y && a.w === b.w && a.h === b.h
}

function onDrop(e: DragEvent) {
  dropping.value = false
  const files = Array.from(e.dataTransfer?.files ?? [])
  if (files.length) emit('add', files)
}

function onFiles(e: Event) {
  const input = e.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  if (files.length) emit('add', files)
  input.value = ''
}

const hint = computed(() => {
  if (isModal.value) return 'Pratinjau modal. Atur judul, teks, dan tombol di panel kanan.'
  if (savedArea.value) return 'Tarik kotak untuk memindahkan, tarik sudutnya untuk mengubah ukuran'
  if (hasPoint.value) return 'Klik atau tarik di gambar untuk menjadikan sorotan kotak'
  return 'Klik atau tarik di gambar untuk menandai area sorotan'
})
</script>

<template>
  <section class="flex min-h-0 min-w-0 flex-col">
    <!-- belum ada langkah: zona unggah -->
    <div
      v-if="!step"
      class="m-auto flex w-full max-w-xl cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed px-6 py-16 text-center transition"
      :class="dropping ? 'border-brand-500 bg-brand-50' : 'border-slate-300 bg-white hover:border-brand-400'"
      role="button"
      tabindex="0"
      @click="fileInput?.click()"
      @keydown.enter="fileInput?.click()"
      @dragover.prevent="dropping = true"
      @dragleave="dropping = false"
      @drop.prevent="onDrop"
    >
      <input ref="fileInput" type="file" accept="image/png,image/jpeg,image/webp" multiple hidden @change="onFiles">
      <div class="grid size-14 place-items-center rounded-2xl bg-brand-50 text-brand-600">
        <UiIcon :name="busy ? 'refresh' : 'upload'" :size="28" :class="{ 'animate-spin': busy }" />
      </div>
      <p class="mt-4 font-semibold text-slate-900">{{ busy ? 'Mengunggah…' : 'Seret screenshot ke sini' }}</p>
      <p class="mt-1 text-sm text-slate-500">atau klik untuk memilih. Bisa beberapa file sekaligus, satu file = satu langkah.</p>
    </div>

    <template v-else>
      <div class="mb-3 flex items-center justify-center gap-2 text-sm">
        <span
          class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
          :class="isModal || hasMark ? 'bg-brand-50 text-brand-700' : 'bg-amber-50 text-amber-800 ring-1 ring-amber-200'"
        >
          <UiIcon :name="isModal ? 'window' : 'cursor'" :size="14" />
          {{ hint }}
        </span>
      </div>

      <div
        class="relative self-center leading-[0] select-none"
        :class="isModal ? '' : 'cursor-crosshair touch-none'"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerCancel"
      >
        <img
          ref="img"
          :src="imageUrl(step.image_path)"
          :width="step.image_width"
          :height="step.image_height"
          alt="Screenshot langkah"
          draggable="false"
          class="h-auto max-h-[calc(100dvh-14rem)] w-auto max-w-full rounded-xl shadow-lg ring-1 ring-slate-900/10 select-none"
        >

        <!-- Modal: pratinjau di atas gambar yang diredupkan; tombolnya tidak berfungsi di editor. -->
        <PlayerModal
          v-if="isModal"
          :title="step.modal_title"
          :body="step.modal_body"
          :buttons="step.buttons ?? []"
          @click.capture.prevent
        />

        <template v-else>
          <template v-if="area">
            <div class="pointer-events-none absolute inset-0 overflow-hidden rounded-xl">
              <div class="absolute rounded-md shadow-[0_0_0_9999px_rgb(0_0_0/0.35)]" :style="boxStyle" />
            </div>
            <div
              data-area
              class="absolute cursor-move rounded-md border-[3px] border-brand-500 bg-brand-500/10"
              :style="boxStyle"
            >
              <span
                v-for="c in CORNERS"
                :key="c"
                :data-handle="c"
                class="absolute size-3.5 -translate-1/2 rounded-sm border-2 border-brand-600 bg-white shadow"
                :class="{
                  'top-0 left-0 cursor-nwse-resize': c === 'nw',
                  'top-0 left-full cursor-nesw-resize': c === 'ne',
                  'top-full left-0 cursor-nesw-resize': c === 'sw',
                  'top-full left-full cursor-nwse-resize': c === 'se',
                }"
              />
            </div>
          </template>
          <span
            v-else-if="hasPoint"
            class="pointer-events-none absolute size-7 -translate-1/2"
            :style="{ left: `${center.x}%`, top: `${center.y}%` }"
          >
            <span class="absolute inset-0 animate-pulse-ring rounded-full bg-brand-500" />
            <span class="absolute inset-0 rounded-full border-[3px] border-white bg-brand-600 shadow-lg" />
          </span>
          <PlayerTooltip
            v-if="hasMark && step.tooltip_text && !drag"
            class="pointer-events-none"
            :text="step.tooltip_text"
            :placement="placement"
            :x="anchor.x"
            :y="anchor.y"
          />
        </template>
      </div>
    </template>
  </section>
</template>
