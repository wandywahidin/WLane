import { describe, expect, it } from 'vitest'
import { clickToPercent } from '../../utils/hotspot'
import { resolvePlacement } from '../../utils/tooltip-placement'
import { demoStatus } from '../../utils/demo-status'
import { orphanedImages } from '../../utils/orphans'
import { moveItem } from '../../utils/positions'

const rect = { left: 100, top: 0, width: 200, height: 100 }

describe('clickToPercent', () => {
  it('mengubah klik menjadi persen', () => {
    expect(clickToPercent(150, 50, rect)).toEqual({ x: 25, y: 50 })
  })
  it('membatasi klik di luar rect ke 0..100', () => {
    expect(clickToPercent(50, -20, rect)).toEqual({ x: 0, y: 0 })
    expect(clickToPercent(400, 300, rect)).toEqual({ x: 100, y: 100 })
  })
  it('membulatkan ke 2 desimal', () => {
    expect(clickToPercent(100 + 200 / 3, 100 / 3, rect)).toEqual({ x: 33.33, y: 33.33 })
  })
})

describe('resolvePlacement', () => {
  it('auto: hotspot di bawah → top', () => {
    expect(resolvePlacement('auto', { x: 50, y: 90 }, 1200)).toBe('top')
  })
  it('auto: hotspot di atas → bottom', () => {
    expect(resolvePlacement('auto', { x: 50, y: 10 }, 1200)).toBe('bottom')
  })
  it('auto: hotspot di kanan tengah → left', () => {
    expect(resolvePlacement('auto', { x: 90, y: 50 }, 1200)).toBe('left')
  })
  it('auto: hotspot di kiri tengah → right', () => {
    expect(resolvePlacement('auto', { x: 20, y: 50 }, 1200)).toBe('right')
  })
  it('pilihan eksplisit dipakai di desktop', () => {
    expect(resolvePlacement('left', { x: 10, y: 50 }, 1200)).toBe('left')
  })
  it('layar ≤ 640 px → below-image apa pun pilihannya', () => {
    expect(resolvePlacement('right', { x: 50, y: 50 }, 375)).toBe('below-image')
    expect(resolvePlacement('auto', { x: 50, y: 50 }, 640)).toBe('below-image')
  })
})

describe('demoStatus', () => {
  const t1 = '2026-11-19T10:00:00.000Z'
  const t2 = '2026-11-19T10:05:00.000Z'
  it('draft', () => {
    expect(demoStatus({ status: 'draft', published_at: null, updated_at: t1 })).toBe('draft')
  })
  it('terbit tanpa perubahan', () => {
    expect(demoStatus({ status: 'published', published_at: t1, updated_at: t1 })).toBe('published')
  })
  it('terbit dengan perubahan belum diterbitkan', () => {
    expect(demoStatus({ status: 'published', published_at: t1, updated_at: t2 })).toBe('published_dirty')
  })
  it('membandingkan waktu, bukan string (format offset berbeda)', () => {
    expect(demoStatus({ status: 'published', published_at: '2026-11-19T10:00:00+00:00', updated_at: t1 })).toBe('published')
  })
})

describe('orphanedImages', () => {
  it('hanya file yang tidak dipakai draft maupun snapshot', () => {
    expect(orphanedImages(['a', 'b', 'c'], ['a'], ['b'])).toEqual(['c'])
  })
})

describe('moveItem', () => {
  it('memindahkan elemen secara immutable', () => {
    const list = ['a', 'b', 'c']
    expect(moveItem(list, 0, 2)).toEqual(['b', 'c', 'a'])
    expect(moveItem(list, 2, 0)).toEqual(['c', 'a', 'b'])
    expect(list).toEqual(['a', 'b', 'c'])
  })
})
