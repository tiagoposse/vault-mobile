import store from '../store/index'

const routes = [
  {
    path: '/login',
    component: () => import('layouts/UnauthenticatedLayout.vue'),
    children: [
      { path: '', component: () => import('pages/Auth.vue') }
    ]
  },
  {
    path: '/',
    component: () => import('layouts/UnauthenticatedLayout.vue'),
    children: [
      { path: '', component: () => import('pages/Auth.vue') }
    ]
  },
  {
    path: '/secrets',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/Secrets.vue') }
    ],
    beforeEnter (to, from, next) {
      console.log('entering secrets')
      next()
    }
  },
  {
    path: '/settings',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/Settings.vue') }
    ]
  },
  {
    path: '/setup',
    component: () => import('layouts/UnauthenticatedLayout.vue'),
    children: [
      { path: '', component: () => import('pages/Setup.vue') }
    ],
    beforeEnter (to, from, next) {
      if (store().getters['settings/isInitialized']) {
        next('/')
      } else {
        next()
      }
    }
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '*',
    component: () => import('pages/Error404.vue')
  }
]

export default routes
