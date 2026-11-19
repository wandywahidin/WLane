import type { SupabaseClient } from '@supabase/supabase-js'

/** Slug demo contoh dari app_config, hanya kalau demonya masih terbit. */
export async function resolveSampleDemo(client: SupabaseClient): Promise<{ slug: string | null }> {
  const { data: config } = await client.from('app_config').select('value').eq('key', 'sample_demo_slug').maybeSingle()
  const slug = (config as { value?: unknown } | null)?.value
  if (typeof slug !== 'string' || slug === '') return { slug: null }

  const { data: demo, error } = await client.rpc('get_published_demo', { p_slug: slug })
  if (error || !demo) return { slug: null }
  return { slug }
}
