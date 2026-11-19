export const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024
export const MAX_IMAGE_WIDTH = 1920

export type ImageRejectReason = 'type' | 'size'

/** Memeriksa MIME type (bukan ekstensi nama file) dan ukuran asli. */
export function validateImageFile(file: { type: string; size: number }): { ok: true } | { ok: false; reason: ImageRejectReason } {
  if (!(ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type)) return { ok: false, reason: 'type' }
  if (file.size > MAX_IMAGE_BYTES) return { ok: false, reason: 'size' }
  return { ok: true }
}

/** Ukuran baru yang muat dalam lebar maksimal, proporsi tetap. Tidak pernah memperbesar. */
export function fitWithin(width: number, height: number, maxWidth = MAX_IMAGE_WIDTH): { width: number; height: number } {
  if (width <= maxWidth) return { width, height }
  return { width: maxWidth, height: Math.round((height * maxWidth) / width) }
}
