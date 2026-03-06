<template>
  <div>
    <h2 class="page-title">Players</h2>

    <div v-if="message" :class="['alert', messageType === 'success' ? 'alert-success' : 'alert-error']">
      {{ message }}
    </div>

    <div class="card" style="margin-bottom:20px">
      <div class="card-title">Announce Message</div>
      <div style="display:flex;gap:8px">
        <input v-model="announceMsg" class="input" placeholder="Type a message to broadcast..." @keyup.enter="sendAnnounce" />
        <button class="btn btn-primary" @click="sendAnnounce" :disabled="!announceMsg.trim()">Announce</button>
      </div>
    </div>

    <div class="card">
      <div class="card-title">Online Players</div>
      <div style="margin-bottom:12px">
        <button class="btn btn-primary btn-sm" @click="loadPlayers">Refresh</button>
      </div>

      <div v-if="loading" class="loading">Loading players...</div>

      <div v-else-if="players.length === 0" style="color:var(--text-secondary);padding:12px 0;font-size:14px">
        No players online
      </div>

      <table v-else class="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Account</th>
            <th>Level</th>
            <th>Ping</th>
            <th>IP</th>
            <th>Buildings</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in players" :key="p.playerId">
            <td>
              <span class="badge badge-online">Online</span>
              {{ p.name }}
            </td>
            <td style="font-size:12px;color:var(--text-secondary)">{{ p.accountName }}</td>
            <td>{{ p.level }}</td>
            <td>{{ p.ping?.toFixed(0) }}ms</td>
            <td style="font-size:12px;font-family:monospace">{{ p.ip }}</td>
            <td>{{ p.building_count }}</td>
            <td>
              <div style="display:flex;gap:4px">
                <button class="btn btn-warning btn-sm" @click="openKick(p)">Kick</button>
                <button class="btn btn-danger btn-sm" @click="openBan(p)">Ban</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="card">
      <div class="card-title">Unban Player</div>
      <div style="display:flex;gap:8px">
        <input v-model="unbanId" class="input" placeholder="Enter user ID to unban (e.g. steam_XXXXX)" />
        <button class="btn btn-success" @click="doUnban" :disabled="!unbanId.trim()">Unban</button>
      </div>
    </div>

    <!-- Kick/Ban Dialog -->
    <div v-if="dialogPlayer" class="modal-overlay" @click.self="dialogPlayer = null">
      <div class="modal">
        <h3 style="margin-bottom:16px">{{ dialogAction === 'kick' ? 'Kick' : 'Ban' }} Player: {{ dialogPlayer.name }}</h3>
        <div class="form-group">
          <label class="form-label">Reason / Message</label>
          <input v-model="dialogMsg" class="input" :placeholder="`Reason for ${dialogAction}...`" />
        </div>
        <div style="display:flex;gap:8px;justify-content:flex-end">
          <button class="btn" style="background:var(--bg-input)" @click="dialogPlayer = null">Cancel</button>
          <button :class="['btn', dialogAction === 'kick' ? 'btn-warning' : 'btn-danger']" @click="confirmAction">
            {{ dialogAction === 'kick' ? 'Kick' : 'Ban' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getPlayers, announce, kickPlayer, banPlayer, unbanPlayer } from '@/composables/api'

const players = ref<any[]>([])
const loading = ref(true)
const message = ref('')
const messageType = ref<'success' | 'error'>('success')
const announceMsg = ref('')
const unbanId = ref('')

const dialogPlayer = ref<any>(null)
const dialogAction = ref<'kick' | 'ban'>('kick')
const dialogMsg = ref('')

function showMessage(msg: string, type: 'success' | 'error') {
  message.value = msg
  messageType.value = type
  setTimeout(() => { message.value = '' }, 5000)
}

async function loadPlayers() {
  loading.value = true
  try {
    const res = await getPlayers()
    if (res.success) {
      players.value = res.data?.players || []
    } else {
      showMessage('Failed to load players: ' + res.error, 'error')
    }
  } catch (e: any) {
    showMessage('Error: ' + e.message, 'error')
  }
  loading.value = false
}

async function sendAnnounce() {
  if (!announceMsg.value.trim()) return
  try {
    const res = await announce(announceMsg.value)
    if (res.success) {
      showMessage('Announcement sent', 'success')
      announceMsg.value = ''
    } else {
      showMessage('Failed: ' + res.error, 'error')
    }
  } catch (e: any) {
    showMessage('Error: ' + e.message, 'error')
  }
}

function openKick(player: any) {
  dialogPlayer.value = player
  dialogAction.value = 'kick'
  dialogMsg.value = ''
}

function openBan(player: any) {
  dialogPlayer.value = player
  dialogAction.value = 'ban'
  dialogMsg.value = ''
}

async function confirmAction() {
  const p = dialogPlayer.value
  if (!p) return

  try {
    let res
    if (dialogAction.value === 'kick') {
      res = await kickPlayer(p.userId, dialogMsg.value || undefined)
    } else {
      res = await banPlayer(p.userId, dialogMsg.value || undefined)
    }
    if (res.success) {
      showMessage(`Player ${p.name} ${dialogAction.value === 'kick' ? 'kicked' : 'banned'}`, 'success')
      dialogPlayer.value = null
      loadPlayers()
    } else {
      showMessage('Failed: ' + res.error, 'error')
    }
  } catch (e: any) {
    showMessage('Error: ' + e.message, 'error')
  }
}

async function doUnban() {
  if (!unbanId.value.trim()) return
  try {
    const res = await unbanPlayer(unbanId.value)
    if (res.success) {
      showMessage('Player unbanned', 'success')
      unbanId.value = ''
    } else {
      showMessage('Failed: ' + res.error, 'error')
    }
  } catch (e: any) {
    showMessage('Error: ' + e.message, 'error')
  }
}

onMounted(loadPlayers)
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 24px;
  width: 100%;
  max-width: 440px;
}
</style>
