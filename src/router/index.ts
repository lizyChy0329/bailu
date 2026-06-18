import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'sites',
      component: () => import('@/views/SitesView.vue'),
    },
    {
      path: '/edit/:id',
      name: 'editor',
      component: () => import('@/editor/views/EditView.vue'),
    },
    {
      path: '/preview/:id',
      name: 'preview',
      component: () => import('@/editor/views/PreviewView.vue'),
    },
  ],
})

export default router
