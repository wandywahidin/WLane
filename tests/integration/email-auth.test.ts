// Daftar dan masuk dengan email + password terhadap Supabase lokal: memastikan kode error
// GoTrue yang asli dipetakan ke pesan bahasa Indonesia oleh utils/email-auth.ts.
import { randomUUID } from 'node:crypto'
import { afterAll, describe, expect, it } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import { signInWithEmail, signUpWithEmail } from '../../utils/email-auth'

const URL = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321'
const ANON = process.env.SUPABASE_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
const SERVICE = process.env.SUPABASE_SERVICE_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const opts = { auth: { persistSession: false, autoRefreshToken: false } }
const admin = createClient(URL, SERVICE, opts)
const fresh = () => createClient(URL, ANON, opts)

const email = `daftar-${randomUUID()}@test.local`
const password = 'rahasia-123'

afterAll(async () => {
  const { data } = await admin.auth.admin.listUsers({ perPage: 1000 })
  const created = data.users.filter(u => u.email === email)
  for (const u of created) await admin.auth.admin.deleteUser(u.id)
})

describe('daftar dan masuk dengan email (Supabase lokal)', () => {
  it('daftar langsung mendapat sesi, lalu bisa masuk lagi', async () => {
    await expect(signUpWithEmail(fresh(), email.toUpperCase(), password)).resolves.toEqual({ signedIn: true })
    await expect(signInWithEmail(fresh(), email, password)).resolves.toBeUndefined()
  })

  it('email yang sama tidak bisa didaftarkan dua kali', async () => {
    await expect(signUpWithEmail(fresh(), email, password)).rejects.toThrow('Email ini sudah terdaftar. Silakan masuk.')
  })

  it('password salah', async () => {
    await expect(signInWithEmail(fresh(), email, 'salah-sekali')).rejects.toThrow('Email atau password salah')
  })

  it('password terlalu pendek ditolak server', async () => {
    await expect(signUpWithEmail(fresh(), `pendek-${randomUUID()}@test.local`, '1234567')).rejects.toThrow('Password minimal 8 karakter')
  })

  it('kuota pengguna penuh', async () => {
    const { data: cfg } = await admin.from('app_config').select('value').eq('key', 'max_users').single()
    const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 })
    const { error } = await admin.from('app_config').update({ value: list.users.length }).eq('key', 'max_users')
    expect(error).toBeNull()
    try {
      await expect(signUpWithEmail(fresh(), `penuh-${randomUUID()}@test.local`, password)).rejects.toThrow('Kuota pengguna sedang penuh')
    } finally {
      await admin.from('app_config').update({ value: cfg!.value }).eq('key', 'max_users')
    }
  })
})
