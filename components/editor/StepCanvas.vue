<script setup lang="ts">
import type { Step } from '~/types/demo'

const props = defineProps<{ step: Step | null; imageUrl: (path: string) => string }>()
const emit = defineEmits<{ place: [pos: { x: number; y: number }] }>()

const img = ref<HTMLImageElement | null>(null)

function onClick(e: MouseEvent) {
  if (!img.value) return
  emit('place', clickToPercent(e.clientX, e.clientY, img.value.getBoundingClientRect()))
}

const hasHotspot = computed(() => props.step?.hotspot_x != null && props.step?.hotspot_y != null)
</script>

<template>
  <section class="canvas">
    <p v-if="!step" class="empty">Tambahkan screenshot pertama lewat "+ Tambah langkah".</p>
    <template v-else>
      <div class="frame" @click="onClick">
        <img
          ref="img"
          :src="imageUrl(step.image_path)"
          :width="step.image_width"
          :height="step.image_height"
          alt="Screenshot langkah"
          draggable="false"
        >
        <span
          v-if="hasHotspot"
          class="hotspot"
          :style="{ left: `${step.hotspot_x}%`, top: `${step.hotspot_y}%` }"
          aria-hidden="true"
        />
      </div>
      <p class="hint">
        {{ hasHotspot ? 'Klik di tempat lain untuk memindahkan hotspot.' : 'Klik di gambar untuk menaruh hotspot.' }}
      </p>
    </template>
  </section>
</template>

<style scoped>
.canvas { min-width: 0; }
.frame { position: relative; cursor: crosshair; line-height: 0; border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; }
.frame img { width: 100%; height: auto; display: block; user-select: none; }
.hotspot {
  position: absolute; width: 24px; height: 24px; margin: -12px 0 0 -12px; border-radius: 50%;
  background: rgba(37, 87, 214, 0.85); box-shadow: 0 0 0 4px rgba(37, 87, 214, 0.3); pointer-events: none;
}
.hint, .empty { color: var(--muted); font-size: 0.9rem; }
.empty { padding: 48px 16px; text-align: center; border: 2px dashed var(--border); border-radius: var(--radius); }
</style>
