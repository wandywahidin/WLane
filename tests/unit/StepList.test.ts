import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import StepList from '../../components/editor/StepList.vue'

const step = (id: string, position: number) => ({
  id, demo_id: 'd1', position, image_path: `${id}.webp`, image_width: 10, image_height: 10,
  hotspot_x: 1, hotspot_y: 1, tooltip_text: '', tooltip_placement: 'auto' as const,
})

describe('StepList', () => {
  it('saat mengunggah (busy), urutkan dan hapus dikunci', () => {
    const w = mount(StepList, {
      props: { steps: [step('a', 0), step('b', 1)], activeIndex: 0, imageUrl: (p: string) => p, busy: true },
    })
    for (const title of ['Naik', 'Turun', 'Hapus langkah']) {
      for (const b of w.findAll(`button[title="${title}"]`)) expect(b.attributes('disabled')).toBeDefined()
    }
    expect(w.get('li').attributes('draggable')).toBe('false')
  })
})
