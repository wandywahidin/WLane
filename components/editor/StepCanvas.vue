<script setup lang="ts">
import type { Step } from '~/types/demo'
import PlayerTooltip from '../player/PlayerTooltip.vue'
import UiIcon from '../UiIcon.vue'

const props = defineProps<{ step: Step | null; imageUrl: (path: string) => string; busy?: boolean }>()
const emit = defineEmits<{ place: [pos: { x: number; y: number }]; add: [files: File[]] }>()

const img = ref<HTMLImageElement | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const dropping = ref(false)

function onClick(e: MouseEvent) {
  if (!img.value) return
  emit('place', clickToPercent(e.clientX, e.clientY, img.value.getBoundingClientRect()))
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

const hasHotspot = computed(() => props.step?.hotspot_x != null && props.step?.hotspot_y != null)
const pos = computed(() => ({ x: Number(props.step?.hotspot_x ?? 0), y: Number(props.step?.hotspot_y ?? 0) }))
// Pratinjau tooltip di editor memakai aturan desktop player.
const placement = computed(() => (props.step ? resolvePlacement(props.step.tooltip_placement, pos.value, 1280) : 'bottom'))
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
          :class="hasHotspot ? 'bg-brand-50 text-brand-700' : 'bg-amber-50 text-amber-800 ring-1 ring-amber-200'"
        >
          <UiIcon name="cursor" :size="14" />
          {{ hasHotspot ? 'Klik di tempat lain untuk memindahkan hotspot' : 'Klik di gambar untuk menaruh hotspot' }}
        </span>
      </div>

      <div class="relative cursor-crosshair self-center leading-[0]" @click="onClick">
        <img
          ref="img"
          :src="imageUrl(step.image_path)"
          :width="step.image_width"
          :height="step.image_height"
          alt="Screenshot langkah"
          draggable="false"
          class="h-auto max-h-[calc(100dvh-14rem)] w-auto max-w-full rounded-xl shadow-lg ring-1 ring-slate-900/10 select-none"
        >
        <template v-if="hasHotspot">
          <span class="pointer-events-none absolute size-7 -translate-1/2" :style="{ left: `${pos.x}%`, top: `${pos.y}%` }">
            <span class="absolute inset-0 animate-pulse-ring rounded-full bg-brand-500" />
            <span class="absolute inset-0 rounded-full border-[3px] border-white bg-brand-600 shadow-lg" />
          </span>
          <PlayerTooltip
            v-if="step.tooltip_text"
            class="pointer-events-none"
            :text="step.tooltip_text"
            :placement="placement"
            :x="pos.x"
            :y="pos.y"
          />
        </template>
      </div>
    </template>
  </section>
</template>
