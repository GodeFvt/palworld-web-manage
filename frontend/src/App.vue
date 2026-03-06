<template>
  <!-- Login page: full screen, no sidebar -->
  <div v-if="isLoginPage">
    <router-view />
  </div>

  <!-- Main app layout with sidebar -->
  <div v-else class="app">
    <nav class="sidebar">
      <div class="sidebar-header">
        <h1>Palworld</h1>
        <span class="subtitle">Server Manager</span>
      </div>
      <ul class="nav-list">
        <li>
          <router-link
            to="/"
            class="nav-link"
            active-class="active"
            exact-active-class="active"
          >
            <span class="nav-icon">&#9776;</span>
            <span class="nav-text">Dashboard</span>
          </router-link>
        </li>
        <li>
          <router-link to="/players" class="nav-link" active-class="active">
            <span class="nav-icon">&#9823;</span>
            <span class="nav-text">Players</span>
          </router-link>
        </li>
        <li>
          <router-link to="/settings" class="nav-link" active-class="active">
            <span class="nav-icon">&#9881;</span>
            <span class="nav-text">Settings</span>
          </router-link>
        </li>
        <li>
          <router-link to="/server" class="nav-link" active-class="active">
            <span class="nav-icon">&#9654;</span>
            <span class="nav-text">Server Control</span>
          </router-link>
        </li>
      </ul>
      <div class="sidebar-footer">
        <div class="user-info">
          <span class="user-icon">&#9679;</span>
          <span class="user-name">{{ currentUser || "admin" }}</span>
        </div>
        <button class="logout-btn" @click="handleLogout" title="Logout">
          &#10148;
        </button>
      </div>
    </nav>
    <main class="content">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuth } from "@/composables/auth";

const route = useRoute();
const router = useRouter();
const { currentUser, logout } = useAuth();

const isLoginPage = computed(() => route.name === "Login");

async function handleLogout() {
  await logout();
  router.push("/login");
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:root {
  --bg-dark: #0f1117;
  --bg-card: #1a1d27;
  --bg-sidebar: #141620;
  --bg-input: #232635;
  --text-primary: #e4e6f0;
  --text-secondary: #9398ad;
  --accent: #6c63ff;
  --accent-hover: #5a52e0;
  --danger: #e74c5e;
  --danger-hover: #d43d4f;
  --success: #43b581;
  --warning: #faa61a;
  --border: #2a2d3a;
  --radius: 8px;
}

body {
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  background: var(--bg-dark);
  color: var(--text-primary);
  min-height: 100vh;
}

.app {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 240px;
  background: var(--bg-sidebar);
  border-right: 1px solid var(--border);
  padding: 24px 0;
  flex-shrink: 0;
  position: fixed;
  height: 100vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 0 24px 24px;
  border-bottom: 1px solid var(--border);
}

.sidebar-header h1 {
  font-size: 22px;
  font-weight: 700;
  color: var(--accent);
}

.sidebar-header .subtitle {
  font-size: 12px;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.nav-list {
  list-style: none;
  padding: 12px 0;
  flex: 1;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 24px;
  color: var(--text-secondary);
  text-decoration: none;
  transition: all 0.2s;
  font-size: 14px;
  font-weight: 500;
}

.nav-link:hover {
  color: var(--text-primary);
  background: rgba(108, 99, 255, 0.08);
}

.nav-link.active {
  color: var(--accent);
  background: rgba(108, 99, 255, 0.12);
  border-right: 3px solid var(--accent);
}

.nav-icon {
  font-size: 18px;
  width: 24px;
  text-align: center;
}

.content {
  flex: 1;
  margin-left: 240px;
  padding: 32px 48px;
  width: calc(100% - 240px);
}

.content > * {
  max-width: 1400px;
  margin-left: auto;
  margin-right: auto;
}

/* Shared component styles */
.page-title {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 24px;
}

.card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 20px;
  margin-bottom: 16px;
}

.card-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 20px;
}

.stat-label {
  font-size: 12px;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border: none;
  border-radius: var(--radius);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  color: white;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--accent);
}
.btn-primary:hover:not(:disabled) {
  background: var(--accent-hover);
}
.btn-danger {
  background: var(--danger);
}
.btn-danger:hover:not(:disabled) {
  background: var(--danger-hover);
}
.btn-success {
  background: var(--success);
}
.btn-success:hover:not(:disabled) {
  background: #3aa374;
}
.btn-warning {
  background: var(--warning);
  color: #1a1d27;
}
.btn-warning:hover:not(:disabled) {
  background: #e09516;
}
.btn-sm {
  padding: 5px 10px;
  font-size: 12px;
}

.input {
  background: var(--bg-input);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text-primary);
  padding: 8px 12px;
  font-size: 14px;
  width: 100%;
  transition: border-color 0.2s;
}

.input:focus {
  outline: none;
  border-color: var(--accent);
}

select.input {
  appearance: auto;
}

.form-group {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 6px;
}

.form-desc {
  font-size: 11px;
  color: var(--text-secondary);
  margin-top: 4px;
  opacity: 0.7;
}

.alert {
  padding: 12px 16px;
  border-radius: var(--radius);
  margin-bottom: 16px;
  font-size: 14px;
}

.alert-success {
  background: rgba(67, 181, 129, 0.15);
  border: 1px solid rgba(67, 181, 129, 0.3);
  color: var(--success);
}

.alert-error {
  background: rgba(231, 76, 94, 0.15);
  border: 1px solid rgba(231, 76, 94, 0.3);
  color: var(--danger);
}

.table {
  width: 100%;
  border-collapse: collapse;
}

.table th,
.table td {
  padding: 10px 14px;
  text-align: left;
  border-bottom: 1px solid var(--border);
  font-size: 14px;
}

.table th {
  color: var(--text-secondary);
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.table tr:hover td {
  background: rgba(108, 99, 255, 0.04);
}

.badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
}

.badge-online {
  background: rgba(67, 181, 129, 0.15);
  color: var(--success);
}

.loading {
  text-align: center;
  padding: 40px;
  color: var(--text-secondary);
}

.tabs {
  display: flex;
  gap: 4px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 20px;
}

.tab {
  padding: 10px 20px;
  cursor: pointer;
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 500;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
  background: none;
  border-top: none;
  border-left: none;
  border-right: none;
}

.tab:hover {
  color: var(--text-primary);
}

.tab.active {
  color: var(--accent);
  border-bottom-color: var(--accent);
}

.toggle {
  position: relative;
  width: 44px;
  height: 24px;
  background: var(--bg-input);
  border: 1px solid var(--border);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.toggle.active {
  background: var(--accent);
  border-color: var(--accent);
}

.toggle::after {
  content: "";
  position: absolute;
  top: 2px;
  left: 2px;
  width: 18px;
  height: 18px;
  background: white;
  border-radius: 50%;
  transition: transform 0.2s;
}

.toggle.active::after {
  transform: translateX(20px);
}

/* Sidebar footer — logout */
.sidebar-footer {
  padding: 12px 16px;
  border-top: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.user-icon {
  color: var(--success);
  font-size: 10px;
}

.user-name {
  font-size: 13px;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.logout-btn {
  background: none;
  border: 1px solid var(--border);
  color: var(--text-secondary);
  width: 32px;
  height: 32px;
  border-radius: var(--radius);
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s;
  transform: rotate(180deg);
}

.logout-btn:hover {
  color: var(--danger);
  border-color: var(--danger);
  background: rgba(231, 76, 94, 0.1);
}

@media (max-width: 768px) {
  .sidebar {
    width: 60px;
    overflow: hidden;
  }
  .sidebar-header h1,
  .sidebar-header .subtitle,
  .nav-text {
    display: none;
  }
  .nav-link {
    justify-content: center;
    padding: 12px;
  }
  .content {
    margin-left: 60px;
    padding: 16px;
    width: calc(100% - 60px);
  }
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .user-name {
    display: none;
  }
  .sidebar-footer {
    justify-content: center;
  }
}
</style>
