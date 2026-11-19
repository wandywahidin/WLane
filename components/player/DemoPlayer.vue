<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { SnapshotStep } from '../../types/demo'
import { anchorPoint, resolvePlacement } from '../../utils/tooltip-placement'
import { normalizeSnapshotStep } from '../../utils/snapshot'
import { stepArea } from '../../utils/area'
import PlayerTooltip from './PlayerTooltip.vue'
import PlayerModal from './PlayerModal.vue'
import UiIcon from '../UiIcon.vue'

// fit: mode embed — seluruh player (gambar, tooltip, tombol) muat di tinggi iframe.
const props = defineProps<{ steps: SnapshotStep[]; imageUrl: (path: string) => string; fit?: boolean }>()

const index = ref(0)
// SSR tidak tahu lebar layar; nilai sebenarnya diisi saat mount.
const viewportWidth = ref(1024)

// Snapshot lama tanpa kind/area/buttons dinormalkan jadi sorotan berbentuk titik.
const steps = computed(() => props.steps.map(s => normalizeSnapshotStep(s)))
const total = computed(() => steps.value.length)
const done = computed(() => index.value >= total.value)
const current = computed(() => steps.value[index.value] ?? null)
const isModal = computed(() => current.value?.kind === 'modal')
const area = computed(() => (current.value ? stepArea(current.value) : null))
const anchor = computed(() => anchorPoint(placement.value, hotspot.value, area.value))
const hotspot = computed(() => ({ x: Number(current.value?.hotspot_x ?? 50), y: Number(current.value?.hotspot_y ?? 50) }))
const placement = computed(() =>
  current.value ? resolvePlacement(current.value.tooltip_placement, hotspot.value, viewportWidth.value) : 'below-image',
)
const progress = computed(() => (total.value ? Math.min(index.value + 1, total.value) / total.value : 0))

function next() { if (index.value < total.value) index.value++ }
function prev() { if (index.value > 0) index.value-- }
function restart() { index.value = 0 }

function onKey(e: KeyboardEvent) {
  if (e.target instanceof HTMLElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return
  if (e.key === 'ArrowRight') next()
  else if (e.key === 'ArrowLeft') prev()
}
function onResize() { viewportWidth.value = window.innerWidth }

onMounted(() => {
  onResize()
  window.addEventListener('keydown', onKey)
  window.addEventListener('resize', onResize)
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  window.removeEventListener('resize', onResize)
})

// Muat gambar langkah berikutnya lebih dulu supaya pergantian terasa instan.
watch(index, (i) => {
  const nextStep = steps.value[i + 1]
  if (nextStep && typeof Image !== 'undefined') new Image().src = props.imageUrl(nextStep.image_path)
}, { immediate: true })
</script>

<template>
  <div class="demo-player mx-auto w-full max-w-6xl" :class="{ fit }">
    <template v-if="!done && current">
      <div class="stage-wrap">
        <div
          data-test="stage"
          class="stage relative leading-[0]"
          :style="{ '--ar': String(Math.round((current.image_width / current.image_height) * 1000) / 1000) }"
        >
          <img
            :src="imageUrl(current.image_path)"
            :width="current.image_width"
            :height="current.image_height"
            :alt="`Langkah ${index + 1}`"
            draggable="false"
            class="block h-auto w-full rounded-xl bg-slate-100 shadow-xl ring-1 shadow-slate-900/10 ring-slate-900/10 select-none"
          >
          <PlayerModal
            v-if="current.kind === 'modal'"
            :title="current.modal_title"
            :body="current.modal_body"
            :buttons="current.buttons"
            @next="next"
            @back="prev"
          />
          <template v-else-if="area">
            <div class="pointer-events-none absolute inset-0 z-[1] overflow-hidden rounded-xl">
              <div
                class="absolute rounded-md shadow-[0_0_0_9999px_rgb(0_0_0/0.55)]"
                :style="{ left: `${area.x - area.w / 2}%`, top: `${area.y - area.h / 2}%`, width: `${area.w}%`, height: `${area.h}%` }"
              />
            </div>
            <button
              data-test="area"
              type="button"
              class="absolute z-[1] cursor-pointer rounded-md border-[3px] border-brand-500 bg-transparent focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-amber-400 motion-safe:animate-pulse"
              :style="{ left: `${area.x - area.w / 2}%`, top: `${area.y - area.h / 2}%`, width: `${area.w}%`, height: `${area.h}%` }"
              :aria-label="index + 1 < total ? 'Lanjut ke langkah berikutnya' : 'Selesai'"
              @click="next"
            />
          </template>
          <button
            v-else
            data-test="hotspot"
            type="button"
            class="absolute z-[1] size-8 -translate-1/2 cursor-pointer rounded-full focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-amber-400"
            :style="{ left: `${hotspot.x}%`, top: `${hotspot.y}%` }"
            :aria-label="index + 1 < total ? 'Lanjut ke langkah berikutnya' : 'Selesai'"
            @click="next"
          >
            <span class="pointer-events-none absolute inset-0 animate-pulse-ring rounded-full bg-brand-500 motion-reduce:animate-none" />
            <span class="pointer-events-none absolute inset-0 rounded-full border-[3px] border-white bg-brand-600 shadow-lg shadow-brand-900/40" />
          </button>
          <PlayerTooltip
            v-if="!isModal && placement !== 'below-image' && current.tooltip_text"
            :text="current.tooltip_text"
            :placement="placement"
            :x="anchor.x"
            :y="anchor.y"
          />
        </div>
      </div>
      <PlayerTooltip
        v-if="!isModal && placement === 'below-image' && current.tooltip_text"
        :text="current.tooltip_text"
        placement="below-image"
        :x="anchor.x"
        :y="anchor.y"
      />

      <nav class="controls mt-4 flex items-center gap-3">
        <button type="button" class="btn-secondary" :disabled="index === 0" @click="prev">
          <UiIcon name="chevron-left" :size="18" />
          <span>Kembali</span>
        </button>
        <div class="flex min-w-0 flex-1 flex-col items-center gap-1.5">
          <span class="text-xs font-semibold text-slate-500 tabular-nums" aria-live="polite">Langkah {{ index + 1 }} dari {{ total }}</span>
          <div class="h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-slate-200">
            <div class="h-full rounded-full bg-brand-600 transition-[width] duration-300" :style="{ width: `${progress * 100}%` }" />
          </div>
        </div>
        <button type="button" class="btn-primary" @click="next">
          <span>Lanjut</span>
          <UiIcon name="chevron-right" :size="18" />
        </button>
      </nav>
    </template>

    <div v-else class="finish flex aspect-[16/10] min-h-64 flex-col items-center justify-center rounded-xl bg-gradient-to-br from-brand-50 to-white p-6 text-center ring-1 ring-slate-200">
      <div class="grid size-16 place-items-center rounded-full bg-emerald-100 text-emerald-600">
        <UiIcon name="check" :size="32" />
      </div>
      <p class="mt-4 text-2xl font-bold text-slate-900">Selesai</p>
      <p class="mt-1 text-sm text-slate-500">Anda sudah melihat semua {{ total }} langkah.</p>
      <div class="mt-6 flex gap-2">
        <button v-if="total > 0" type="button" class="btn-secondary" @click="prev">Kembali</button>
        <button type="button" class="btn-primary" @click="restart">Ulangi</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Halaman biasa: gambar dibatasi setinggi layar supaya tombol tetap terlihat tanpa scroll;
   screenshot HP yang sangat tinggi tetap minimal 22rem lebarnya (boleh scroll). */
.demo-player:not(.fit) .stage { width: min(100%, max(calc((100dvh - 16rem) * var(--ar)), 22rem)); margin-inline: auto; }

/* Mode fit (embed): kolom setinggi iframe; panggung mengikuti rasio gambar
   di dalam ruang yang tersisa supaya hotspot tetap tepat dan tombol tidak terpotong. */
.fit { height: 100vh; display: flex; flex-direction: column; padding: 10px; max-width: none; }
.fit .stage-wrap { flex: 1 1 auto; min-height: 0; container-type: size; display: flex; justify-content: center; align-items: flex-start; }
.fit .stage { width: min(100cqw, 100cqh * var(--ar)); }
.fit .controls { flex: none; margin-top: 10px; }
.fit .finish { flex: 1; aspect-ratio: auto; min-height: 0; }
</style>
