import type { SupabaseClient } from '@supabase/supabase-js'

/** Login hanya lewat Google; setelah berhasil Supabase mengalihkan ke /dashboard. */
export async function signInWithGoogle(client: SupabaseClient, origin: string): Promise<void> {
  const { error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: origin + '/dashboard' },
  })
  if (error) throw error
}
