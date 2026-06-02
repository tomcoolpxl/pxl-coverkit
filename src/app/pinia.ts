import { createPinia } from 'pinia';
import { createPersistedState } from 'pinia-plugin-persistedstate';
import { localStorageAdapter } from '@/data/storage';

export const pinia = createPinia();

pinia.use(
  createPersistedState({
    storage: localStorageAdapter,
    key: (id) => `pxl-coverkit:v1:${id}`,
  }),
);
