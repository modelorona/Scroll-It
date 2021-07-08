import Vue from 'vue'
import router from './router'
import App from './App.vue'
import axios from 'axios'
import VueAxios from 'vue-axios'
import VueEsc from 'vue-esc'
import UniqueId from 'vue-unique-id'
import vuetify from './plugins/vuetify'
import styles from '@mdi/font/css/materialdesignicons.min.css'
import fonts from './styles/fonts.css'

Vue.use(VueAxios, axios)
Vue.use(VueEsc)
Vue.use(UniqueId)
Vue.use(styles)
Vue.use(fonts)
Vue.config.productionTip = false

new Vue({
    vuetify,
    router,
    render: h => h(App)
}).$mount('#app')
