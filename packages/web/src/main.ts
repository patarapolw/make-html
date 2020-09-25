import '@patarapolw/make-html-x-card'
import '@webcomponents/webcomponentsjs/webcomponents-loader'
import 'normalize.css/normalize.css'

import './plugins/material'
import './plugins/codemirror'
import './index.css'

import Vue from 'vue'

import App from './App.vue'
import store from './store'

Vue.config.productionTip = false

new Vue({
  store,
  render: h => h(App)
}).$mount('#app')
