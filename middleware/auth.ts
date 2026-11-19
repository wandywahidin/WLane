// Dipasang di /dashboard, /editor/*, /akun (definePageMeta({ middleware: 'auth' })).
// Halaman-halaman itu ssr: false, jadi middleware ini berjalan di browser.
export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return
  const supabase = useSupabaseClient()
  // getSession() menunggu inisialisasi client, termasuk menukar ?code= hasil OAuth.
  const { data } = await supabase.auth.getSession()
  if (data.session) return
  // Error OAuth (mis. LIMIT_USERS) dikirim ke redirectTo; teruskan ke /login.
  return navigateTo({ path: '/login', query: authErrorParams(to.query, to.hash) })
})
