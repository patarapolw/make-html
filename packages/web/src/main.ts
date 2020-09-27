import '@patarapolw/make-html-x-card'
import '@webcomponents/webcomponentsjs/webcomponents-loader'
import 'normalize.css/normalize.css'

import './plugins/material'
import './index.css'

import Vue from 'vue'

import App from './App.vue'
import router from './router'

Vue.config.productionTip = false

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
