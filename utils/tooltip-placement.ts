import type { TooltipPlacement } from '../types/demo'

import type { Area } from './area'

export const MOBILE_MAX_WIDTH = 640

export type ResolvedPlacement = Exclude<TooltipPlacement, 'auto'> | 'below-image'

/** Sisi tooltip yang dipakai. Di layar ≤ 640 px tooltip selalu pindah ke bawah gambar. */
export function resolvePlacement(
  pref: TooltipPlacement,
  hotspot: { x: number; y: number },
  viewportWidth: number,
): ResolvedPlacement {
  if (viewportWidth <= MOBILE_MAX_WIDTH) return 'below-image'
  if (pref !== 'auto') return pref
  if (hotspot.y > 70) return 'top'
  if (hotspot.y < 30) return 'bottom'
  if (hotspot.x > 60) return 'left'
  return 'right'
}

/** Titik di sisi kotak tempat tooltip menempel; `center` kalau di bawah gambar atau tanpa kotak. */
export function anchorPoint(
  placement: ResolvedPlacement,
  center: { x: number; y: number },
  area: Area | null,
): { x: number; y: number } {
  if (!area || placement === 'below-image') return { x: center.x, y: center.y }
  const r2 = (v: number) => Math.round(v * 100) / 100
  switch (placement) {
    case 'top': return { x: area.x, y: r2(area.y - area.h / 2) }
    case 'bottom': return { x: area.x, y: r2(area.y + area.h / 2) }
    case 'left': return { x: r2(area.x - area.w / 2), y: area.y }
    case 'right': return { x: r2(area.x + area.w / 2), y: area.y }
  }
}
