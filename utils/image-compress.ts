// Kompresi di browser: decode → resize (lebar maks 1920) → WebP kualitas 0,8.
import { fitWithin, validateImageFile } from './image-files'

export interface CompressedImage { blob: Blob; width: number; height: number }
export type PrepareError = 'type' | 'size' | 'decode'
export interface PreparedImage { file: File; result?: CompressedImage; error?: PrepareError }

const WEBP_QUALITY = 0.8

export async function compressImage(file: File): Promise<CompressedImage> {
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    throw new Error('decode')
  }
  try {
    const { width, height } = fitWithin(bitmap.width, bitmap.height)
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('decode')
    ctx.drawImage(bitmap, 0, 0, width, height)
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/webp', WEBP_QUALITY))
    if (!blob || blob.type !== 'image/webp') throw new Error('decode')
    return { blob, width, height }
  } finally {
    bitmap.close()
  }
}

/** Memvalidasi dan mengompres setiap file; satu file gagal tidak menghentikan yang lain. */
export async function prepareImages(
  files: File[],
  compress: (file: File) => Promise<CompressedImage> = compressImage,
): Promise<PreparedImage[]> {
  const out: PreparedImage[] = []
  for (const file of files) {
    const check = validateImageFile(file)
    if (!check.ok) {
      out.push({ file, error: check.reason })
      continue
    }
    try {
      out.push({ file, result: await compress(file) })
    } catch {
      out.push({ file, error: 'decode' })
    }
  }
  return out
}
