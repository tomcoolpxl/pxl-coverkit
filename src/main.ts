import { createApp } from 'vue';
import App from './App.vue';
import { router } from './app/router';
import { pinia } from './app/pinia';
import { vuetify } from './app/vuetify';
import '@mdi/font/css/materialdesignicons.css';
import 'vuetify/styles';
import './app/styles.css';

createApp(App).use(pinia).use(router).use(vuetify).mount('#app');
