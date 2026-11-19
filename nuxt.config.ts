// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2026-11-19',
  devtools: { enabled: false },
  modules: ['@nuxtjs/supabase'],
  supabase: {
    // Pengalihan login diatur oleh middleware sendiri (middleware/auth.ts).
    redirect: false,
    types: false,
  },
  app: {
    head: {
      htmlAttrs: { lang: 'id' },
      meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
    },
  },
  routeRules: {
    '/': { prerender: true },
    '/privasi': { prerender: true },
    '/syarat': { prerender: true },
    '/dashboard/**': { ssr: false },
    '/editor/**': { ssr: false },
    '/akun': { ssr: false },
    '/d/**': { ssr: true },
  },
})
