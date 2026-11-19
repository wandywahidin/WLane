import { describe, expect, it } from 'vitest'
import { authErrorMessage, authErrorParams } from '../../utils/auth-errors'

describe('authErrorParams', () => {
  it('membaca error dari hash kalau tidak ada di query', () => {
    expect(authErrorParams({}, '#error=server_error&error_description=Database+error+saving+new+user%3A+LIMIT_USERS'))
      .toEqual({ error: 'server_error', error_description: 'Database error saving new user: LIMIT_USERS' })
  })

  it('query didahulukan dan hanya kunci error yang diambil', () => {
    expect(authErrorParams({ error: 'access_denied', code: 'abc' }, '#error=lain'))
      .toEqual({ error: 'access_denied' })
  })

  it('tanpa error → objek kosong', () => {
    expect(authErrorParams({ code: 'abc' }, '')).toEqual({})
  })
})

describe('authErrorMessage', () => {
  it('LIMIT_USERS → Kuota pengguna sedang penuh', () => {
    expect(authErrorMessage({ error_description: 'Database error saving new user: LIMIT_USERS' }))
      .toBe('Kuota pengguna sedang penuh')
  })

  it('pesan generik GoTrue saat trigger auth.users menolak → Kuota pengguna sedang penuh', () => {
    // Callback OAuth membungkus exception trigger menjadi pesan generik ini;
    // satu-satunya trigger di auth.users adalah batas akun.
    expect(authErrorMessage({ error: 'server_error', error_description: 'Database error saving new user' }))
      .toBe('Kuota pengguna sedang penuh')
  })

  it('error lain → Login gagal, coba lagi', () => {
    expect(authErrorMessage({ error: 'access_denied', error_description: 'User denied' }))
      .toBe('Login gagal, coba lagi')
    expect(authErrorMessage({ error: 'server_error' })).toBe('Login gagal, coba lagi')
  })

  it('tanpa error → null', () => {
    expect(authErrorMessage({})).toBeNull()
    expect(authErrorMessage({ next: '/dashboard' })).toBeNull()
  })
})
