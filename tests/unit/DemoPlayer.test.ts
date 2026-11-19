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

  it('mode fit (embed): panggung memakai rasio gambar supaya muat di tinggi iframe', () => {
    const w = mount(DemoPlayer, { props: { steps, imageUrl, fit: true }, attachTo: document.body })
    wrappers.push(w)
    expect(w.classes()).toContain('fit')
    expect(w.get('[data-test="stage"]').attributes('style')).toContain('--ar: 1.6')
  })

  describe('sorotan dan modal', () => {
    const base = (n: number) => ({ image_path: `p${n}.webp`, image_width: 1600, image_height: 1000 })
    const area = (n: number) => ({ ...base(n), kind: 'hotspot', hotspot_x: 50, hotspot_y: 50, area_w: 20, area_h: 10, tooltip_text: `T${n}`, tooltip_placement: 'auto' })
    const modal = (n: number, buttons: unknown[]) => ({ ...base(n), kind: 'modal', modal_title: 'Halo', modal_body: '<b>x</b>', buttons })
    const plain = (n: number) => ({ ...base(n), kind: 'hotspot', hotspot_x: 10, hotspot_y: 10, tooltip_text: '', tooltip_placement: 'auto' })
    const mountSteps = (s: unknown[]) => {
      const w = mount(DemoPlayer, { props: { steps: s as SnapshotStep[], imageUrl }, attachTo: document.body })
      wrappers.push(w)
      return w
    }
    const mb = [{ label: 'Mulai', action: 'next', primary: true }, { label: 'Situs', action: 'link', url: 'https://a.id' }]

    it('sorotan: kotak area berstyle persen sudut kiri-atas, tanpa titik; klik maju', async () => {
      const w = mountSteps([area(1), plain(2)])
      const a = w.get('[data-test="area"]')
      const style = a.attributes('style')!
      expect(style).toContain('left: 40%')
      expect(style).toContain('top: 45%')
      expect(style).toContain('width: 20%')
      expect(style).toContain('height: 10%')
      expect(w.find('[data-test="hotspot"]').exists()).toBe(false)
      await a.trigger('click')
      expect(w.text()).toContain('Langkah 2 dari 2')
    })

    it('snapshot lama: titik hotspot, tanpa area', () => {
      const w = mountSteps([{ ...base(1), hotspot_x: 10, hotspot_y: 20, tooltip_text: 'x', tooltip_placement: 'auto' }])
      expect(w.find('[data-test="hotspot"]').exists()).toBe(true)
      expect(w.find('[data-test="area"]').exists()).toBe(false)
    })

    it('lebar 375: tooltip di bawah gambar dan klik area tetap maju', async () => {
      window.innerWidth = 375
      const w = mountSteps([area(1), plain(2)])
      await flushPromises()
      expect(w.get('[data-test="tooltip"]').classes()).toContain('below-image')
      await w.get('[data-test="area"]').trigger('click')
      expect(w.text()).toContain('Langkah 2 dari 2')
    })

    it('modal: lapisan di luar kotak gambar; tombol di luar area gulir', () => {
      const w = mountSteps([modal(1, mb), plain(2)])
      const stage = w.get('[data-test="stage"]').element
      const modalEl = w.get('[data-test="modal"]').element
      const body = w.get('[data-test="modal-body"]').element
      expect(stage.contains(modalEl)).toBe(false)
      expect(stage.querySelector('[data-test="dim"]')).not.toBeNull()
      expect(body.contains(w.get('[data-test="modal-footer"]').element)).toBe(false)
      for (const b of w.findAll('[data-test="modal-button"]')) expect(body.contains(b.element)).toBe(false)
    })

    it('modal: teks literal, tombol link aman, klik Mulai maju', async () => {
      const w = mountSteps([modal(1, mb), plain(2)])
      const m = w.get('[data-test="modal"]')
      expect(m.text()).toContain('Halo')
      expect(m.text()).toContain('<b>x</b>')
      expect(m.find('b').exists()).toBe(false)
      expect(w.find('[data-test="hotspot"]').exists()).toBe(false)
      expect(w.find('[data-test="area"]').exists()).toBe(false)
      const link = w.findAll('[data-test="modal-button"]').find(b => b.text() === 'Situs')!
      expect(link.element.tagName).toBe('A')
      expect(link.attributes('href')).toBe('https://a.id')
      expect(link.attributes('target')).toBe('_blank')
      expect(link.attributes('rel')).toBe('noopener noreferrer')
      await link.trigger('click')
      expect(w.text()).toContain('Langkah 1 dari 2')
      await w.findAll('[data-test="modal-button"]').find(b => b.text() === 'Mulai')!.trigger('click')
      expect(w.text()).toContain('Langkah 2 dari 2')
    })

    it('tombol link dengan url tidak aman tidak dirender', () => {
      const w = mountSteps([modal(1, [
        { label: 'Ok', action: 'next', primary: true },
        { label: 'Http', action: 'link', url: 'http://a.id' },
        { label: 'Js', action: 'link', url: 'javascript:alert(1)' },
      ])])
      expect(w.findAll('[data-test="modal-button"]').map(b => b.text())).toEqual(['Ok'])
    })

    it('tombol back: di langkah 1 diam, di langkah 2 mundur', async () => {
      const back = [{ label: 'Balik', action: 'back', primary: false }]
      const w = mountSteps([modal(1, back), modal(2, back)])
      await w.get('[data-test="modal-button"]').trigger('click')
      expect(w.text()).toContain('Langkah 1 dari 2')
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
      await flushPromises()
      expect(w.text()).toContain('Langkah 2 dari 2')
      await w.get('[data-test="modal-button"]').trigger('click')
      expect(w.text()).toContain('Langkah 1 dari 2')
    })
  })

  it('di desktop auto memilih sisi dari posisi hotspot', async () => {
    window.innerWidth = 1280
    const w = mountPlayer()
    await flushPromises()
    // hotspot y=20 → bottom
    expect(w.get('[data-test="tooltip"]').classes()).toContain('bottom')
  })
})
