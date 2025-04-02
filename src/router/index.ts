import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    component: () => import('../components/Calendar.vue')
  },
  {
    path: '/weight-stats',
    component: () => import('../components/WeightStates.vue')
  },
  {
    path: '/finance-stats',
    component: () => import('../components/FinanceStates.vue')
  },
  {
    path: '/period-stats',
    component: () => import('../components/PeriodStates.vue')
  },
  {
    path: '/finance-daily/:date',
    name: 'FinanceDaily',
    component: () => import('../components/DailyFinance.vue'),
    props: true
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
