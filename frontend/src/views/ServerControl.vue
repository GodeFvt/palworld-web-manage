<template>
  <div>
    <h2 class="page-title">Server Control</h2>

    <div
      v-if="message"
      :class="[
        'alert',
        messageType === 'success' ? 'alert-success' : 'alert-error',
      ]"
    >
      {{ message }}
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Container</div>
        <div class="stat-value">
          <span
            :class="[
              'status-dot',
              containerState === 'running' ? 'online' : 'offline',
            ]"
          ></span>
          {{ containerState || "--" }}
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Server FPS</div>
        <div class="stat-value">{{ metrics?.serverfps ?? "--" }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Players</div>
        <div class="stat-value">
          {{ metrics?.currentplayernum ?? "--" }} /
          {{ metrics?.maxplayernum ?? "--" }}
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Uptime</div>
        <div class="stat-value">{{ formatUptime(metrics?.uptime) }}</div>
      </div>
    </div>

    <!-- Start Server -->
    <div class="card">
      <div class="card-title">Start Server</div>
      <p
        style="
          font-size: 13px;
          color: var(--text-secondary);
          margin-bottom: 12px;
        "
      >
        Start the Palworld server container. Use this after a shutdown or stop.
      </p>
      <button
        class="btn btn-success"
        @click="doStart"
        :disabled="starting || containerState === 'running'"
      >
        <Play v-if="!starting && containerState !== 'running'" :size="14" />
        {{
          starting
            ? "Starting..."
            : containerState === "running"
              ? "Already Running"
              : "Start Server"
        }}
      </button>
    </div>

    <!-- Restart Server (save → shutdown → start) -->
    <div class="card">
      <div class="card-title">Restart Server</div>
      <p
        style="
          font-size: 13px;
          color: var(--text-secondary);
          margin-bottom: 12px;
        "
      >
        Saves the world, gracefully shuts down, then starts the server back up.
      </p>
      <div
        style="display: flex; gap: 8px; align-items: flex-end; flex-wrap: wrap"
      >
        <div class="form-group" style="margin-bottom: 0">
          <label class="form-label">Shutdown Wait (seconds)</label>
          <input
            v-model.number="restartWait"
            type="number"
            min="0"
            class="input"
            style="width: 120px"
          />
        </div>
        <div
          class="form-group"
          style="margin-bottom: 0; flex: 1; min-width: 200px"
        >
          <label class="form-label">Message to Players</label>
          <input
            v-model="restartMsg"
            class="input"
            placeholder="Server is restarting..."
          />
        </div>
        <button
          class="btn btn-primary"
          @click="doRestart"
          :disabled="restarting"
        >
          <RefreshCw v-if="!restarting" :size="14" />
          {{ restarting ? "Restarting..." : "Restart Server" }}
        </button>
      </div>
      <!-- Restart progress steps -->
      <div v-if="restartSteps.length" class="restart-steps">
        <div
          v-for="(step, idx) in restartSteps"
          :key="idx"
          class="restart-step"
        >
          {{ step }}
        </div>
      </div>
    </div>

    <!-- Save World -->
    <div class="card">
      <div class="card-title">Save World</div>
      <p
        style="
          font-size: 13px;
          color: var(--text-secondary);
          margin-bottom: 12px;
        "
      >
        Force save the current world state.
      </p>
      <button class="btn btn-success" @click="doSave">
        <Save :size="14" /> Save World
      </button>
    </div>

    <!-- Announce -->
    <div class="card">
      <div class="card-title">Broadcast Announcement</div>
      <div style="display: flex; gap: 8px">
        <input
          v-model="announceMsg"
          class="input"
          placeholder="Message to broadcast to all players..."
          @keyup.enter="doAnnounce"
        />
        <button
          class="btn btn-primary"
          @click="doAnnounce"
          :disabled="!announceMsg.trim()"
        >
          Send
        </button>
      </div>
    </div>

    <!-- Shutdown -->
    <div class="card">
      <div class="card-title">Graceful Shutdown</div>
      <p
        style="
          font-size: 13px;
          color: var(--text-secondary);
          margin-bottom: 12px;
        "
      >
        Shutdown the server with a countdown. Players will be notified.
        Container will stop.
      </p>
      <div
        style="display: flex; gap: 8px; align-items: flex-end; flex-wrap: wrap"
      >
        <div class="form-group" style="margin-bottom: 0">
          <label class="form-label">Wait Time (seconds)</label>
          <input
            v-model.number="shutdownWait"
            type="number"
            min="0"
            class="input"
            style="width: 120px"
          />
        </div>
        <div
          class="form-group"
          style="margin-bottom: 0; flex: 1; min-width: 200px"
        >
          <label class="form-label">Message</label>
          <input
            v-model="shutdownMsg"
            class="input"
            placeholder="Server shutting down..."
          />
        </div>
        <button class="btn btn-warning" @click="doShutdown">
          <Power :size="14" /> Shutdown
        </button>
      </div>
    </div>

    <!-- Force Stop -->
    <div class="card" style="border-color: var(--danger)">
      <div class="card-title" style="color: var(--danger)">Force Stop</div>
      <p
        style="
          font-size: 13px;
          color: var(--text-secondary);
          margin-bottom: 12px;
        "
      >
        Immediately force stop the server. Data may be lost if not saved first.
      </p>
      <div style="display: flex; gap: 8px; align-items: center">
        <label
          style="
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 13px;
            color: var(--text-secondary);
            cursor: pointer;
          "
        >
          <input type="checkbox" v-model="forceStopConfirm" />
          I understand this may cause data loss
        </label>
        <button
          class="btn btn-danger"
          @click="doForceStop"
          :disabled="!forceStopConfirm"
        >
          <AlertTriangle :size="14" /> Force Stop
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import {
  getMetrics,
  saveWorld,
  announce,
  shutdownServer,
  forceStopServer,
  getContainerStatus,
  startServer,
  restartServer,
} from "@/composables/api";
import { Play, RefreshCw, Save, Power, AlertTriangle } from "lucide-vue-next";

const metrics = ref<any>(null);
const containerState = ref<string | null>(null);
const message = ref("");
const messageType = ref<"success" | "error">("success");
const announceMsg = ref("");
const shutdownWait = ref(60);
const shutdownMsg = ref("Server is shutting down...");
const forceStopConfirm = ref(false);
const starting = ref(false);
const restarting = ref(false);
const restartWait = ref(10);
const restartMsg = ref("Server is restarting...");
const restartSteps = ref<string[]>([]);
let interval: ReturnType<typeof setInterval>;

function formatUptime(seconds?: number): string {
  if (!seconds && seconds !== 0) return "--";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function showMessage(msg: string, type: "success" | "error") {
  message.value = msg;
  messageType.value = type;
  setTimeout(() => {
    message.value = "";
  }, 8000);
}

async function loadMetrics() {
  try {
    const res = await getMetrics();
    if (res.success) metrics.value = res.data;
    else metrics.value = null;
  } catch {
    metrics.value = null;
  }
}

async function loadContainerStatus() {
  try {
    const res = await getContainerStatus();
    if (res.success) containerState.value = res.data?.state ?? null;
    else containerState.value = null;
  } catch {
    containerState.value = null;
  }
}

async function refreshAll() {
  await Promise.all([loadMetrics(), loadContainerStatus()]);
}

async function doStart() {
  starting.value = true;
  try {
    const res = await startServer();
    showMessage(
      res.success ? res.message || "Server started" : "Failed: " + res.error,
      res.success ? "success" : "error",
    );
    if (res.success) {
      setTimeout(refreshAll, 3000);
    }
  } catch (e: any) {
    showMessage("Error: " + e.message, "error");
  }
  starting.value = false;
  refreshAll();
}

async function doRestart() {
  if (
    !confirm(
      `This will save, shutdown (${restartWait.value}s wait), then restart. Continue?`,
    )
  )
    return;
  restarting.value = true;
  restartSteps.value = ["Starting restart sequence..."];
  try {
    const res = await restartServer(
      restartWait.value,
      restartMsg.value || undefined,
    );
    if (res.steps) restartSteps.value = res.steps;
    showMessage(
      res.success ? res.message || "Server restarted" : "Failed: " + res.error,
      res.success ? "success" : "error",
    );
    if (res.success) {
      setTimeout(refreshAll, 5000);
    }
  } catch (e: any) {
    showMessage("Error: " + e.message, "error");
    restartSteps.value.push(`[ERROR] ${e.message}`);
  }
  restarting.value = false;
  refreshAll();
}

async function doSave() {
  try {
    const res = await saveWorld();
    showMessage(
      res.success ? "World saved successfully" : "Failed: " + res.error,
      res.success ? "success" : "error",
    );
  } catch (e: any) {
    showMessage("Error: " + e.message, "error");
  }
}

async function doAnnounce() {
  if (!announceMsg.value.trim()) return;
  try {
    const res = await announce(announceMsg.value);
    if (res.success) {
      showMessage("Announcement sent", "success");
      announceMsg.value = "";
    } else {
      showMessage("Failed: " + res.error, "error");
    }
  } catch (e: any) {
    showMessage("Error: " + e.message, "error");
  }
}

async function doShutdown() {
  if (!confirm(`Shutdown the server in ${shutdownWait.value} seconds?`)) return;
  try {
    const res = await shutdownServer(
      shutdownWait.value,
      shutdownMsg.value || undefined,
    );
    showMessage(
      res.success ? "Server shutting down..." : "Failed: " + res.error,
      res.success ? "success" : "error",
    );
    if (res.success) {
      setTimeout(refreshAll, (shutdownWait.value + 5) * 1000);
    }
  } catch (e: any) {
    showMessage("Error: " + e.message, "error");
  }
}

async function doForceStop() {
  if (
    !confirm(
      "Are you sure you want to force stop the server? Unsaved data will be lost!",
    )
  )
    return;
  try {
    const res = await forceStopServer();
    showMessage(
      res.success ? "Server force stopped" : "Failed: " + res.error,
      res.success ? "success" : "error",
    );
    if (res.success) {
      setTimeout(refreshAll, 3000);
    }
  } catch (e: any) {
    showMessage("Error: " + e.message, "error");
  }
}

onMounted(() => {
  refreshAll();
  interval = setInterval(refreshAll, 10000);
});

onUnmounted(() => {
  clearInterval(interval);
});
</script>

<style scoped>
.status-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 6px;
  vertical-align: middle;
}
.status-dot.online {
  background: var(--success);
  box-shadow: 0 0 6px var(--success);
}
.status-dot.offline {
  background: var(--danger);
  box-shadow: 0 0 6px var(--danger);
}

.restart-steps {
  margin-top: 12px;
  padding: 12px;
  background: var(--bg-input);
  border-radius: var(--radius);
  font-size: 13px;
  font-family: monospace;
}
.restart-step {
  padding: 3px 0;
  color: var(--text-secondary);
}
</style>
