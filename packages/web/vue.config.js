module.exports = {
  lintOnSave: false,
  configureWebpack (config) {
    config.resolve.extensions.unshift('.vue')
  }
}
