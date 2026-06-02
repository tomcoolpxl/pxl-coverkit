import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'overview',
    component: () => import('@/features/overview/OverviewPage.vue'),
  },
  {
    path: '/cards/new',
    name: 'card-new',
    component: () => import('@/features/wizard/WizardPage.vue'),
  },
  {
    path: '/cards/:id',
    name: 'card-detail',
    component: () => import('@/features/detail/CardDetailPage.vue'),
    props: true,
  },
  {
    path: '/cards/:id/edit',
    name: 'card-edit',
    component: () => import('@/features/edit/CardEditPage.vue'),
    props: true,
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('@/features/settings/SettingsPage.vue'),
  },
  {
    path: '/about',
    name: 'about',
    component: () => import('@/features/about/AboutPage.vue'),
  },
  { path: '/:pathMatch(.*)*', redirect: '/' },
];

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
});
