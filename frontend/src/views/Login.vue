<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-header">
        <h1>Palworld</h1>
        <span class="login-subtitle">Server Manager</span>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div v-if="error" class="alert alert-error">
          {{ error }}
        </div>

        <div class="form-group">
          <label class="form-label">Username</label>
          <input
            v-model="username"
            type="text"
            class="input"
            placeholder="admin"
            autocomplete="username"
            autofocus
          />
        </div>

        <div class="form-group">
          <label class="form-label">Password</label>
          <input
            v-model="password"
            type="password"
            class="input"
            placeholder="Password"
            autocomplete="current-password"
          />
        </div>

        <button
          type="submit"
          class="btn btn-primary login-btn"
          :disabled="loading"
        >
          {{ loading ? "Signing in..." : "Sign In" }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuth } from "@/composables/auth";

const router = useRouter();
const { login } = useAuth();

const username = ref("");
const password = ref("");
const error = ref("");
const loading = ref(false);

async function handleLogin() {
  error.value = "";
  if (!username.value || !password.value) {
    error.value = "Please enter username and password";
    return;
  }

  loading.value = true;
  const res = await login(username.value, password.value);
  loading.value = false;

  if (res.success) {
    router.push("/");
  } else {
    error.value = res.error || "Login failed";
  }
}
</script>

<style scoped>
.login-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: var(--bg-dark);
}

.login-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 40px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-header h1 {
  font-size: 28px;
  font-weight: 700;
  color: var(--accent);
  margin-bottom: 4px;
}

.login-subtitle {
  font-size: 12px;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 2px;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.login-btn {
  width: 100%;
  padding: 12px;
  font-size: 15px;
  margin-top: 8px;
}
</style>
