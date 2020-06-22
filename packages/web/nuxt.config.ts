import fs from 'fs'

import { Configuration } from '@nuxt/types'

export default (): Configuration => {
  return {
    /*
     ** Nuxt rendering mode
     ** See https://nuxtjs.org/api/configuration-mode
     */
    mode: 'universal',
    target: 'static',
    telemetry: false,
    /*
     ** Headers of the page
     ** See https://nuxtjs.org/api/configuration-head
     */
    head: {
      title: 'make-html workbench',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          hid: 'description',
          name: 'description',
          content:
            'Powered by Markdown-it and HyperPug; and if used offline, provides caching function and more',
        },
      ],
      link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }],
    },
    /*
     ** Global CSS
     */
    css: [],
    /*
     ** Plugins to load before mounting the App
     ** https://nuxtjs.org/guide/plugins
     */
    plugins: ['~plugins/codemirror.client.js'],
    /*
     ** Nuxt.js dev-modules
     */
    buildModules: ['@nuxt/typescript-build'],
    /*
     ** Nuxt.js modules
     */
    modules: ['@nuxtjs/axios'],
    /*
     ** Build configuration
     ** See https://nuxtjs.org/api/configuration-build/
     */
    build: {
      postcss: {
        plugins: [require('tailwindcss')],
      },
    },
    router: {
      base:
        process.env.GH_PAGES && process.env.NODE_ENV !== 'development'
          ? `/${process.env.GH_PAGES}`
          : undefined,
    },
    env: {
      sanitizeHtml:
        process.env.GH_PAGES ||
        process.env.IS_DEPLOY ||
        process.env.SANITIZE_HTML ||
        '',
      placeholder:
        process.env.GH_PAGES || process.env.IS_DEPLOY
          ? fs.readFileSync('./example.md', 'utf8')
          : '',
    },
  }
}
