/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path')

module.exports = {
  lintOnSave: false,
  configureWebpack (config) {
    config.resolve.extensions.unshift('.vue')
  },
  outputDir: path.resolve('../server/src/main/resources/public')
}
