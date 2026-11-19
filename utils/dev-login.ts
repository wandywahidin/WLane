// LOGIN DEV SAJA — hanya ditampilkan saat `npm run dev` (import.meta.dev) dan hanya berfungsi
// di Supabase lokal, tempat provider email diaktifkan (supabase/config.toml).
// Di production provider email dimatikan, jadi kredensial ini tidak berguna di sana.
import type { SupabaseClient } from '@supabase/supabase-js'

export const DEV_EMAIL = 'dev@panduan.local'
export const DEV_PASSWORD = 'dev12345'

/** Masuk dengan akun dev; kalau belum ada, akun dibuat dulu (konfirmasi email mati di lokal). */
export async function devSignIn(client: SupabaseClient): Promise<void> {
  const credentials = { email: DEV_EMAIL, password: DEV_PASSWORD }
  const { error } = await client.auth.signInWithPassword(credentials)
  if (!error) return
  const { error: signUpError } = await client.auth.signUp(credentials)
  if (signUpError) throw signUpError
}
