import type { SnapshotStep } from '../types/demo'

export interface Area { x: number; y: number; w: number; h: number }

export const DEFAULT_AREA = { w: 16, h: 10 }
export const MIN_AREA = 2

const r2 = (v: number) => Math.round(v * 100) / 100
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/**
 * Satu sumbu: dari tepi lo..hi (persen) ke [pusat, ukuran] berdua 2 desimal yang
 * dijamin c - s/2 >= 0 dan c + s/2 <= 100. Tepi dibulatkan ke dalam ke seperseratus,
 * ukuran dibuat genap (seperseratus) supaya pusatnya juga tepat 2 desimal.
 */
function fit(lo: number, hi: number): [number, number] {
  let L = Math.max(0, Math.ceil(lo * 100 - 1e-6))
  let H = Math.min(10000, Math.floor(hi * 100 + 1e-6))
  if ((H - L) % 2 !== 0) H -= 1
  const min = MIN_AREA * 100
  if (H - L < min) {
    if (L + min <= 10000) H = L + min
    else L = H - min
  }
  let c = (L + H) / 200
  const s = (H - L) / 100
  // jaga-jaga selisih pecahan biner
  if (c - s / 2 < 0) c = r2(c + 0.01)
  if (c + s / 2 > 100) c = r2(c - 0.01)
  return [c, s]
}

function fromEdges(x1: number, y1: number, x2: number, y2: number): Area {
  const [x, w] = fit(x1, x2)
  const [y, h] = fit(y1, y2)
  return { x, y, w, h }
}

/** Kotak berukuran bawaan di tengah klik, digeser supaya di dalam gambar. */
export function areaFromClick(x: number, y: number): Area {
  const { w, h } = DEFAULT_AREA
  const cx = clamp(x, w / 2, 100 - w / 2)
  const cy = clamp(y, h / 2, 100 - h / 2)
  return fromEdges(cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2)
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
  const cx = clamp(area.x + dx, area.w / 2, 100 - area.w / 2)
  const cy = clamp(area.y + dy, area.h / 2, 100 - area.h / 2)
  return fromEdges(cx - area.w / 2, cy - area.h / 2, cx + area.w / 2, cy + area.h / 2)
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
