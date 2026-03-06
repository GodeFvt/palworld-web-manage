<template>
  <div>
    <h2 class="page-title">Server Settings</h2>

    <div
      v-if="message"
      :class="[
        'alert',
        messageType === 'success' ? 'alert-success' : 'alert-error',
      ]"
    >
      {{ message }}
    </div>

    <!-- ─── Main tabs ─── -->
    <div class="tabs">
      <button
        :class="['tab', activeTab === 'form' ? 'active' : '']"
        @click="activeTab = 'form'"
      >
        Form Editor
      </button>
      <button
        :class="['tab', activeTab === 'raw' ? 'active' : '']"
        @click="activeTab = 'raw'"
      >
        Raw INI Editor
      </button>
      <button
        :class="['tab', activeTab === 'live' ? 'active' : '']"
        @click="activeTab = 'live'"
      >
        Live Settings (API)
      </button>
    </div>

    <!-- ═══════════════════════ Form Editor ═══════════════════════ -->
    <div v-if="activeTab === 'form'">
      <div v-if="loading" class="loading">Loading settings...</div>
      <template v-else>
        <!-- Category sub-tabs -->
        <div class="category-tabs">
          <button
            v-for="cat in settingsCategories"
            :key="cat"
            :class="['category-tab', activeCategory === cat ? 'active' : '']"
            @click="activeCategory = cat"
          >
            {{ cat }}
          </button>
        </div>

        <p class="settings-subtitle">
          Edit the values below. Changes require a server restart to take
          effect.
        </p>

        <!-- Settings list for the active category -->
        <div class="settings-list">
          <div
            v-for="key in categorySettings"
            :key="key"
            :class="['setting-row', validationMap[key] ? 'has-error' : '']"
          >
            <!-- ── Label area ── -->
            <div class="setting-label-area">
              <label class="setting-label">{{
                schema[key]?.label || key
              }}</label>
              <span v-if="validationMap[key]" class="setting-error">{{
                validationMap[key]
              }}</span>
            </div>

            <!-- ── Control area ── -->
            <div class="setting-control">
              <!-- Boolean: toggle -->
              <template v-if="schema[key]?.type === 'boolean'">
                <div
                  :class="['toggle', settings[key] ? 'active' : '']"
                  @click="settings[key] = !settings[key]"
                ></div>
              </template>

              <!-- Select (enum with options) -->
              <template v-else-if="schema[key]?.options?.length">
                <select v-model="settings[key]" class="input">
                  <option
                    v-for="opt in schema[key].options"
                    :key="opt.value"
                    :value="opt.value"
                  >
                    {{ opt.label }}
                  </option>
                </select>
              </template>

              <!-- Number with slider (has min/max) -->
              <template
                v-else-if="
                  schema[key]?.type === 'number' &&
                  schema[key]?.min !== undefined
                "
              >
                <div class="slider-group">
                  <div
                    v-if="schema[key]?.difficultyHint"
                    class="difficulty-labels"
                  >
                    <span class="difficulty-harder">◆ Harder</span>
                    <span class="difficulty-easier">Easier ◆</span>
                  </div>
                  <div class="slider-row">
                    <input
                      v-model.number="settings[key]"
                      type="number"
                      :step="schema[key].step || 'any'"
                      :min="schema[key].min"
                      :max="schema[key].max"
                      class="input slider-num-input"
                    />
                    <input
                      v-model.number="settings[key]"
                      type="range"
                      :min="schema[key].min"
                      :max="schema[key].max"
                      :step="schema[key].step || 0.01"
                      class="slider"
                    />
                    <button
                      class="reset-btn"
                      @click="resetSetting(key)"
                      title="Reset to default"
                    >
                      ↻
                    </button>
                  </div>
                </div>
              </template>

              <!-- Textarea -->
              <template v-else-if="schema[key]?.inputType === 'textarea'">
                <textarea v-model="settings[key]" class="input" rows="3" />
              </template>

              <!-- Password -->
              <template v-else-if="schema[key]?.inputType === 'password'">
                <input v-model="settings[key]" type="password" class="input" />
              </template>

              <!-- Number (no slider) -->
              <template v-else-if="schema[key]?.type === 'number'">
                <input
                  v-model.number="settings[key]"
                  type="number"
                  step="any"
                  class="input"
                />
              </template>

              <!-- Default: text input -->
              <template v-else>
                <input v-model="settings[key]" class="input" />
              </template>
            </div>
          </div>
        </div>

        <!-- Unknown settings (not in schema) -->
        <div
          v-if="unknownSettings.length"
          class="card"
          style="margin-top: 20px"
        >
          <div class="card-title">Other Settings (not in schema)</div>
          <div class="settings-list">
            <div v-for="key in unknownSettings" :key="key" class="setting-row">
              <div class="setting-label-area">
                <label class="setting-label">{{ key }}</label>
              </div>
              <div class="setting-control">
                <input v-model="settings[key]" class="input" />
              </div>
            </div>
          </div>
        </div>

        <!-- Save button -->
        <div class="settings-actions">
          <button class="btn btn-success" @click="saveFormSettings">
            <Save :size="14" /> Save Settings
          </button>
        </div>
      </template>
    </div>

    <!-- ═══════════════════════ Raw INI Editor ═══════════════════════ -->
    <div v-if="activeTab === 'raw'">
      <div class="card">
        <div class="card-title">PalWorldSettings.ini</div>
        <p
          style="
            font-size: 13px;
            color: var(--text-secondary);
            margin-bottom: 12px;
          "
        >
          Edit the raw INI file content directly. Changes require a server
          restart.
        </p>
        <textarea
          v-model="rawContent"
          class="input"
          style="
            font-family: monospace;
            min-height: 300px;
            resize: vertical;
            white-space: pre;
          "
          spellcheck="false"
        ></textarea>
        <div style="margin-top: 12px; display: flex; gap: 8px">
          <button class="btn btn-success" @click="saveRawContent">
            <Save :size="14" /> Save Raw Settings
          </button>
          <button class="btn btn-primary" @click="loadConfig">Reload</button>
          <div style="flex: 1" />
          <button
            class="btn btn-primary"
            @click="copyRaw"
            title="Copy to clipboard"
          >
            <ClipboardCopy :size="14" /> Copy
          </button>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════ Live Settings (API) ═══════════════════════ -->
    <div v-if="activeTab === 'live'">
      <div class="card">
        <div class="card-title">Current Server Settings (via REST API)</div>
        <p
          style="
            font-size: 13px;
            color: var(--text-secondary);
            margin-bottom: 12px;
          "
        >
          These are the settings currently active on the running server.
          Read-only.
        </p>
        <button
          class="btn btn-primary btn-sm"
          @click="loadLiveSettings"
          style="margin-bottom: 12px"
        >
          Refresh
        </button>
        <div v-if="liveLoading" class="loading">Loading...</div>
        <div v-else-if="liveSettings">
          <table class="table">
            <thead>
              <tr>
                <th>Setting</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(value, key) in liveSettings" :key="key">
                <td style="font-weight: 500">{{ key }}</td>
                <td style="font-family: monospace">{{ value }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import {
  getConfig,
  saveConfig,
  saveRawConfig,
  getSettingsSchema,
  getServerSettings,
} from "@/composables/api";
import { Save, ClipboardCopy } from "lucide-vue-next";

const CATEGORIES = [
  "Server Settings",
  "In-Game Settings",
  "Advanced Settings",
] as const;
type Category = (typeof CATEGORIES)[number];

const activeTab = ref<"form" | "raw" | "live">("form");
const activeCategory = ref<Category>("Server Settings");
const loading = ref(true);
const settings = ref<Record<string, any>>({});
const rawContent = ref("");
const schema = ref<Record<string, any>>({});
const message = ref("");
const messageType = ref<"success" | "error">("success");

const liveSettings = ref<Record<string, any> | null>(null);
const liveLoading = ref(false);

// ── Computed ──

const settingsCategories = computed(() => CATEGORIES);

/** Settings keys for the active category that exist in both schema and loaded settings */
const categorySettings = computed(() => {
  return Object.entries(schema.value)
    .filter(([_, v]) => (v as any).category === activeCategory.value)
    .filter(([key]) => key in settings.value)
    .map(([key]) => key);
});

/** Settings present in the loaded file but missing from the schema */
const unknownSettings = computed(() => {
  return Object.keys(settings.value).filter((k) => !(k in schema.value));
});

/** Validation error map: key → message */
const validationMap = computed(() => {
  const map: Record<string, string> = {};
  for (const [key, value] of Object.entries(settings.value)) {
    const s = schema.value[key];
    if (!s) continue;
    if (s.type === "number") {
      const num = typeof value === "number" ? value : parseFloat(String(value));
      if (isNaN(num)) {
        map[key] = `${s.label} must be a valid number`;
        continue;
      }
      if (s.min !== undefined && num < s.min) {
        map[key] = `Must be at least ${s.min}`;
      }
      if (s.max !== undefined && num > s.max) {
        map[key] = `Must be at most ${s.max}`;
      }
    }
    if (s.type === "string" && s.options?.length) {
      const str = String(value);
      if (str !== "" && !s.options.some((o: any) => o.value === str)) {
        map[key] =
          `Must be one of: ${s.options.map((o: any) => o.value).join(", ")}`;
      }
    }
  }
  return map;
});

// ── Helpers ──

function showMessage(msg: string, type: "success" | "error") {
  message.value = msg;
  messageType.value = type;
  setTimeout(() => {
    message.value = "";
  }, 5000);
}

function resetSetting(key: string) {
  const s = schema.value[key];
  if (s && s.default !== undefined) {
    settings.value[key] = s.default;
  }
}

async function copyRaw() {
  try {
    await navigator.clipboard.writeText(rawContent.value);
    showMessage("Copied to clipboard!", "success");
  } catch {
    showMessage("Failed to copy", "error");
  }
}

// ── Data loading ──

async function loadConfig() {
  loading.value = true;
  try {
    const [configRes, schemaRes] = await Promise.all([
      getConfig(),
      getSettingsSchema(),
    ]);
    schema.value = schemaRes;
    if (configRes.success) {
      settings.value = configRes.settings;
      rawContent.value = configRes.raw;
    } else {
      showMessage("Settings file not found. Save to create it.", "error");
      settings.value = {};
    }
  } catch (e: any) {
    showMessage("Error: " + e.message, "error");
  }
  loading.value = false;
}

async function saveFormSettings() {
  // Check for validation errors
  const errorCount = Object.keys(validationMap.value).length;
  if (errorCount > 0) {
    showMessage(
      `Please fix ${errorCount} validation error(s) before saving.`,
      "error",
    );
    return;
  }
  try {
    const res = await saveConfig(settings.value);
    if (res.success) {
      showMessage(res.message, "success");
      loadConfig();
    } else {
      showMessage("Failed: " + (res.error || "Unknown error"), "error");
    }
  } catch (e: any) {
    showMessage("Error: " + e.message, "error");
  }
}

async function saveRawContent() {
  try {
    const res = await saveRawConfig(rawContent.value);
    if (res.success) {
      showMessage(res.message, "success");
      loadConfig();
    } else {
      showMessage("Failed: " + res.error, "error");
    }
  } catch (e: any) {
    showMessage("Error: " + e.message, "error");
  }
}

async function loadLiveSettings() {
  liveLoading.value = true;
  try {
    const res = await getServerSettings();
    if (res.success) {
      liveSettings.value = res.data;
    } else {
      showMessage("Failed to load live settings: " + res.error, "error");
    }
  } catch (e: any) {
    showMessage("Error: " + e.message, "error");
  }
  liveLoading.value = false;
}

onMounted(loadConfig);
</script>

<style scoped>
/* ── Category sub-tabs ── */
.category-tabs {
  display: flex;
  gap: 0;
  margin-bottom: 16px;
  border-radius: var(--radius);
  overflow: hidden;
  border: 1px solid var(--border);
  width: fit-content;
}
.category-tab {
  padding: 10px 24px;
  cursor: pointer;
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 500;
  background: var(--bg-card);
  border: none;
  border-right: 1px solid var(--border);
  transition: all 0.2s;
}
.category-tab:last-child {
  border-right: none;
}
.category-tab:hover {
  color: var(--text-primary);
  background: var(--bg-input);
}
.category-tab.active {
  color: var(--accent);
  background: var(--bg-input);
  font-weight: 600;
}

.settings-subtitle {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 20px;
}

/* ── Settings list ── */
.settings-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}
.setting-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  padding: 14px 0;
  border-bottom: 1px solid var(--border);
}
.setting-row:last-child {
  border-bottom: none;
}
.setting-row.has-error {
  background: rgba(231, 76, 94, 0.05);
  margin: 0 -12px;
  padding-left: 12px;
  padding-right: 12px;
  border-radius: var(--radius);
}

.setting-label-area {
  flex: 1;
  min-width: 0;
  padding-top: 6px;
}
.setting-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 2px;
}
.setting-error {
  display: block;
  font-size: 11px;
  color: var(--danger);
  margin-top: 2px;
}

.setting-control {
  width: 340px;
  flex-shrink: 0;
}
.setting-control .input {
  width: 100%;
}

/* ── Slider group ── */
.slider-group {
  width: 100%;
}
.difficulty-labels {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
  font-size: 11px;
  font-weight: 600;
}
.difficulty-harder {
  color: var(--danger);
}
.difficulty-easier {
  color: var(--success);
}
.slider-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.slider-num-input {
  width: 72px !important;
  flex-shrink: 0;
  text-align: center;
}
.slider {
  flex: 1;
  -webkit-appearance: none;
  appearance: none;
  height: 6px;
  background: var(--bg-input);
  border: 1px solid var(--border);
  border-radius: 3px;
  outline: none;
  cursor: pointer;
}
.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  background: var(--accent);
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid var(--bg-dark);
  box-shadow: 0 0 0 1px var(--accent);
}
.slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background: var(--accent);
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid var(--bg-dark);
  box-shadow: 0 0 0 1px var(--accent);
}

/* ── Reset button ── */
.reset-btn {
  background: none;
  border: 1px solid var(--border);
  color: var(--text-secondary);
  width: 30px;
  height: 30px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s;
}
.reset-btn:hover {
  color: var(--accent);
  border-color: var(--accent);
  background: rgba(108, 99, 255, 0.1);
}

/* ── Actions bar ── */
.settings-actions {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid var(--border);
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

/* ── Responsive ── */
@media (max-width: 768px) {
  .setting-row {
    flex-direction: column;
    gap: 8px;
  }
  .setting-control {
    width: 100%;
  }
  .category-tabs {
    width: 100%;
  }
  .category-tab {
    flex: 1;
    text-align: center;
    padding: 10px 12px;
    font-size: 12px;
  }
}
</style>
