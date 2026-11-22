import { describe, expect, it, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { authErrorMessage, signInWithEmail, signUpWithEmail, validateCredentials, MIN_PASSWORD } from '../../utils/email-auth'

function client(result: { session?: object | null; error?: { message: string; code?: string; status?: number } | null }) {
  const response = async () => ({ data: { session: result.session ?? null, user: null }, error: result.error ?? null })
  const signInWithPassword = vi.fn(response)
  const signUp = vi.fn(response)
  return { c: { auth: { signInWithPassword, signUp } } as unknown as SupabaseClient, signInWithPassword, signUp }
}

describe('validateCredentials', () => {
  it('email kosong atau tidak valid', () => {
    expect(validateCredentials({ email: '', password: 'rahasia123' })).toBe('Isi email Anda')
    expect(validateCredentials({ email: 'bukan-email', password: 'rahasia123' })).toBe('Format email tidak valid')
  })

  it('password kosong saat login', () => {
    expect(validateCredentials({ email: 'a@b.id', password: '' })).toBe('Isi password Anda')
  })

  it('daftar: password minimal 8 karakter dan harus sama dengan ulangan', () => {
    expect(MIN_PASSWORD).toBe(8)
    expect(validateCredentials({ email: 'a@b.id', password: '1234567', confirm: '1234567' })).toBe('Password minimal 8 karakter')
    expect(validateCredentials({ email: 'a@b.id', password: '12345678', confirm: '12345679' })).toBe('Ulangi password dengan benar')
    expect(validateCredentials({ email: 'a@b.id', password: '12345678', confirm: '12345678' })).toBeNull()
  })

  it('login tidak memeriksa panjang password (akun lama tetap bisa masuk)', () => {
    expect(validateCredentials({ email: ' a@b.id ', password: 'x' })).toBeNull()
  })
})

describe('authErrorMessage', () => {
  it('memetakan kode error Supabase ke bahasa Indonesia', () => {
    expect(authErrorMessage({ message: 'Invalid login credentials', code: 'invalid_credentials' })).toBe('Email atau password salah')
    expect(authErrorMessage({ message: 'User already registered', code: 'user_already_exists' })).toBe('Email ini sudah terdaftar. Silakan masuk.')
    expect(authErrorMessage({ message: 'x', code: 'weak_password' })).toBe('Password minimal 8 karakter')
    expect(authErrorMessage({ message: 'x', code: 'email_address_invalid' })).toBe('Format email tidak valid')
    expect(authErrorMessage({ message: 'x', code: 'over_request_rate_limit' })).toBe('Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.')
    expect(authErrorMessage({ message: 'x', code: 'email_not_confirmed' })).toBe('Email belum dikonfirmasi. Cek kotak masuk Anda.')
    expect(authErrorMessage({ message: 'x', code: 'signup_disabled' })).toBe('Pendaftaran sedang ditutup')
  })

  it('trigger batas akun menolak pendaftaran → Kuota pengguna sedang penuh', () => {
    // GoTrue membungkus exception trigger auth.users (0002_limits.sql) jadi pesan generik ini.
    expect(authErrorMessage({ message: 'Database error saving new user', code: 'unexpected_failure' })).toBe('Kuota pengguna sedang penuh')
  })

  it('error lain → pesan umum', () => {
    expect(authErrorMessage({ message: 'Failed to fetch' })).toBe('Terjadi kesalahan, coba lagi')
  })
})

describe('signInWithEmail', () => {
  it('email dirapikan (trim, huruf kecil) sebelum dikirim', async () => {
    const { c, signInWithPassword } = client({ session: {} })
    await signInWithEmail(c, ' Ana@Contoh.ID ', 'rahasia123')
    expect(signInWithPassword).toHaveBeenCalledWith({ email: 'ana@contoh.id', password: 'rahasia123' })
  })

  it('gagal → melempar pesan Indonesia', async () => {
    const { c } = client({ error: { message: 'Invalid login credentials', code: 'invalid_credentials' } })
    await expect(signInWithEmail(c, 'a@b.id', 'x')).rejects.toThrow('Email atau password salah')
  })
})

describe('signUpWithEmail', () => {
  it('berhasil dengan sesi → langsung masuk', async () => {
    const { c, signUp } = client({ session: { access_token: 't' } })
    await expect(signUpWithEmail(c, 'a@b.id', 'rahasia123')).resolves.toEqual({ signedIn: true })
    expect(signUp).toHaveBeenCalledWith({ email: 'a@b.id', password: 'rahasia123' })
  })

  it('tanpa sesi (konfirmasi email aktif) → perlu cek email', async () => {
    const { c } = client({ session: null })
    await expect(signUpWithEmail(c, 'a@b.id', 'rahasia123')).resolves.toEqual({ signedIn: false })
  })

  it('gagal → melempar pesan Indonesia', async () => {
    const { c } = client({ error: { message: 'User already registered', code: 'user_already_exists' } })
    await expect(signUpWithEmail(c, 'a@b.id', 'rahasia123')).rejects.toThrow('Email ini sudah terdaftar. Silakan masuk.')
  })
})
