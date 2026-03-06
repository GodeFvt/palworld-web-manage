<template>
  <div>
    <h2 class="page-title">Dashboard</h2>

    <div v-if="error" class="alert alert-error">{{ error }}</div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Server FPS</div>
        <div class="stat-value">{{ metrics?.serverfps ?? '--' }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Players Online</div>
        <div class="stat-value">
          {{ metrics?.currentplayernum ?? '--' }}
          <span style="font-size:14px;color:var(--text-secondary)">/ {{ metrics?.maxplayernum ?? '--' }}</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Frame Time</div>
        <div class="stat-value">{{ metrics?.serverframetime ? metrics.serverframetime.toFixed(1) + 'ms' : '--' }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Uptime</div>
        <div class="stat-value">{{ formatUptime(metrics?.uptime) }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Base Camps</div>
        <div class="stat-value">{{ metrics?.basecampnum ?? '--' }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">In-game Days</div>
        <div class="stat-value">{{ metrics?.days ?? '--' }}</div>
      </div>
    </div>

    <div class="card">
      <div class="card-title">Server Information</div>
      <div v-if="info" class="info-grid">
        <div class="info-row">
          <span class="info-label">Server Name</span>
          <span class="info-value">{{ info.servername }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Version</span>
          <span class="info-value">{{ info.version }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Description</span>
          <span class="info-value">{{ info.description || 'N/A' }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">World GUID</span>
          <span class="info-value" style="font-family:monospace;font-size:12px">{{ info.worldguid }}</span>
        </div>
      </div>
      <div v-else class="loading">Loading server info...</div>
    </div>

    <div class="card">
      <div class="card-title">Online Players</div>
      <div v-if="players && players.length > 0">
        <table class="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Level</th>
              <th>Ping</th>
              <th>Buildings</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in players" :key="p.playerId">
              <td>
                <span class="badge badge-online">Online</span>
                {{ p.name }}
              </td>
              <td>{{ p.level }}</td>
              <td>{{ p.ping?.toFixed(0) }}ms</td>
              <td>{{ p.building_count }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else style="color:var(--text-secondary);padding:12px 0;font-size:14px">
        No players online
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { getServerInfo, getMetrics, getPlayers } from '@/composables/api'

const info = ref<any>(null)
const metrics = ref<any>(null)
const players = ref<any[]>([])
const error = ref('')
let interval: ReturnType<typeof setInterval>

function formatUptime(seconds?: number): string {
  if (!seconds && seconds !== 0) return '--'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

async function loadData() {
  try {
    const [infoRes, metricsRes, playersRes] = await Promise.all([
      getServerInfo(),
      getMetrics(),
      getPlayers(),
    ])
    if (infoRes.success) info.value = infoRes.data
    if (metricsRes.success) metrics.value = metricsRes.data
    if (playersRes.success) players.value = playersRes.data?.players || []
    error.value = ''
  } catch (e: any) {
    error.value = 'Failed to connect to server: ' + e.message
  }
}

onMounted(() => {
  loadData()
  interval = setInterval(loadData, 10000)
})

onUnmounted(() => {
  clearInterval(interval)
})
</script>

<style scoped>
.info-grid {
  display: grid;
  gap: 12px;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.info-label {
  font-size: 13px;
  color: var(--text-secondary);
  width: 120px;
  flex-shrink: 0;
}

.info-value {
  font-size: 14px;
  color: var(--text-primary);
}
</style>
