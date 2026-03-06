const API_BASE = "/api";

// --------------- silent token refresh ---------------
let refreshing: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    const data = await res.json();
    return data.success === true;
  } catch {
    return false;
  }
}

// --------------- generic API helper -----------------
export async function fetchApi<T = any>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const makeRequest = () =>
    fetch(`${API_BASE}${path}`, {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(options?.headers || {}),
      },
    });

  let res = await makeRequest();

  // On 401, attempt a silent refresh (skip for auth endpoints themselves)
  if (res.status === 401 && !path.startsWith("/auth/")) {
    // De-duplicate concurrent refresh attempts
    if (!refreshing) {
      refreshing = tryRefresh().finally(() => {
        refreshing = null;
      });
    }
    const ok = await refreshing;

    if (ok) {
      // Retry with the freshly-issued access-token cookie
      res = await makeRequest();
      if (res.status === 401) {
        window.location.href = "/login";
        throw new Error("Authentication required");
      }
      return res.json();
    }

    // Refresh failed — redirect to login
    window.location.href = "/login";
    throw new Error("Authentication required");
  }

  return res.json();
}

// Config (INI file)
export const getConfig = () => fetchApi("/config");
export const saveConfig = (settings: Record<string, any>) =>
  fetchApi("/config", { method: "POST", body: JSON.stringify(settings) });
export const saveRawConfig = (content: string) =>
  fetchApi("/config/raw", {
    method: "POST",
    body: JSON.stringify({ content }),
  });
export const getSettingsSchema = () => fetchApi("/settings-schema");

// Palworld REST API
export const getServerInfo = () => fetchApi("/palworld/info");
export const getPlayers = () => fetchApi("/palworld/players");
export const getServerSettings = () => fetchApi("/palworld/settings");
export const getMetrics = () => fetchApi("/palworld/metrics");

export const announce = (message: string) =>
  fetchApi("/palworld/announce", {
    method: "POST",
    body: JSON.stringify({ message }),
  });
export const kickPlayer = (userid: string, message?: string) =>
  fetchApi("/palworld/kick", {
    method: "POST",
    body: JSON.stringify({ userid, message }),
  });
export const banPlayer = (userid: string, message?: string) =>
  fetchApi("/palworld/ban", {
    method: "POST",
    body: JSON.stringify({ userid, message }),
  });
export const unbanPlayer = (userid: string) =>
  fetchApi("/palworld/unban", {
    method: "POST",
    body: JSON.stringify({ userid }),
  });
export const saveWorld = () => fetchApi("/palworld/save", { method: "POST" });
export const shutdownServer = (waittime: number, message?: string) =>
  fetchApi("/palworld/shutdown", {
    method: "POST",
    body: JSON.stringify({ waittime, message }),
  });
export const forceStopServer = () =>
  fetchApi("/palworld/stop", { method: "POST" });

// Docker container management
export const getContainerStatus = () => fetchApi("/container/status");
export const getContainerStats = () => fetchApi("/container/stats");
export const startServer = () =>
  fetchApi("/container/start", { method: "POST" });
export const restartServer = (waittime?: number, message?: string) =>
  fetchApi("/container/restart", {
    method: "POST",
    body: JSON.stringify({ waittime, message }),
  });
