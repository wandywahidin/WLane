<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { SnapshotStep } from '../../types/demo'
import { resolvePlacement } from '../../utils/tooltip-placement'
import PlayerTooltip from './PlayerTooltip.vue'

// fit: mode embed — seluruh player (gambar, tooltip, tombol) muat di tinggi iframe.
const props = defineProps<{ steps: SnapshotStep[]; imageUrl: (path: string) => string; fit?: boolean }>()

const index = ref(0)
// SSR tidak tahu lebar layar; nilai sebenarnya diisi saat mount.
const viewportWidth = ref(1024)

const total = computed(() => props.steps.length)
const done = computed(() => index.value >= total.value)
const current = computed(() => props.steps[index.value] ?? null)
const hotspot = computed(() => ({ x: Number(current.value?.hotspot_x ?? 50), y: Number(current.value?.hotspot_y ?? 50) }))
const placement = computed(() =>
  current.value ? resolvePlacement(current.value.tooltip_placement, hotspot.value, viewportWidth.value) : 'below-image',
)

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
  const nextStep = props.steps[i + 1]
  if (nextStep && typeof Image !== 'undefined') new Image().src = props.imageUrl(nextStep.image_path)
}, { immediate: true })
</script>

<template>
  <div class="demo-player" :class="{ fit }">
    <template v-if="!done && current">
      <div class="stage-wrap">
      <div
        data-test="stage"
        class="stage"
        :style="{ '--ar': String(Math.round((current.image_width / current.image_height) * 1000) / 1000) }"
      >
        <img
          :src="imageUrl(current.image_path)"
          :width="current.image_width"
          :height="current.image_height"
          :alt="`Langkah ${index + 1}`"
          draggable="false"
        >
        <button
          data-test="hotspot"
          type="button"
          class="hotspot"
          :style="{ left: `${hotspot.x}%`, top: `${hotspot.y}%` }"
          :aria-label="index + 1 < total ? 'Lanjut ke langkah berikutnya' : 'Selesai'"
          @click="next"
        >
          <span class="pulse" />
        </button>
        <PlayerTooltip
          v-if="placement !== 'below-image' && current.tooltip_text"
          :text="current.tooltip_text"
          :placement="placement"
          :x="hotspot.x"
          :y="hotspot.y"
        />
      </div>
      </div>
      <PlayerTooltip
        v-if="placement === 'below-image' && current.tooltip_text"
        :text="current.tooltip_text"
        placement="below-image"
        :x="hotspot.x"
        :y="hotspot.y"
      />
      <nav class="controls">
        <button type="button" :disabled="index === 0" @click="prev">Kembali</button>
        <span class="progress" aria-live="polite">Langkah {{ index + 1 }} dari {{ total }}</span>
        <button type="button" @click="next">Lanjut</button>
      </nav>
    </template>

    <div v-else class="finish">
      <p class="finish-title">Selesai</p>
      <p>Anda sudah melihat semua {{ total }} langkah.</p>
      <div class="finish-actions">
        <button v-if="total > 0" type="button" @click="prev">Kembali</button>
        <button type="button" class="primary" @click="restart">Ulangi</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.demo-player { width: 100%; max-width: 1280px; margin: 0 auto; }
.stage { position: relative; line-height: 0; border-radius: 8px; overflow: visible; }
.stage img { width: 100%; height: auto; display: block; border-radius: 8px; border: 1px solid #dde2ea; user-select: none; }
.hotspot {
  position: absolute; width: 28px; height: 28px; margin: -14px 0 0 -14px; padding: 0;
  border-radius: 50%; border: 3px solid #fff; background: #2557d6; cursor: pointer; z-index: 1;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
}
.hotspot:focus-visible { outline: 3px solid #f79009; outline-offset: 3px; }
.pulse {
  position: absolute; inset: -3px; border-radius: 50%; border: 3px solid #2557d6;
  animation: pulse 1.6s ease-out infinite; pointer-events: none;
}
@keyframes pulse {
  from { transform: scale(1); opacity: 0.9; }
  to { transform: scale(2.4); opacity: 0; }
}
@media (prefers-reduced-motion: reduce) { .pulse { animation: none; } }
/* Mode fit (embed): kolom setinggi iframe; panggung mengikuti rasio gambar
   di dalam ruang yang tersisa supaya hotspot tetap tepat dan tombol tidak terpotong. */
.fit { height: 100vh; display: flex; flex-direction: column; padding: 8px; }
.fit .stage-wrap { flex: 1 1 auto; min-height: 0; container-type: size; display: flex; justify-content: center; align-items: flex-start; }
.fit .stage { width: min(100cqw, 100cqh * var(--ar)); }
.fit .controls { flex: none; margin-top: 6px; }
.fit .finish { flex: 1; aspect-ratio: auto; min-height: 0; }
.controls { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 10px; }
.progress { font-size: 0.9rem; color: #5b6475; }
.finish {
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px;
  min-height: 240px; aspect-ratio: 16 / 10; border: 1px solid #dde2ea; border-radius: 8px; background: #f5f7fa;
  text-align: center; padding: 16px;
}
.finish-title { font-size: 1.5rem; font-weight: 700; margin: 0; }
.finish-actions { display: flex; gap: 8px; margin-top: 8px; }
</style>
