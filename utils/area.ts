import type { SnapshotStep } from '../types/demo'

export interface Area { x: number; y: number; w: number; h: number }

export const DEFAULT_AREA = { w: 16, h: 10 }
export const MIN_AREA = 2

const r2 = (v: number) => Math.round(v * 100) / 100
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

function fromEdges(x1: number, y1: number, x2: number, y2: number): Area {
  return { x: r2((x1 + x2) / 2), y: r2((y1 + y2) / 2), w: r2(x2 - x1), h: r2(y2 - y1) }
}

/** Kotak berukuran bawaan di tengah klik, digeser supaya di dalam gambar. */
export function areaFromClick(x: number, y: number): Area {
  const { w, h } = DEFAULT_AREA
  return {
    x: r2(clamp(x, w / 2, 100 - w / 2)),
    y: r2(clamp(y, h / 2, 100 - h / 2)),
    w,
    h,
  }
}

/** Sudut ke sudut; null kalau salah satu sisi < MIN_AREA (dianggap klik). */
export function areaFromDrag(a: { x: number; y: number }, b: { x: number; y: number }): Area | null {
  const x1 = clamp(Math.min(a.x, b.x), 0, 100)
  const x2 = clamp(Math.max(a.x, b.x), 0, 100)
  const y1 = clamp(Math.min(a.y, b.y), 0, 100)
  const y2 = clamp(Math.max(a.y, b.y), 0, 100)
  if (x2 - x1 < MIN_AREA || y2 - y1 < MIN_AREA) return null
  return fromEdges(x1, y1, x2, y2)
}

export function moveArea(area: Area, dx: number, dy: number): Area {
  return {
    x: r2(clamp(area.x + dx, area.w / 2, 100 - area.w / 2)),
    y: r2(clamp(area.y + dy, area.h / 2, 100 - area.h / 2)),
    w: r2(area.w),
    h: r2(area.h),
  }
}

/** Sudut lawan `corner` diam; sudut yang diseret mengikuti p. */
export function resizeArea(area: Area, corner: 'nw' | 'ne' | 'sw' | 'se', p: { x: number; y: number }): Area {
  const left = area.x - area.w / 2
  const right = area.x + area.w / 2
  const top = area.y - area.h / 2
  const bottom = area.y + area.h / 2
  const dragLeft = corner === 'nw' || corner === 'sw'
  const dragTop = corner === 'nw' || corner === 'ne'
  const fx = dragLeft ? right : left
  const fy = dragTop ? bottom : top
  const px = clamp(p.x, 0, 100)
  const py = clamp(p.y, 0, 100)
  const dx = dragLeft ? Math.min(px, fx - MIN_AREA) : Math.max(px, fx + MIN_AREA)
  const dy = dragTop ? Math.min(py, fy - MIN_AREA) : Math.max(py, fy + MIN_AREA)
  return fromEdges(Math.min(fx, dx), Math.min(fy, dy), Math.max(fx, dx), Math.max(fy, dy))
}

export function stepArea(
  s: Pick<SnapshotStep, 'hotspot_x' | 'hotspot_y' | 'area_w' | 'area_h'>,
): Area | null {
  if (s.area_w == null || s.area_h == null || s.hotspot_x == null || s.hotspot_y == null) return null
  return { x: r2(s.hotspot_x), y: r2(s.hotspot_y), w: r2(s.area_w), h: r2(s.area_h) }
}
