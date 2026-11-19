import { afterEach, describe, expect, it, vi } from 'vitest'
import { compressImage } from '../../utils/image-compress'

const close = vi.fn()

function stubCanvas(encodes: Record<string, boolean>) {
  vi.stubGlobal('createImageBitmap', vi.fn(async () => ({ width: 3840, height: 2160, close })))
  const toBlob = vi.fn((cb: (b: Blob | null) => void, type: string) => {
    // Browser yang tidak bisa meng-encode `type` diam-diam memberi PNG (perilaku Safari untuk WebP).
    cb(new Blob(['x'], { type: encodes[type] ? type : 'image/png' }))
  })
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ drawImage: vi.fn() } as unknown as CanvasRenderingContext2D)
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(toBlob as unknown as HTMLCanvasElement['toBlob'])
  return toBlob
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('compressImage', () => {
  it('WebP 0,8 dengan lebar maksimal 1920', async () => {
    const toBlob = stubCanvas({ 'image/webp': true, 'image/jpeg': true })
    const out = await compressImage(new File(['x'], 'a.png', { type: 'image/png' }))
    expect(out.blob.type).toBe('image/webp')
    expect([out.width, out.height]).toEqual([1920, 1080])
    expect(toBlob).toHaveBeenCalledWith(expect.any(Function), 'image/webp', 0.8)
  })

  it('browser tanpa encoder WebP (Safari/iOS) → JPEG 0,8, bukan error decode', async () => {
    const toBlob = stubCanvas({ 'image/webp': false, 'image/jpeg': true })
    const out = await compressImage(new File(['x'], 'a.png', { type: 'image/png' }))
    expect(out.blob.type).toBe('image/jpeg')
    expect(toBlob).toHaveBeenLastCalledWith(expect.any(Function), 'image/jpeg', 0.8)
  })
})
