<script setup lang="ts">
import { computed } from 'vue'
import type { ResolvedPlacement } from '../../utils/tooltip-placement'

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
    class="player-tooltip rounded-xl bg-slate-900 px-4 py-3 text-[15px] leading-relaxed font-medium text-white shadow-2xl shadow-slate-900/30 [overflow-wrap:anywhere] whitespace-pre-line"
    :class="[placement, align]"
    role="note"
    :style="placement === 'below-image' ? undefined : { left: `${x}%`, top: `${y}%` }"
  >
    <slot>{{ text }}</slot>
  </div>
</template>

<style scoped>
/* Lebar mengikuti gambar, tapi tidak kurang dari 200px supaya tetap terbaca di screenshot HP yang sempit. */
.player-tooltip:not(.below-image) { position: absolute; z-index: 2; width: max-content; max-width: max(min(300px, 46%), 200px); }
.player-tooltip::after {
  content: ''; position: absolute; width: 12px; height: 12px; background: inherit; border-radius: 2px;
}
.top { transform: translate(-50%, calc(-100% - 24px)); }
.top::after { bottom: -5px; left: calc(50% - 6px); transform: rotate(45deg); }
.bottom { transform: translate(-50%, 24px); }
.bottom::after { top: -5px; left: calc(50% - 6px); transform: rotate(45deg); }
.left { transform: translate(calc(-100% - 24px), -50%); }
.left::after { right: -5px; top: calc(50% - 6px); transform: rotate(45deg); }
.right { transform: translate(24px, -50%); }
.right::after { left: -5px; top: calc(50% - 6px); transform: rotate(45deg); }

.top.align-start { transform: translate(-22px, calc(-100% - 24px)); }
.top.align-end { transform: translate(calc(-100% + 22px), calc(-100% - 24px)); }
.bottom.align-start { transform: translate(-22px, 24px); }
.bottom.align-end { transform: translate(calc(-100% + 22px), 24px); }
.align-start::after { left: 16px; }
.align-end::after { left: auto; right: 16px; }

.below-image { position: relative; margin-top: 14px; }
.below-image::after { top: -5px; left: 24px; transform: rotate(45deg); }
</style>
