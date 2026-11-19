import { describe, expect, it, vi } from 'vitest'
import { fitWithin, validateImageFile } from '../../utils/image-files'
import { prepareImages } from '../../utils/image-compress'

const MB = 1024 * 1024

describe('validateImageFile', () => {
  it('menolak HEIC berdasarkan type', () => {
    expect(validateImageFile({ type: 'image/heic', size: 1 })).toEqual({ ok: false, reason: 'type' })
  })

  it('menerima PNG, JPG, WebP', () => {
    for (const type of ['image/png', 'image/jpeg', 'image/webp']) {
      expect(validateImageFile({ type, size: 1 })).toEqual({ ok: true })
    }
  })

  it('menolak di atas 10 MB, tepat 10 MB lolos', () => {
    expect(validateImageFile({ type: 'image/png', size: 10 * MB + 1 })).toEqual({ ok: false, reason: 'size' })
    expect(validateImageFile({ type: 'image/png', size: 10 * MB })).toEqual({ ok: true })
  })
})

describe('fitWithin', () => {
  it('memperkecil proporsional ke lebar maksimal 1920', () => {
    expect(fitWithin(3840, 2160)).toEqual({ width: 1920, height: 1080 })
  })

  it('tidak mengubah gambar yang sudah muat', () => {
    expect(fitWithin(800, 600)).toEqual({ width: 800, height: 600 })
  })
})

describe('prepareImages', () => {
  it('kegagalan satu file tidak menghentikan file lain', async () => {
    const good = new File(['png'], 'ok.png', { type: 'image/png' })
    const heic = new File(['heic'], 'foto.heic', { type: 'image/heic' })
    const broken = new File(['bukan gambar'], 'rusak.png', { type: 'image/png' })
    const result = { blob: new Blob(['w'], { type: 'image/webp' }), width: 10, height: 5 }
    const compress = vi.fn(async (f: File) => {
      if (f === broken) throw new Error('decode')
      return result
    })

    const out = await prepareImages([good, heic, broken], compress)

    expect(out).toHaveLength(3)
    expect(out[0]).toEqual({ file: good, result })
    expect(out[1]).toEqual({ file: heic, error: 'type' })
    expect(out[2]).toEqual({ file: broken, error: 'decode' })
    expect(compress).toHaveBeenCalledTimes(2) // HEIC tidak dicoba dikompres
  })
})
