import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fakeSupabase } from './helpers/fake-supabase'

const m = vi.hoisted(() => ({ log: [] as string[] }))
vi.mock('../../utils/image-store', () => ({
  listDemoImages: vi.fn(async (_c: unknown, u: string, d: string) => [`${u}/${d}/x.webp`]),
  deleteImages: vi.fn(async (_c: unknown, paths: string[]) => { m.log.push(`deleteImages:${paths.join(',')}`) }),
}))

import { deleteAccount } from '../../composables/useAccount'

function client(rpcError: { message: string } | null = null) {
  const fake = fakeSupabase(
    c => (c.table === 'demos' ? { data: [{ id: 'd1', owner_id: 'u1' }, { id: 'd2', owner_id: 'u1' }] } : { data: null }),
    () => ({ error: rpcError }),
    m.log,
  )
  const signOut = vi.fn(async () => { m.log.push('signOut'); return { error: null } })
  ;(fake.client as unknown as { auth: unknown }).auth = { signOut }
  return { ...fake, signOut }
}

beforeEach(() => { m.log.length = 0 })

describe('deleteAccount', () => {
  it('menghapus gambar semua demo, lalu RPC, lalu signOut', async () => {
    const { client: c } = client()
    await deleteAccount(c)
    expect(m.log).toEqual([
      'select:demos',
      'deleteImages:u1/d1/x.webp',
      'deleteImages:u1/d2/x.webp',
      'rpc:delete_my_account',
      'signOut',
    ])
  })

  it('RPC gagal → melempar error dan tidak signOut', async () => {
    const { client: c, signOut } = client({ message: 'boom' })
    await expect(deleteAccount(c)).rejects.toBeTruthy()
    expect(signOut).not.toHaveBeenCalled()
  })
})
