/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path')

module.exports = {
  lintOnSave: false,
  configureWebpack (config) {
    config.module.rules
      .filter((el) => {
        return /** @type {string} */ (el.test.toString()).includes('\\.vue$')
      })
      .map((el) => {
        el.use
          .filter((u) => {
            return u.loader.includes('vue-loader')
          })
          .map((u) => {
            u.options = u.options || {}
            u.options.compilerOptions = u.options.compilerOptions || {}
            u.options.compilerOptions.isCustomElement = (tag) => {
              return tag.startsWith('mwc-') || tag === 'codemirror'
            }
          })
      })
    config.resolve.extensions.unshift('.vue')
  },
  outputDir: path.resolve('../server/src/main/resources/public'),
  devServer: {
    proxy: {
      '^/(api|media)/': {
        target: 'http://localhost:24000'
      }
    }
  }
}
