import { describe, expect, it, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { deleteImages, imagePath, listDemoImages, publicImageUrl, uploadImage } from '../../utils/image-store'

function mockClient() {
  const bucket = {
    upload: vi.fn().mockResolvedValue({ data: {}, error: null }),
    remove: vi.fn().mockResolvedValue({ data: [], error: null }),
    list: vi.fn().mockResolvedValue({
      data: [{ name: 'a.webp' }, { name: '.emptyFolderPlaceholder' }, { name: 'b.webp' }],
      error: null,
    }),
    getPublicUrl: vi.fn((p: string) => ({ data: { publicUrl: `https://cdn.test/${p}` } })),
  }
  const from = vi.fn(() => bucket)
  const client = { storage: { from } } as unknown as SupabaseClient
  return { client, bucket, from }
}

describe('image-store', () => {
  it('imagePath membuat <user>/<demo>/<uuid>.webp', () => {
    expect(imagePath('u', 'd')).toMatch(/^u\/d\/[0-9a-f-]{36}\.webp$/)
    expect(imagePath('u', 'd')).not.toBe(imagePath('u', 'd'))
  })

  it('uploadImage mengunggah ke bucket step-images sebagai webp tanpa upsert', async () => {
    const { client, bucket, from } = mockClient()
    const blob = new Blob(['x'], { type: 'image/webp' })
    await uploadImage(client, 'u/d/f.webp', blob)
    expect(from).toHaveBeenCalledWith('step-images')
    expect(bucket.upload).toHaveBeenCalledWith('u/d/f.webp', blob, { contentType: 'image/webp', upsert: false })
  })

  it('uploadImage melempar error dari storage', async () => {
    const { client, bucket } = mockClient()
    bucket.upload.mockResolvedValue({ data: null, error: new Error('boom') })
    await expect(uploadImage(client, 'p', new Blob())).rejects.toThrow('boom')
  })

  it('deleteImages dengan array kosong tidak memanggil remove', async () => {
    const { client, bucket } = mockClient()
    await deleteImages(client, [])
    expect(bucket.remove).not.toHaveBeenCalled()
  })

  it('deleteImages menghapus semua path', async () => {
    const { client, bucket } = mockClient()
    await deleteImages(client, ['a', 'b'])
    expect(bucket.remove).toHaveBeenCalledWith(['a', 'b'])
  })

  it('listDemoImages mengembalikan path lengkap tanpa placeholder', async () => {
    const { client, bucket } = mockClient()
    expect(await listDemoImages(client, 'u', 'd')).toEqual(['u/d/a.webp', 'u/d/b.webp'])
    expect(bucket.list).toHaveBeenCalledWith('u/d', expect.objectContaining({ limit: 1000 }))
  })

  it('publicImageUrl memakai getPublicUrl', () => {
    const { client } = mockClient()
    expect(publicImageUrl(client, 'u/d/a.webp')).toBe('https://cdn.test/u/d/a.webp')
  })
})
