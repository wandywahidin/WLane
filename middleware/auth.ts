// Dipasang di /dashboard, /editor/*, /akun (definePageMeta({ middleware: 'auth' })).
// Halaman-halaman itu ssr: false, jadi middleware ini berjalan di browser.
export default defineNuxtRouteMiddleware(async () => {
  if (import.meta.server) return
  const supabase = useSupabaseClient()
  // getSession() menunggu inisialisasi client (sesi tersimpan di browser).
  const { data } = await supabase.auth.getSession()
  if (data.session) return
  return navigateTo('/login')
})
