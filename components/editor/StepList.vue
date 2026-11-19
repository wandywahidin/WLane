<script setup lang="ts">
import type { Step } from '~/types/demo'

const props = defineProps<{ steps: Step[]; activeIndex: number; imageUrl: (path: string) => string; busy?: boolean }>()
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
  <aside class="step-list">
    <h2>Langkah</h2>
    <ol>
      <li
        v-for="(step, i) in steps"
        :key="step.id"
        :class="{ active: i === activeIndex, over: i === dragOver, 'no-hotspot': step.hotspot_x === null }"
        :draggable="busy ? 'false' : 'true'"
        @dragstart="dragFrom = i"
        @dragover.prevent="dragOver = i"
        @dragleave="dragOver = null"
        @drop.prevent="onDrop(i)"
        @dragend="dragFrom = null; dragOver = null"
      >
        <button type="button" class="thumb" :aria-label="`Langkah ${i + 1}`" @click="emit('select', i)">
          <span class="num">{{ i + 1 }}</span>
          <img :src="imageUrl(step.image_path)" alt="" loading="lazy" draggable="false">
        </button>
        <div class="tools">
          <button type="button" title="Naik" :disabled="busy || i === 0" @click="move(i, -1)">↑</button>
          <button type="button" title="Turun" :disabled="busy || i === steps.length - 1" @click="move(i, 1)">↓</button>
          <button type="button" class="danger" title="Hapus langkah" :disabled="busy" @click="emit('remove', step.id)">✕</button>
        </div>
      </li>
    </ol>
    <input ref="fileInput" type="file" accept="image/png,image/jpeg,image/webp" multiple hidden @change="onFiles">
    <button type="button" class="primary add" :disabled="busy" @click="fileInput?.click()">
      {{ busy ? 'Mengunggah…' : '+ Tambah langkah' }}
    </button>
  </aside>
</template>

<style scoped>
.step-list { display: flex; flex-direction: column; gap: 8px; min-width: 0; }
h2 { font-size: 1rem; margin: 0; }
ol { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; overflow-y: auto; }
li { border: 2px solid var(--border); border-radius: var(--radius); padding: 4px; background: var(--bg); }
li.active { border-color: var(--accent); }
li.over { border-style: dashed; border-color: var(--accent); }
li.no-hotspot .num { background: #b54708; }
.thumb { position: relative; display: block; width: 100%; padding: 0; border: 0; background: var(--surface); }
.thumb img { display: block; width: 100%; aspect-ratio: 16 / 10; object-fit: cover; border-radius: 4px; }
.num {
  position: absolute; top: 4px; left: 4px; background: var(--accent); color: #fff;
  font-size: 0.75rem; min-width: 20px; padding: 0 6px; border-radius: 99px; text-align: center;
}
.tools { display: flex; gap: 4px; justify-content: flex-end; margin-top: 4px; }
.tools button { padding: 2px 8px; font-size: 0.8rem; }
.add { width: 100%; }
</style>
