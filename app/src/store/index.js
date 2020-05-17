import Vue from 'vue';
import Vuex from 'vuex';
import site from './modules/site';

Vue.use(Vuex);

const debug = process.env.NODE_ENV !== 'production';

export default new Vuex.Store({
    modules: {
        site
    },
    strict: debug
});

