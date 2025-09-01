import { createApp } from 'vue';
import App from './App.vue';
import './style.css';
import Vue3Toasity from 'vue3-toastify';
import 'vue3-toastify/dist/index.css';

const app = createApp(App);
app.use(Vue3Toasity, {
  autoClose: 3000,
  theme: 'dark',
  position: 'bottom-right',
});
app.mount('#app');