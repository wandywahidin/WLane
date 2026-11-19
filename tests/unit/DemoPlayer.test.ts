import { afterEach, describe, expect, it } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import DemoPlayer from '../../components/player/DemoPlayer.vue'
import type { SnapshotStep } from '../../types/demo'

const step = (n: number, x: number, y: number): SnapshotStep => ({
  image_path: `p${n}.webp`, image_width: 1600, image_height: 1000,
  hotspot_x: x, hotspot_y: y, tooltip_text: `Tooltip ${n}`, tooltip_placement: 'auto',
})
const steps = [step(1, 10, 20), step(2, 50, 50), step(3, 90, 90)]
const imageUrl = (p: string) => `https://cdn.test/${p}`

const wrappers: Array<ReturnType<typeof mount>> = []
function mountPlayer() {
  const w = mount(DemoPlayer, { props: { steps, imageUrl }, attachTo: document.body })
  wrappers.push(w)
  return w
}
afterEach(() => {
  wrappers.splice(0).forEach(w => w.unmount())
  window.innerWidth = 1280
})

describe('DemoPlayer', () => {
  it('awal: langkah 1 dari 3, hotspot di posisi persen', () => {
    const w = mountPlayer()
    expect(w.text()).toContain('Langkah 1 dari 3')
    const hotspot = w.get('[data-test="hotspot"]')
    expect(hotspot.attributes('style')).toContain('left: 10%')
    expect(hotspot.attributes('style')).toContain('top: 20%')
    expect(w.text()).toContain('Tooltip 1')
    expect(w.get('img').attributes('src')).toBe('https://cdn.test/p1.webp')
  })

  it('klik hotspot maju; Kembali mundur; panah kanan maju', async () => {
    const w = mountPlayer()
    await w.get('[data-test="hotspot"]').trigger('click')
    expect(w.text()).toContain('Langkah 2 dari 3')

    const back = w.findAll('button').find(b => b.text() === 'Kembali')!
    await back.trigger('click')
    expect(w.text()).toContain('Langkah 1 dari 3')

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
    await flushPromises()
    expect(w.text()).toContain('Langkah 2 dari 3')

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }))
    await flushPromises()
    expect(w.text()).toContain('Langkah 1 dari 3')
  })

  it('setelah langkah 3: layar Selesai, Ulangi kembali ke langkah 1', async () => {
    const w = mountPlayer()
    for (let i = 0; i < 3; i++) await w.get('[data-test="hotspot"]').trigger('click')
    expect(w.text()).toContain('Selesai')
    expect(w.find('[data-test="hotspot"]').exists()).toBe(false)

    const again = w.findAll('button').find(b => b.text() === 'Ulangi')!
    await again.trigger('click')
    expect(w.text()).toContain('Langkah 1 dari 3')
  })

  it('di lebar 375 px tooltip dirender di bawah gambar', async () => {
    window.innerWidth = 375
    const w = mountPlayer()
    await flushPromises()
    const tip = w.get('[data-test="tooltip"]')
    expect(tip.classes()).toContain('below-image')
  })

  it('tooltip atas/bawah di tepi gambar dirapatkan ke dalam, tidak keluar', async () => {
    const edge = [{ ...step(1, 95, 10) }, { ...step(2, 3, 90) }]
    const w = mount(DemoPlayer, { props: { steps: edge, imageUrl }, attachTo: document.body })
    wrappers.push(w)
    await flushPromises()
    expect(w.get('[data-test="tooltip"]').classes()).toEqual(expect.arrayContaining(['bottom', 'align-end']))
    await w.get('[data-test="hotspot"]').trigger('click')
    expect(w.get('[data-test="tooltip"]').classes()).toEqual(expect.arrayContaining(['top', 'align-start']))
  })

  it('di desktop auto memilih sisi dari posisi hotspot', async () => {
    window.innerWidth = 1280
    const w = mountPlayer()
    await flushPromises()
    // hotspot y=20 → bottom
    expect(w.get('[data-test="tooltip"]').classes()).toContain('bottom')
  })
})
