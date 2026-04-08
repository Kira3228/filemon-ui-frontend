import Vue from "vue";
import App from "./App.vue";
import "./plugins/primevue";
import "./assets/tailwind.css";
import router from "./router";
import VueRouter from "vue-router";
import "./assets/global.css";
import { createPinia, PiniaVuePlugin } from "pinia";
import { initTheme } from "./shared-ui/theme/use-theme";
Vue.use(VueRouter);

Vue.config.productionTip = false;
Vue.use(PiniaVuePlugin);
const pinia = createPinia();
initTheme();

new Vue({
  router,
  pinia,
  render: (h) => h(App)
}).$mount("#app");
