const mode = process.env.NODE_ENV || 'development'; 

module.exports = {
  ssr: false,
  router: {
    mode: 'hash'
  },
  plugins: [
    { src: 'node_modules/nuxt-minimal-admin' },
    { src: '~/plugins/index.js' },
    { src: '~/plugins/clipboard.js' }
  ],
  publicRuntimeConfig: {
    apiUrl: mode === 'production' ? 'https://timize.anhhao.me' : 'http://localhost:3001/timize'
  },
  modules: ['bootstrap-vue/nuxt'],
  bootstrapVue: {
    bootstrapCSS: false, // Or `css: false`
    bootstrapVueCSS: false // Or `bvCSS: false`
  },
  css: [
    '~/assets/scss/main.scss'
  ]
}