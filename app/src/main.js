import Vue from 'vue'
import App from './App.vue'
import './registerServiceWorker'
import axios from 'axios'
import VueAxios from 'vue-axios'
import VueEsc from 'vue-esc'
import UniqueId from 'vue-unique-id'
import vuetify from './plugins/vuetify'

Vue.use(VueAxios, axios)
Vue.use(VueEsc)
Vue.use(UniqueId)
Vue.config.productionTip = false

new Vue({
  vuetify,
  render: h => h(App)
}).$mount('#app')
