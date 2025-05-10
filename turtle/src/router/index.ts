import { createRouter, createWebHistory } from 'vue-router'
import MainApplicationView from '../views/MainApplicationView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'mainApp',
      component: MainApplicationView
    }
    // Die alten Routen für HomeView und AboutView werden entfernt,
    // da MainApplicationView die Hauptansicht der Anwendung ist.
    // {
    //   path: '/about',
    //   name: 'about',
    //   // route level code-splitting
    //   // this generates a separate chunk (About.[hash].js) for this route
    //   // which is lazy-loaded when the route is visited.
    //   component: () => import('../views/AboutView.vue')
    // }
  ]
})

export default router
