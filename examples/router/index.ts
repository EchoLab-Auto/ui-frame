import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/components',
  },
  {
    path: '/components',
    name: 'Components',
    component: () => import('../pages/ComponentsPage.vue'),
  },
  {
    path: '/layout',
    name: 'Layout',
    component: () => import('../pages/LayoutPage.vue'),
  },
]

export default createRouter({
  history: createWebHistory('/ui-frame/'),
  routes,
})
