import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fakeSupabase } from './helpers/fake-supabase'

const store = vi.hoisted(() => ({ log: [] as string[] }))
vi.mock('../../utils/image-store', () => ({
  listDemoImages: vi.fn(async () => { store.log.push('listDemoImages'); return ['u1/d1/a.webp'] }),
  deleteImages: vi.fn(async (_c: unknown, paths: string[]) => { store.log.push(`deleteImages:${paths.join(',')}`) }),
}))

import { useDemos } from '../../composables/useDemos'

const demoRow = (over: Record<string, unknown> = {}) => ({
  id: 'd1', owner_id: 'u1', title: 'Demo', slug: 'abcd1234', status: 'draft',
  published_snapshot: null, published_at: null, created_at: '', updated_at: '', ...over,
})

beforeEach(() => { store.log.length = 0 })

describe('useDemos.create', () => {
  it('mencoba ulang dengan slug baru saat slug bentrok (23505)', async () => {
    let n = 0
    const { client, calls } = fakeSupabase((c) => {
      if (c.op === 'insert') {
        n++
        if (n === 1) return { error: { message: 'duplicate key', code: '23505' } }
        return { data: demoRow({ slug: (c.payload as { slug: string }).slug }) }
      }
      return { data: [] }
    })
    const { create } = useDemos(client)
    const demo = await create('Judul')

    const inserts = calls.filter(c => c.op === 'insert').map(c => c.payload as { slug: string; title: string })
    expect(inserts).toHaveLength(2)
    expect(inserts[0]!.slug).toMatch(/^[a-z0-9]{8}$/)
    expect(inserts[1]!.slug).toMatch(/^[a-z0-9]{8}$/)
    expect(inserts[0]!.slug).not.toBe(inserts[1]!.slug)
    expect(inserts[0]!.title).toBe('Judul')
    expect(demo.slug).toBe(inserts[1]!.slug)
  })

  it('LIMIT_DEMOS → error berisi batas dari app_config', async () => {
    const { client } = fakeSupabase((c) => {
      if (c.op === 'insert') return { error: { message: 'LIMIT_DEMOS', code: 'P0001' } }
      if (c.table === 'app_config') return { data: { value: 5 } }
      return { data: [] }
    })
    const { create, error } = useDemos(client)
    await expect(create('x')).rejects.toThrow()
    expect(error.value).toBe('Batas 5 demo tercapai')
  })
})

describe('useDemos.load', () => {
  it('mengisi thumbnail dari langkah pertama dan jumlah langkah', async () => {
    const { client } = fakeSupabase(c => (c.table === 'demos'
      ? { data: [
          demoRow({ id: 'd1', steps: [{ image_path: 'u1/d1/b.webp', position: 1 }, { image_path: 'u1/d1/a.webp', position: 0 }] }),
          demoRow({ id: 'd2', steps: [] }),
        ] }
      : { data: null }))
    const { load, demos } = useDemos(client)
    await load()
    expect(demos.value.map(d => [d.id, d.thumbnail_path, d.step_count])).toEqual([
      ['d1', 'u1/d1/a.webp', 2],
      ['d2', null, 0],
    ])
    expect(demos.value[0]).not.toHaveProperty('steps')
  })
})

describe('useDemos.remove', () => {
  it('menghapus semua gambar demo sebelum baris demo', async () => {
    const { client } = fakeSupabase((c) => {
      if (c.op === 'select' && c.table === 'demos') return { data: [demoRow()] }
      return { data: null }
    }, undefined, store.log)
    const { load, remove, demos } = useDemos(client)
    await load()
    await remove('d1')

    expect(store.log).toEqual(['select:demos', 'listDemoImages', 'deleteImages:u1/d1/a.webp', 'delete:demos'])
    expect(demos.value).toEqual([])
  })
})
