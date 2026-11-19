import { describe, expect, it } from 'vitest'
import { fakeSupabase } from './helpers/fake-supabase'
import { resolveSampleDemo } from '../../server/utils/sample-demo'

function client(configValue: unknown, demo: unknown) {
  return fakeSupabase(
    c => (c.table === 'app_config' ? { data: { value: configValue } } : { data: null }),
    () => ({ data: demo }),
  )
}

describe('resolveSampleDemo', () => {
  it('config berisi slug dan demo terbit → { slug }', async () => {
    const { client: c, rpc } = client('abc12345', { title: 'Contoh', slug: 'abc12345', steps: [] })
    expect(await resolveSampleDemo(c)).toEqual({ slug: 'abc12345' })
    expect(rpc).toHaveBeenCalledWith('get_published_demo', { p_slug: 'abc12345' })
  })

  it('config null → { slug: null } tanpa memanggil RPC', async () => {
    const { client: c, rpc } = client(null, null)
    expect(await resolveSampleDemo(c)).toEqual({ slug: null })
    expect(rpc).not.toHaveBeenCalled()
  })

  it('config berisi slug tapi demo tidak terbit → { slug: null }', async () => {
    const { client: c } = client('abc12345', null)
    expect(await resolveSampleDemo(c)).toEqual({ slug: null })
  })
})
