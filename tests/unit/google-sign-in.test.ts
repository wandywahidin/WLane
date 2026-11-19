import { describe, expect, it, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { signInWithGoogle } from '../../utils/google-sign-in'

describe('signInWithGoogle', () => {
  it('memanggil OAuth Google dengan redirect ke /dashboard', async () => {
    const signInWithOAuth = vi.fn(async () => ({ data: {}, error: null }))
    const client = { auth: { signInWithOAuth } } as unknown as SupabaseClient
    await signInWithGoogle(client, 'https://contoh.id')
    expect(signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: { redirectTo: 'https://contoh.id/dashboard' },
    })
  })

  it('melempar kalau OAuth gagal dimulai', async () => {
    const client = { auth: { signInWithOAuth: async () => ({ data: {}, error: new Error('x') }) } } as unknown as SupabaseClient
    await expect(signInWithGoogle(client, 'https://contoh.id')).rejects.toThrow('x')
  })
})
