<script setup lang="ts">
import type { DemoStatus } from '~/types/demo'

defineProps<{ status: DemoStatus }>()

const STYLE: Record<DemoStatus, { cls: string; dot: string }> = {
  draft: { cls: 'bg-slate-100 text-slate-700 ring-slate-200', dot: 'bg-slate-400' },
  published: { cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200', dot: 'bg-emerald-500' },
  published_dirty: { cls: 'bg-amber-50 text-amber-800 ring-amber-200', dot: 'bg-amber-500' },
}
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset"
    :class="STYLE[status].cls"
    :data-status="status"
  >
    <span class="size-1.5 rounded-full" :class="STYLE[status].dot" />
    {{ DEMO_STATUS_LABEL[status] }}
  </span>
</template>
