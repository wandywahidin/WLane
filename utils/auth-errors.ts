/** Pesan untuk error yang dikirim balik Supabase Auth lewat query/hash setelah OAuth. */
export function authErrorMessage(query: Record<string, string | undefined>): string | null {
  const description = query.error_description ?? ''
  if (!query.error && !description) return null
  if (description.includes('LIMIT_USERS')) return 'Kuota pengguna sedang penuh'
  return 'Login gagal, coba lagi'
}

/** Parameter error OAuth bisa datang di query (?error=...) atau hash (#error=...). */
export function authErrorParams(query: Record<string, unknown>, hash: string): Record<string, string | undefined> {
  const out: Record<string, string | undefined> = {}
  const fromHash = new URLSearchParams(hash.replace(/^#/, ''))
  for (const key of ['error', 'error_code', 'error_description']) {
    const q = query[key]
    const value = typeof q === 'string' ? q : fromHash.get(key) ?? undefined
    if (value) out[key] = value
  }
  return out
}
