import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import StepCanvas from '../../components/editor/StepCanvas.vue'
import type { Step } from '../../types/demo'

const step = (over: Partial<Step> = {}): Step => ({
  id: 's1', demo_id: 'd1', position: 0, image_path: 's1.webp', image_width: 1000, image_height: 500,
  hotspot_x: null, hotspot_y: null, tooltip_text: '', tooltip_placement: 'auto',
  kind: 'hotspot', area_w: null, area_h: null, modal_title: '', modal_body: '', buttons: [],
  ...over,
})

function mountCanvas(s: Step) {
  const w = mount(StepCanvas, { props: { step: s, imageUrl: (p: string) => p }, attachTo: document.body })
  const img = w.get('img')
  ;(img.element as HTMLElement).getBoundingClientRect = () =>
    ({ left: 0, top: 0, width: 1000, height: 500, right: 1000, bottom: 500, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect
  return { w, img }
}

describe('StepCanvas', () => {
  it('klik menaruh kotak berukuran bawaan di titik klik', async () => {
    const { w, img } = mountCanvas(step())
    await img.trigger('pointerdown', { clientX: 500, clientY: 250, pointerId: 1, button: 0 })
    await img.trigger('pointerup', { clientX: 500, clientY: 250, pointerId: 1, button: 0 })
    expect(w.emitted('area')).toEqual([[{ x: 50, y: 50, w: 16, h: 10 }]])
    w.unmount()
  })

  it('tarik di area kosong menggambar kotak dari sudut ke sudut', async () => {
    const { w, img } = mountCanvas(step())
    await img.trigger('pointerdown', { clientX: 100, clientY: 50, pointerId: 1, button: 0 })
    await img.trigger('pointermove', { clientX: 300, clientY: 200, pointerId: 1, button: 0 })
    await img.trigger('pointerup', { clientX: 300, clientY: 200, pointerId: 1, button: 0 })
    expect(w.emitted('area')).toEqual([[{ x: 20, y: 25, w: 20, h: 30 }]])
    w.unmount()
  })

  it('tarik di dalam kotak memindahkan, tarik sudut mengubah ukuran', async () => {
    const { w } = mountCanvas(step({ hotspot_x: 50, hotspot_y: 50, area_w: 20, area_h: 20 }))
    const box = w.get('[data-area]')
    await box.trigger('pointerdown', { clientX: 500, clientY: 250, pointerId: 1, button: 0 })
    await box.trigger('pointermove', { clientX: 600, clientY: 300, pointerId: 1, button: 0 })
    await box.trigger('pointerup', { clientX: 600, clientY: 300, pointerId: 1, button: 0 })
    expect(w.emitted('area')![0]).toEqual([{ x: 60, y: 60, w: 20, h: 20 }])

    const se = w.get('[data-handle=se]')
    await se.trigger('pointerdown', { clientX: 600, clientY: 300, pointerId: 2, button: 0 })
    await se.trigger('pointerup', { clientX: 700, clientY: 350, pointerId: 2, button: 0 })
    expect(w.emitted('area')![1]).toEqual([{ x: 55, y: 55, w: 30, h: 30 }])
    w.unmount()
  })

  it('langkah modal: klik tidak emit apa pun dan pratinjau modal tampil', async () => {
    const { w, img } = mountCanvas(step({
      kind: 'modal', modal_title: 'Halo', buttons: [{ label: 'Lanjut', action: 'next', primary: true }],
    }))
    await img.trigger('pointerdown', { clientX: 500, clientY: 250, pointerId: 1, button: 0 })
    await img.trigger('pointerup', { clientX: 500, clientY: 250, pointerId: 1, button: 0 })
    expect(w.emitted('area')).toBeUndefined()
    expect(w.find('[data-test=modal]').exists()).toBe(true)
    w.unmount()
  })
})
