<script setup lang="ts">
import type { ResolvedPlacement } from '../../utils/tooltip-placement'

import { computed } from 'vue'

const props = defineProps<{
  text: string
  placement: ResolvedPlacement
  x: number
  y: number
}>()

// Tooltip atas/bawah biasanya di tengah hotspot; di dekat tepi dirapatkan ke dalam gambar.
const align = computed(() => {
  if (props.placement !== 'top' && props.placement !== 'bottom') return null
  if (props.x < 25) return 'align-start'
  if (props.x > 75) return 'align-end'
  return null
})
</script>

<template>
  <div
    data-test="tooltip"
    class="player-tooltip"
    :class="[placement, align]"
    role="note"
    :style="placement === 'below-image' ? undefined : { left: `${x}%`, top: `${y}%` }"
  >
    <slot>{{ text }}</slot>
  </div>
</template>

<style scoped>
.player-tooltip {
  background: #1d2433; color: #fff; padding: 10px 12px; border-radius: 8px;
  font-size: 0.95rem; line-height: 1.4; box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
  white-space: pre-line; overflow-wrap: anywhere;
}
.player-tooltip:not(.below-image) { position: absolute; width: max-content; max-width: min(280px, 45%); z-index: 2; }
.top { transform: translate(-50%, calc(-100% - 22px)); }
.bottom { transform: translate(-50%, 22px); }
.top.align-start { transform: translate(-18px, calc(-100% - 22px)); }
.top.align-end { transform: translate(calc(-100% + 18px), calc(-100% - 22px)); }
.bottom.align-start { transform: translate(-18px, 22px); }
.bottom.align-end { transform: translate(calc(-100% + 18px), 22px); }
.left { transform: translate(calc(-100% - 22px), -50%); }
.right { transform: translate(22px, -50%); }
.below-image { position: static; margin-top: 10px; }
</style>
