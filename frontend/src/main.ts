import { createApp } from "vue";
import { createRouter, createWebHistory } from "vue-router";
import App from "./App.vue";
import Login from "./views/Login.vue";
import Dashboard from "./views/Dashboard.vue";
import Players from "./views/Players.vue";
import Settings from "./views/Settings.vue";
import ServerControl from "./views/ServerControl.vue";
import { useAuth } from "./composables/auth";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/login", name: "Login", component: Login, meta: { public: true } },
    { path: "/", name: "Dashboard", component: Dashboard },
    { path: "/players", name: "Players", component: Players },
    { path: "/settings", name: "Settings", component: Settings },
    { path: "/server", name: "ServerControl", component: ServerControl },
  ],
});

// Navigation guard — check auth before each route
router.beforeEach(async (to) => {
  if (to.meta.public) return true;

  const { isAuthenticated, authChecked, checkAuth } = useAuth();

  // Only check once (or if not yet checked)
  if (!authChecked.value) {
    await checkAuth();
  }

  if (!isAuthenticated.value) {
    return { name: "Login" };
  }

  return true;
});

const app = createApp(App);
app.use(router);
app.mount("#app");
