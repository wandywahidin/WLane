import { serverSupabaseClient } from '#supabase/server'

// Dipanggil landing page (di klien) supaya slug bisa diganti di app_config tanpa deploy ulang.
export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'public, max-age=60')
  const client = await serverSupabaseClient(event)
  return resolveSampleDemo(client)
})
