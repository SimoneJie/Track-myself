import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    component: () => import('../pages/index/index.vue')
  },
  {
    path: '/weight-stats',
    component: () => import('../pages/WeightStates.vue')
  },
  {
    path: '/finance-stats',
    component: () => import('../pages/FinanceStates.vue')
  },
  {
    path: '/period-stats',
    component: () => import('../pages/PeriodStates.vue')
  },
  {
    path: '/finance-daily/:date',
    name: 'FinanceDaily',
    component: () => import('../pages/DailyFinance.vue'),
    props: true
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
