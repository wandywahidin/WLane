import { describe, expect, it, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { DEV_EMAIL, DEV_PASSWORD, devSignIn } from '../../utils/dev-login'

function client(signInError: { message: string } | null, signUpError: { message: string } | null = null) {
  const signInWithPassword = vi.fn(async () => ({ data: {}, error: signInError }))
  const signUp = vi.fn(async () => ({ data: {}, error: signUpError }))
  return { c: { auth: { signInWithPassword, signUp } } as unknown as SupabaseClient, signInWithPassword, signUp }
}

describe('devSignIn', () => {
  it('login dengan email dan password hardcode', async () => {
    const { c, signInWithPassword, signUp } = client(null)
    await devSignIn(c)
    expect(signInWithPassword).toHaveBeenCalledWith({ email: DEV_EMAIL, password: DEV_PASSWORD })
    expect(signUp).not.toHaveBeenCalled()
  })

  it('akun belum ada → dibuat otomatis lalu masuk', async () => {
    const { c, signUp } = client({ message: 'Invalid login credentials' })
    await devSignIn(c)
    expect(signUp).toHaveBeenCalledWith({ email: DEV_EMAIL, password: DEV_PASSWORD })
  })

  it('pendaftaran gagal → melempar error', async () => {
    const { c } = client({ message: 'Invalid login credentials' }, { message: 'Email logins are disabled' })
    await expect(devSignIn(c)).rejects.toThrow('Email logins are disabled')
  })
})
