import Vue from 'vue';
import Router from 'vue-router';

Vue.use(Router);

export default new Router({
    mode: 'history',
    routes: [
        {
            path: '/',
            name: 'index',
            component: () => import('../components/Index.vue')
        },
        {
            path: '/r/:thread',
            name: 'thread_view',
            component: () => import('../components/Index.vue')
        },
        {
            path: '*',
            name: 'not_found',
            component: () => import('../components/NotFound.vue')
        }
    ]
});
