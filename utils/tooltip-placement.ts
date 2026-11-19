import type { TooltipPlacement } from '../types/demo'

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
