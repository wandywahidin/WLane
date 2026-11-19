import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import StepPanel from '../../components/editor/StepPanel.vue'
import ButtonEditor from '../../components/editor/ButtonEditor.vue'
import type { Step, StepButton } from '../../types/demo'

const step = (over: Partial<Step> = {}): Step => ({
  id: 's1', demo_id: 'd1', position: 0, image_path: 's1.webp', image_width: 1000, image_height: 500,
  hotspot_x: null, hotspot_y: null, tooltip_text: '', tooltip_placement: 'auto',
  kind: 'hotspot', area_w: null, area_h: null, modal_title: '', modal_body: '', buttons: [],
  ...over,
})

describe('StepPanel', () => {
  it('klik "Modal" emit kind modal', async () => {
    const w = mount(StepPanel, { props: { step: step(), index: 0 } })
    const btn = w.findAll('button').find(b => b.text() === 'Modal')!
    await btn.trigger('click')
    expect(w.emitted('kind')).toEqual([['modal']])
  })

  it('langkah modal menampilkan judul, teks, dan editor tombol', () => {
    const w = mount(StepPanel, {
      props: { step: step({ kind: 'modal', buttons: [{ label: 'Lanjut', action: 'next', primary: true }] }), index: 0 },
    })
    expect(w.find('input[maxlength="80"]').exists()).toBe(true)
    expect(w.find('textarea[maxlength="500"]').exists()).toBe(true)
    expect(w.findComponent(ButtonEditor).exists()).toBe(true)
  })
})

describe('ButtonEditor', () => {
  const lanjut: StepButton = { label: 'Lanjut', action: 'next', primary: true }
  const kembali: StepButton = { label: 'Kembali', action: 'back', primary: false }
  const addBtn = (w: ReturnType<typeof mount>) => w.findAll('button').find(b => b.text().includes('Tambah tombol'))!

  it('"+ Tambah tombol" menambah tombol Kembali', async () => {
    const w = mount(ButtonEditor, { props: { buttons: [lanjut] } })
    await addBtn(w).trigger('click')
    const out = w.emitted('update')![0][0] as StepButton[]
    expect(out).toHaveLength(2)
    expect(out[1]).toEqual({ label: 'Kembali', action: 'back', primary: false })
  })

  it('dengan 2 tombol, tombol tambah nonaktif', () => {
    const w = mount(ButtonEditor, { props: { buttons: [lanjut, kembali] } })
    expect(addBtn(w).attributes('disabled')).toBeDefined()
  })

  it('label kosong dan URL bukan https ditandai aria-invalid', () => {
    const w = mount(ButtonEditor, {
      props: { buttons: [{ label: '', action: 'next' }, { label: 'Situs', action: 'link', url: 'ht' }] },
    })
    const labels = w.findAll('[data-test=button-label]')
    expect(labels[0].attributes('aria-invalid')).toBe('true')
    expect(labels[1].attributes('aria-invalid')).toBeUndefined()
    expect(w.get('[data-test=button-url]').attributes('aria-invalid')).toBe('true')
  })

  it('menandai satu tombol utama membuat yang lain bukan utama', async () => {
    const w = mount(ButtonEditor, { props: { buttons: [lanjut, kembali] } })
    await w.findAll('[data-test=button-primary]')[1].setValue(true)
    const out = w.emitted('update')!.at(-1)![0] as StepButton[]
    expect(out[0].primary).toBe(false)
    expect(out[1].primary).toBe(true)
  })
})
