import { describe, it, expect } from 'vitest'
import { areaFromClick, areaFromDrag, moveArea, resizeArea, stepArea } from '../../utils/area'
import { anchorPoint } from '../../utils/tooltip-placement'
import { normalizeSnapshotStep } from '../../utils/snapshot'

describe('area', () => {
  it('areaFromClick uses default size and stays inside', () => {
    expect(areaFromClick(50, 50)).toEqual({ x: 50, y: 50, w: 16, h: 10 })
    expect(areaFromClick(2, 99)).toEqual({ x: 8, y: 95, w: 16, h: 10 })
  })
  it('areaFromDrag', () => {
    expect(areaFromDrag({ x: 10, y: 10 }, { x: 30, y: 40 })).toEqual({ x: 20, y: 25, w: 20, h: 30 })
    expect(areaFromDrag({ x: 30, y: 40 }, { x: 10, y: 10 })).toEqual({ x: 20, y: 25, w: 20, h: 30 })
    expect(areaFromDrag({ x: 10, y: 10 }, { x: 11, y: 30 })).toBeNull()
  })
  it('moveArea stays inside', () => {
    expect(moveArea({ x: 50, y: 50, w: 20, h: 20 }, 45, 0).x).toBe(90)
  })
  it('resizeArea keeps opposite corner', () => {
    expect(resizeArea({ x: 50, y: 50, w: 20, h: 20 }, 'se', { x: 45, y: 45 })).toEqual({ x: 42.5, y: 42.5, w: 5, h: 5 })
    const m = resizeArea({ x: 50, y: 50, w: 20, h: 20 }, 'se', { x: 41, y: 41 })
    expect(m.w).toBe(2)
    expect(m.h).toBe(2)
    expect(resizeArea({ x: 50, y: 50, w: 20, h: 20 }, 'nw', { x: -5, y: 60 }).x).toBe(30)
  })
  it('stepArea', () => {
    expect(stepArea({ hotspot_x: 10, hotspot_y: 10, area_w: null, area_h: null })).toBeNull()
    expect(stepArea({ hotspot_x: 10, hotspot_y: 10, area_w: 4, area_h: 6 })).toEqual({ x: 10, y: 10, w: 4, h: 6 })
  })
  it('anchorPoint', () => {
    const c = { x: 50, y: 50 }
    const a = { x: 50, y: 50, w: 20, h: 10 }
    expect(anchorPoint('top', c, a)).toEqual({ x: 50, y: 45 })
    expect(anchorPoint('bottom', c, a)).toEqual({ x: 50, y: 55 })
    expect(anchorPoint('left', c, a)).toEqual({ x: 40, y: 50 })
    expect(anchorPoint('right', c, a)).toEqual({ x: 60, y: 50 })
    expect(anchorPoint('below-image', c, a)).toEqual({ x: 50, y: 50 })
    expect(anchorPoint('top', c, null)).toEqual({ x: 50, y: 50 })
  })
  it('normalizeSnapshotStep', () => {
    const s = normalizeSnapshotStep({ image_path: 'a', image_width: 1, image_height: 1, hotspot_x: 1, hotspot_y: 2 })
    expect(s.kind).toBe('hotspot')
    expect(s.buttons).toEqual([])
    expect(s.area_w).toBeNull()
    expect(s.tooltip_placement).toBe('auto')
    expect(s.hotspot_x).toBe(1)
  })
})
