import type { SupabaseClient } from '@supabase/supabase-js'

/** Sama dengan `minimum_password_length` di supabase/config.toml dan pengaturan project cloud. */
export const MIN_PASSWORD = 8

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export interface Credentials {
  email: string
  password: string
  /** Hanya diisi di form daftar; kalau ada, aturan password daftar ikut diperiksa. */
  confirm?: string
}

/** Pesan kesalahan pertama untuk form, atau null kalau isian siap dikirim. */
export function validateCredentials({ email, password, confirm }: Credentials): string | null {
  const e = email.trim()
  if (!e) return 'Isi email Anda'
  if (!EMAIL_RE.test(e)) return 'Format email tidak valid'
  if (!password) return 'Isi password Anda'
  if (confirm !== undefined) {
    if (password.length < MIN_PASSWORD) return `Password minimal ${MIN_PASSWORD} karakter`
    if (password !== confirm) return 'Ulangi password dengan benar'
  }
  return null
}

const MESSAGES: Record<string, string> = {
  invalid_credentials: 'Email atau password salah',
  user_already_exists: 'Email ini sudah terdaftar. Silakan masuk.',
  email_exists: 'Email ini sudah terdaftar. Silakan masuk.',
  weak_password: `Password minimal ${MIN_PASSWORD} karakter`,
  email_address_invalid: 'Format email tidak valid',
  validation_failed: 'Format email tidak valid',
  over_request_rate_limit: 'Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.',
  over_email_send_rate_limit: 'Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.',
  email_not_confirmed: 'Email belum dikonfirmasi. Cek kotak masuk Anda.',
  signup_disabled: 'Pendaftaran sedang ditutup',
}

/** Error Supabase Auth → pesan untuk pengguna. */
export function authErrorMessage(error: { message: string; code?: string }): string {
  // Satu-satunya trigger di auth.users adalah batas akun (0002_limits.sql); GoTrue
  // membungkus exception-nya jadi "Database error saving new user".
  if (error.message.includes('LIMIT_USERS') || error.message.includes('Database error saving new user')) {
    return 'Kuota pengguna sedang penuh'
  }
  return (error.code && MESSAGES[error.code]) || 'Terjadi kesalahan, coba lagi'
}

const normalize = (email: string) => email.trim().toLowerCase()

export async function signInWithEmail(client: SupabaseClient, email: string, password: string): Promise<void> {
  const { error } = await client.auth.signInWithPassword({ email: normalize(email), password })
  if (error) throw new Error(authErrorMessage(error))
}

/** `signedIn: false` berarti project mewajibkan konfirmasi email sebelum bisa masuk. */
export async function signUpWithEmail(client: SupabaseClient, email: string, password: string): Promise<{ signedIn: boolean }> {
  const { data, error } = await client.auth.signUp({ email: normalize(email), password })
  if (error) throw new Error(authErrorMessage(error))
  return { signedIn: !!data.session }
}
