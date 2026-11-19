// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2026-11-19',
  devtools: { enabled: false },
  modules: ['@nuxtjs/supabase'],
  css: ['~/assets/main.css'],
  vite: {
    plugins: [tailwindcss()],
  },
  supabase: {
    // Pengalihan login diatur oleh middleware sendiri (middleware/auth.ts).
    redirect: false,
    types: false,
  },
  app: {
    head: {
      htmlAttrs: { lang: 'id' },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'theme-color', content: '#4f46e5' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap' },
      ],
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
