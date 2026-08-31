export default defineNuxtConfig({
  compatibilityDate: '2026-08-30',
  devtools: { enabled: false },

  // カタログサイトなので SSG。詳細ページも静的 HTML として吐き出して OGP/SEO を効かせる
  ssr: true,
  nitro: {
    prerender: {
      crawlLinks: true,
      routes: ['/', '/404.html'],
    },
  },

  app: {
    // サブパス配信する場合は NUXT_APP_BASE_URL=/repo-name/ を指定してビルドする
    baseURL: process.env.NUXT_APP_BASE_URL || '/',
    head: {
      htmlAttrs: { lang: 'ja' },
      title: "minimo's toy box",
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'minimo がつくったブラウザゲームのおもちゃ箱。ぜんぶその場で遊べます。' },
        { name: 'theme-color', content: '#0a0c14' },
      ],
      link: [{ rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' }],
    },
  },

  css: ['~/assets/main.css'],

  devServer: {
    port: Number(process.env.DEV_SERVER_PORT) || 3000,
  },
})
