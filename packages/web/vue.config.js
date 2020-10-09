/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path')

module.exports = {
  lintOnSave: false,
  configureWebpack (config) {
    config.resolve.extensions.unshift('.vue')
  },
  outputDir: path.resolve('../electron/public'),
  devServer: {
    proxy: {
      '^/(api|media|data)/': {
        target: 'http://localhost:24000'
      }
    },
    progress: !process.env.CONCURRENTLY
  }
}
