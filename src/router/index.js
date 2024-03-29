import { createRouter, createWebHashHistory } from 'vue-router';

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'todos',
      component: () => import('../views/TodoView.vue'),
    },
    {
      path: '/calendar',
      name: 'calendar',
      component: () => import('../views/CalendarView.vue'),
    },

    {
      path: '/notes',
      name: 'notes',
      component: () => import('../views/NoteListView.vue'),
    },

    {
      path: '/contents',
      name: 'contents',
      component: () => import('../views/ContentView.vue'),
    },
  ],
});

export default router;
