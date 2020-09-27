import Editor from '@/views/Editor'
import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      component: Editor
    }
  ]
})

export default router
