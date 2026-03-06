<template>
  <div>
    <h2 class="page-title">Players</h2>

    <div
      v-if="message"
      :class="[
        'alert',
        messageType === 'success' ? 'alert-success' : 'alert-error',
      ]"
    >
      {{ message }}
    </div>

    <div class="card" style="margin-bottom: 20px">
      <div class="card-title">Announce Message</div>
      <div style="display: flex; gap: 8px">
        <input
          v-model="announceMsg"
          class="input"
          placeholder="Type a message to broadcast..."
          @keyup.enter="sendAnnounce"
        />
        <button
          class="btn btn-primary"
          @click="sendAnnounce"
          :disabled="!announceMsg.trim()"
        >
          Announce
        </button>
      </div>
    </div>

    <div class="card">
      <div class="card-title">Online Players</div>
      <div style="margin-bottom: 12px">
        <button class="btn btn-primary btn-sm" @click="loadPlayers">
          Refresh
        </button>
      </div>

      <div v-if="loading" class="loading">Loading players...</div>

      <div
        v-else-if="players.length === 0"
        style="color: var(--text-secondary); padding: 12px 0; font-size: 14px"
      >
        No players online
      </div>

      <div v-else class="player-cards">
        <div v-for="p in players" :key="p.playerId" class="player-card">
          <div class="player-card-header">
            <div class="player-name-row">
              <span class="badge badge-online">Online</span>
              <span class="player-name">{{ p.name }}</span>
              <span class="player-level">Lv.{{ p.level }}</span>
            </div>
            <div class="player-actions">
              <button class="btn btn-warning btn-sm" @click="openKick(p)">
                Kick
              </button>
              <button class="btn btn-danger btn-sm" @click="openBan(p)">
                Ban
              </button>
            </div>
          </div>
          <div class="player-details">
            <div class="detail-row">
              <span class="detail-label">Account</span>
              <span class="detail-value">{{ p.accountName }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Player ID</span>
              <span class="detail-value mono">{{ p.playerId }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">User ID</span>
              <span class="detail-value mono">{{ p.userId }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">IP</span>
              <span class="detail-value mono">{{ p.ip }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Ping</span>
              <span class="detail-value">{{ p.ping?.toFixed(0) }}ms</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Location</span>
              <span class="detail-value mono"
                >X: {{ p.location_x?.toFixed(1) }} &nbsp; Y:
                {{ p.location_y?.toFixed(1) }}</span
              >
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-title">Unban Player</div>
      <div style="display: flex; gap: 8px">
        <input
          v-model="unbanId"
          class="input"
          placeholder="Enter user ID to unban (e.g. steam_XXXXX)"
        />
        <button
          class="btn btn-success"
          @click="doUnban"
          :disabled="!unbanId.trim()"
        >
          Unban
        </button>
      </div>
    </div>

    <!-- Kick/Ban Dialog -->
    <div
      v-if="dialogPlayer"
      class="modal-overlay"
      @click.self="dialogPlayer = null"
    >
      <div class="modal">
        <h3 style="margin-bottom: 16px">
          {{ dialogAction === "kick" ? "Kick" : "Ban" }} Player:
          {{ dialogPlayer.name }}
        </h3>
        <div class="form-group">
          <label class="form-label">Reason / Message</label>
          <input
            v-model="dialogMsg"
            class="input"
            :placeholder="`Reason for ${dialogAction}...`"
          />
        </div>
        <div style="display: flex; gap: 8px; justify-content: flex-end">
          <button
            class="btn"
            style="background: var(--bg-input)"
            @click="dialogPlayer = null"
          >
            Cancel
          </button>
          <button
            :class="[
              'btn',
              dialogAction === 'kick' ? 'btn-warning' : 'btn-danger',
            ]"
            @click="confirmAction"
          >
            {{ dialogAction === "kick" ? "Kick" : "Ban" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import {
  getPlayers,
  announce,
  kickPlayer,
  banPlayer,
  unbanPlayer,
} from "@/composables/api";

const players = ref<any[]>([]);
const loading = ref(true);
const message = ref("");
const messageType = ref<"success" | "error">("success");
const announceMsg = ref("");
const unbanId = ref("");

const dialogPlayer = ref<any>(null);
const dialogAction = ref<"kick" | "ban">("kick");
const dialogMsg = ref("");

function showMessage(msg: string, type: "success" | "error") {
  message.value = msg;
  messageType.value = type;
  setTimeout(() => {
    message.value = "";
  }, 5000);
}

async function loadPlayers() {
  loading.value = true;
  try {
    const res = await getPlayers();
    if (res.success) {
      players.value = res.data?.players || [];
    } else {
      showMessage("Failed to load players: " + res.error, "error");
    }
  } catch (e: any) {
    showMessage("Error: " + e.message, "error");
  }
  loading.value = false;
}

async function sendAnnounce() {
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

function openKick(player: any) {
  dialogPlayer.value = player;
  dialogAction.value = "kick";
  dialogMsg.value = "";
}

function openBan(player: any) {
  dialogPlayer.value = player;
  dialogAction.value = "ban";
  dialogMsg.value = "";
}

async function confirmAction() {
  const p = dialogPlayer.value;
  if (!p) return;

  try {
    let res;
    if (dialogAction.value === "kick") {
      res = await kickPlayer(p.userId, dialogMsg.value || undefined);
    } else {
      res = await banPlayer(p.userId, dialogMsg.value || undefined);
    }
    if (res.success) {
      showMessage(
        `Player ${p.name} ${dialogAction.value === "kick" ? "kicked" : "banned"}`,
        "success",
      );
      dialogPlayer.value = null;
      loadPlayers();
    } else {
      showMessage("Failed: " + res.error, "error");
    }
  } catch (e: any) {
    showMessage("Error: " + e.message, "error");
  }
}

async function doUnban() {
  if (!unbanId.value.trim()) return;
  try {
    const res = await unbanPlayer(unbanId.value);
    if (res.success) {
      showMessage("Player unbanned", "success");
      unbanId.value = "";
    } else {
      showMessage("Failed: " + res.error, "error");
    }
  } catch (e: any) {
    showMessage("Error: " + e.message, "error");
  }
}

onMounted(loadPlayers);
</script>

<style scoped>
.player-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.player-card {
  background: var(--bg-input);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 16px;
  transition: border-color 0.2s;
}

.player-card:hover {
  border-color: var(--accent);
}

.player-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border);
}

.player-name-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.player-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.player-level {
  font-size: 13px;
  font-weight: 600;
  color: var(--accent);
  background: rgba(108, 99, 255, 0.12);
  padding: 2px 8px;
  border-radius: 10px;
}

.player-actions {
  display: flex;
  gap: 6px;
}

.player-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 8px 24px;
}

.detail-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.detail-label {
  font-size: 12px;
  color: var(--text-secondary);
  min-width: 70px;
  flex-shrink: 0;
}

.detail-value {
  font-size: 13px;
  color: var(--text-primary);
  word-break: break-all;
}

.detail-value.mono {
  font-family: monospace;
  font-size: 12px;
}

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
