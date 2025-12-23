import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // We will add our dashboard routes here later.
    // For now, no routes are defined, so it will just show App.vue
  ]
})

export default router