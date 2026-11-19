import type { SupabaseClient } from '@supabase/supabase-js'

/** Membaca angka dari tabel app_config; `fallback` kalau gagal dibaca. */
export async function readConfigInt(client: SupabaseClient, key: string, fallback: number): Promise<number> {
  const { data, error } = await client.from('app_config').select('value').eq('key', key).single()
  const n = Number((data as { value?: unknown } | null)?.value)
  return error || !Number.isFinite(n) ? fallback : n
}
