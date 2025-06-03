// https://nuxt.com/docs/api/configuration/nuxt-config
import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  ssr: true,
  modules: [
    '@nuxt/ui',
    'nuxt-tradingview'
  ],
  css: ['~/app/assets/css/main.css'],
  colorMode: {
    preference: 'light'
  },
  app: {
    pageTransition: { name: 'page', mode: 'out-in' },
  }
})
