import { Elysia, t } from "elysia";
import { cors } from "@elysiajs/cors";
import { jwt } from "@elysiajs/jwt";
import {
  parseSettings,
  serializeSettings,
  validateSettings,
  SETTINGS_SCHEMA,
} from "./settings-parser";
import type { PalWorldSettings, ValidationError } from "./settings-parser";

const PALWORLD_API_HOST = process.env.PALWORLD_API_HOST || "palworld-server";
const PALWORLD_API_PORT = process.env.PALWORLD_API_PORT || "8212";
const PALWORLD_API_USER = process.env.PALWORLD_API_USER || "admin";
const PALWORLD_API_PASSWORD = process.env.PALWORLD_API_PASSWORD || "";
const SETTINGS_PATH =
  process.env.SETTINGS_PATH ||
  "/app/palworld-saved/Config/LinuxServer/PalWorldSettings.ini";
const PORT = parseInt(process.env.PORT || "3000");
const PALWORLD_CONTAINER_NAME =
  process.env.PALWORLD_CONTAINER_NAME || "palworld-server";
const DOCKER_SOCKET = "/var/run/docker.sock";
const JWT_SECRET =
  process.env.JWT_SECRET || PALWORLD_API_PASSWORD || "palworld-web-manage-secret";
const JWT_EXPIRY = process.env.JWT_EXPIRY || "30m";
const REFRESH_EXPIRY = process.env.REFRESH_EXPIRY || "7d";
const COOKIE_EXPIRY = process.env.COOKIE_EXPIRY || REFRESH_EXPIRY;
const COOKIE_NAME = "palworld_token";
const REFRESH_COOKIE_NAME = "palworld_refresh";

/** Convert a duration string like "30m", "7d", "1h" to seconds. */
function parseDurationToSeconds(dur: string): number {
  const m = dur.match(/^(\d+)\s*(s|m|h|d|w)$/i);
  if (!m) return 7 * 86400; // fallback 7 days
  const v = parseInt(m[1]);
  switch (m[2].toLowerCase()) {
    case "s":
      return v;
    case "m":
      return v * 60;
    case "h":
      return v * 3600;
    case "d":
      return v * 86400;
    case "w":
      return v * 604800;
    default:
      return 604800;
  }
}

const COOKIE_MAX_AGE = parseDurationToSeconds(COOKIE_EXPIRY);

// ---------------------------------------------------------------------------
// Docker Engine API helpers (via Unix socket)
// ---------------------------------------------------------------------------

/**
 * Find the container ID for the palworld server.
 * First tries exact name match, then falls back to a name-contains filter.
 */
async function findContainerId(): Promise<string | null> {
  // List all containers (including stopped) filtered by name
  const filter = JSON.stringify({ name: [PALWORLD_CONTAINER_NAME] });
  const url = `http://localhost/containers/json?all=true&filters=${encodeURIComponent(filter)}`;
  const res = await fetch(url, { unix: DOCKER_SOCKET } as any);
  if (!res.ok) return null;
  const containers = (await res.json()) as any[];
  if (containers.length === 0) return null;
  // Docker prefixes names with /, try exact match first
  const exact = containers.find((c: any) =>
    c.Names?.some(
      (n: string) =>
        n === `/${PALWORLD_CONTAINER_NAME}` || n === PALWORLD_CONTAINER_NAME,
    ),
  );
  return (exact ?? containers[0])?.Id ?? null;
}

async function dockerPost(
  containerId: string,
  action: string,
): Promise<{ ok: boolean; status: number; body: string }> {
  const url = `http://localhost/containers/${containerId}/${action}`;
  const res = await fetch(url, {
    method: "POST",
    unix: DOCKER_SOCKET,
  } as any);
  const body = res.ok ? "" : await res.text().catch(() => "");
  return { ok: res.ok, status: res.status, body };
}

async function getContainerState(): Promise<string | null> {
  const id = await findContainerId();
  if (!id) return null;
  const url = `http://localhost/containers/${id}/json`;
  const res = await fetch(url, { unix: DOCKER_SOCKET } as any);
  if (!res.ok) return null;
  const info = (await res.json()) as any;
  return info?.State?.Status ?? null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function palworldApiUrl(path: string): string {
  return `http://${PALWORLD_API_HOST}:${PALWORLD_API_PORT}/v1/api${path}`;
}

function authHeader(): string {
  return "Basic " + btoa(`${PALWORLD_API_USER}:${PALWORLD_API_PASSWORD}`);
}

async function palworldFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const url = palworldApiUrl(path);
  const headers: Record<string, string> = {
    Authorization: authHeader(),
    Accept: "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };
  if (options.body) {
    headers["Content-Type"] = "application/json";
  }
  return fetch(url, { ...options, headers });
}

const app = new Elysia()
  .use(cors({ credentials: true }))
  .use(
    jwt({
      name: "jwt",
      secret: JWT_SECRET,
      exp: JWT_EXPIRY,
    }),
  )
  .use(
    jwt({
      name: "refreshJwt",
      secret: JWT_SECRET + ":refresh",
      exp: REFRESH_EXPIRY,
    }),
  )

  // ============ Auth Endpoints (public) ============

  // POST /api/auth/login
  .post(
    "/api/auth/login",
    async ({ body, jwt, refreshJwt, cookie }: any) => {
      const { username, password } = body;
      if (
        username !== PALWORLD_API_USER ||
        password !== PALWORLD_API_PASSWORD
      ) {
        return { success: false, error: "Invalid credentials" };
      }

      const token = await jwt.sign({ sub: username, role: "admin" });
      const refresh = await refreshJwt.sign({ sub: username, type: "refresh" });

      // Access token cookie
      cookie[COOKIE_NAME].set({
        value: token,
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        path: "/",
        maxAge: COOKIE_MAX_AGE,
      });

      // Refresh token cookie
      cookie[REFRESH_COOKIE_NAME].set({
        value: refresh,
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        path: "/",
        maxAge: COOKIE_MAX_AGE,
      });

      return { success: true, token, user: username };
    },
    {
      body: t.Object({
        username: t.String(),
        password: t.String(),
      }),
    },
  )

  // POST /api/auth/logout
  .post("/api/auth/logout", ({ cookie }: any) => {
    cookie[COOKIE_NAME].set({
      value: "",
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    cookie[REFRESH_COOKIE_NAME].set({
      value: "",
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    return { success: true };
  })

  // GET /api/auth/me — check current auth status
  .get("/api/auth/me", async ({ jwt, refreshJwt, cookie, headers }: any) => {
    // 1. Try access token
    const token =
      cookie[COOKIE_NAME]?.value ||
      (headers.authorization?.startsWith("Bearer ")
        ? headers.authorization.slice(7)
        : null);

    if (token) {
      const payload = await jwt.verify(token);
      if (payload) return { success: true, user: payload.sub };
    }

    // 2. Fallback — refresh token (silently reissue access token)
    const refresh = cookie[REFRESH_COOKIE_NAME]?.value;
    if (refresh) {
      const rPayload = await refreshJwt.verify(refresh);
      if (rPayload) {
        const newToken = await jwt.sign({ sub: rPayload.sub, role: "admin" });
        cookie[COOKIE_NAME].set({
          value: newToken,
          httpOnly: true,
          secure: false,
          sameSite: "lax",
          path: "/",
          maxAge: COOKIE_MAX_AGE,
        });
        return { success: true, user: rPayload.sub };
      }
    }

    return { success: false, error: "Not authenticated" };
  })

  // POST /api/auth/refresh — exchange refresh token for a new access token
  .post(
    "/api/auth/refresh",
    async ({ jwt, refreshJwt, cookie, headers }: any) => {
      const refresh =
        cookie[REFRESH_COOKIE_NAME]?.value ||
        headers["x-refresh-token"] ||
        null;

      if (!refresh) return { success: false, error: "No refresh token" };

      const payload = await refreshJwt.verify(refresh);
      if (!payload) {
        return { success: false, error: "Invalid or expired refresh token" };
      }

      const token = await jwt.sign({ sub: payload.sub, role: "admin" });

      cookie[COOKIE_NAME].set({
        value: token,
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        path: "/",
        maxAge: COOKIE_MAX_AGE,
      });

      return { success: true, token, user: payload.sub };
    },
  )

  // ============ Auth Guard — protects all routes below ============
  .onBeforeHandle(async ({ jwt, cookie, headers, set, path }: any) => {
    // Public endpoints — skip guard
    if (
      path === "/api/auth/login" ||
      path === "/api/auth/logout" ||
      path === "/api/auth/me" ||
      path === "/api/auth/refresh"
    )
      return;

    const token =
      cookie[COOKIE_NAME]?.value ||
      (headers.authorization?.startsWith("Bearer ")
        ? headers.authorization.slice(7)
        : null);

    if (!token) {
      set.status = 401;
      return { success: false, error: "Authentication required" };
    }

    const payload = await jwt.verify(token);
    if (!payload) {
      set.status = 401;
      return { success: false, error: "Invalid or expired token" };
    }
  })

  // ============ Settings File Management ============

  // Get settings schema (for frontend form building)
  .get("/api/settings-schema", () => {
    return SETTINGS_SCHEMA;
  })

  // Read current PalWorldSettings.ini
  .get("/api/config", async () => {
    try {
      const file = Bun.file(SETTINGS_PATH);
      const exists = await file.exists();
      if (!exists) {
        return {
          success: false,
          error: "Settings file not found",
          settings: {},
          raw: "",
        };
      }
      const content = await file.text();
      const settings = parseSettings(content);
      return { success: true, settings, raw: content };
    } catch (e: any) {
      return { success: false, error: e.message, settings: {}, raw: "" };
    }
  })

  // Write PalWorldSettings.ini
  .post(
    "/api/config",
    async ({ body }) => {
      try {
        const settings = body as PalWorldSettings;

        // Validate before saving
        const warnings = validateSettings(settings);

        const content = serializeSettings(settings);
        await Bun.write(SETTINGS_PATH, content);
        return {
          success: true,
          message: "Settings saved. Restart the server to apply changes.",
          warnings: warnings.length > 0 ? warnings : undefined,
        };
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    },
    {
      body: t.Record(
        t.String(),
        t.Union([t.String(), t.Number(), t.Boolean()]),
      ),
    },
  )

  // Write raw INI content
  .post(
    "/api/config/raw",
    async ({ body }) => {
      try {
        const { content } = body as { content: string };
        await Bun.write(SETTINGS_PATH, content);
        return {
          success: true,
          message: "Raw settings saved. Restart the server to apply changes.",
        };
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    },
    {
      body: t.Object({ content: t.String() }),
    },
  )

  // ============ Palworld REST API Proxy ============

  // GET /v1/api/info
  .get("/api/palworld/info", async () => {
    try {
      const res = await palworldFetch("/info");
      if (!res.ok)
        return { success: false, error: `API returned ${res.status}` };
      const data = await res.json();
      return { success: true, data };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  })

  // GET /v1/api/players
  .get("/api/palworld/players", async () => {
    try {
      const res = await palworldFetch("/players");
      if (!res.ok)
        return { success: false, error: `API returned ${res.status}` };
      const data = await res.json();
      return { success: true, data };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  })

  // GET /v1/api/settings
  .get("/api/palworld/settings", async () => {
    try {
      const res = await palworldFetch("/settings");
      if (!res.ok)
        return { success: false, error: `API returned ${res.status}` };
      const data = await res.json();
      return { success: true, data };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  })

  // GET /v1/api/metrics
  .get("/api/palworld/metrics", async () => {
    try {
      const res = await palworldFetch("/metrics");
      if (!res.ok)
        return { success: false, error: `API returned ${res.status}` };
      const data = await res.json();
      return { success: true, data };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  })

  // POST /v1/api/announce
  .post(
    "/api/palworld/announce",
    async ({ body }) => {
      try {
        const res = await palworldFetch("/announce", {
          method: "POST",
          body: JSON.stringify(body),
        });
        if (!res.ok)
          return { success: false, error: `API returned ${res.status}` };
        return { success: true, message: "Announcement sent" };
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    },
    {
      body: t.Object({ message: t.String() }),
    },
  )

  // POST /v1/api/kick
  .post(
    "/api/palworld/kick",
    async ({ body }) => {
      try {
        const res = await palworldFetch("/kick", {
          method: "POST",
          body: JSON.stringify(body),
        });
        if (!res.ok)
          return { success: false, error: `API returned ${res.status}` };
        return { success: true, message: "Player kicked" };
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    },
    {
      body: t.Object({ userid: t.String(), message: t.Optional(t.String()) }),
    },
  )

  // POST /v1/api/ban
  .post(
    "/api/palworld/ban",
    async ({ body }) => {
      try {
        const res = await palworldFetch("/ban", {
          method: "POST",
          body: JSON.stringify(body),
        });
        if (!res.ok)
          return { success: false, error: `API returned ${res.status}` };
        return { success: true, message: "Player banned" };
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    },
    {
      body: t.Object({ userid: t.String(), message: t.Optional(t.String()) }),
    },
  )

  // POST /v1/api/unban
  .post(
    "/api/palworld/unban",
    async ({ body }) => {
      try {
        const res = await palworldFetch("/unban", {
          method: "POST",
          body: JSON.stringify(body),
        });
        if (!res.ok)
          return { success: false, error: `API returned ${res.status}` };
        return { success: true, message: "Player unbanned" };
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    },
    {
      body: t.Object({ userid: t.String() }),
    },
  )

  // POST /v1/api/save
  .post("/api/palworld/save", async () => {
    try {
      const res = await palworldFetch("/save", { method: "POST" });
      if (!res.ok)
        return { success: false, error: `API returned ${res.status}` };
      return { success: true, message: "World saved" };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  })

  // POST /v1/api/shutdown
  .post(
    "/api/palworld/shutdown",
    async ({ body }) => {
      try {
        const res = await palworldFetch("/shutdown", {
          method: "POST",
          body: JSON.stringify(body),
        });
        if (!res.ok)
          return { success: false, error: `API returned ${res.status}` };
        return { success: true, message: "Server shutting down" };
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    },
    {
      body: t.Object({ waittime: t.Number(), message: t.Optional(t.String()) }),
    },
  )

  // POST /v1/api/stop
  .post("/api/palworld/stop", async () => {
    try {
      const res = await palworldFetch("/stop", { method: "POST" });
      if (!res.ok)
        return { success: false, error: `API returned ${res.status}` };
      return { success: true, message: "Server force stopped" };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  })

  // ============ Docker Container Management ============

  // GET container status
  .get("/api/container/status", async () => {
    try {
      const id = await findContainerId();
      if (!id)
        return {
          success: false,
          error: `Container '${PALWORLD_CONTAINER_NAME}' not found`,
        };
      const state = await getContainerState();
      return { success: true, data: { containerId: id, state } };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  })

  // POST start the palworld container
  .post("/api/container/start", async () => {
    try {
      const id = await findContainerId();
      if (!id)
        return {
          success: false,
          error: `Container '${PALWORLD_CONTAINER_NAME}' not found`,
        };
      const result = await dockerPost(id, "start");
      if (result.ok || result.status === 304) {
        // 304 = already running
        return {
          success: true,
          message:
            result.status === 304
              ? "Server is already running"
              : "Server started",
        };
      }
      return {
        success: false,
        error: `Docker returned ${result.status}: ${result.body}`,
      };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  })

  // POST restart the palworld server (save → shutdown → wait → docker start)
  .post(
    "/api/container/restart",
    async ({ body }) => {
      const { waittime = 5, message: msg } = body as {
        waittime?: number;
        message?: string;
      };

      const steps: string[] = [];

      try {
        // Step 1: Save world
        try {
          const saveRes = await palworldFetch("/save", { method: "POST" });
          steps.push(
            saveRes.ok
              ? "✅ World saved"
              : `⚠️ Save returned ${saveRes.status}`,
          );
        } catch {
          steps.push("⚠️ Could not save (server may be down)");
        }

        // Step 2: Graceful shutdown via game API
        try {
          const shutdownRes = await palworldFetch("/shutdown", {
            method: "POST",
            body: JSON.stringify({
              waittime: waittime,
              message: msg || "Server is restarting...",
            }),
          });
          steps.push(
            shutdownRes.ok
              ? `✅ Shutdown command sent (waiting ${waittime}s)`
              : `⚠️ Shutdown returned ${shutdownRes.status}`,
          );
        } catch {
          steps.push("⚠️ Could not send shutdown (server may already be down)");
        }

        // Step 3: Wait for shutdown + buffer
        const totalWait = (waittime + 5) * 1000;
        await sleep(totalWait);

        // Step 4: Make sure container is stopped, then start it
        const id = await findContainerId();
        if (!id) {
          return {
            success: false,
            error: `Container '${PALWORLD_CONTAINER_NAME}' not found after shutdown`,
            steps,
          };
        }

        // If container is still running, stop it via Docker
        const state = await getContainerState();
        if (state === "running") {
          const stopResult = await dockerPost(id, "stop");
          steps.push(
            stopResult.ok
              ? "✅ Container stopped via Docker"
              : `⚠️ Docker stop returned ${stopResult.status}`,
          );
          await sleep(3000);
        } else {
          steps.push(`✅ Container already stopped (state: ${state})`);
        }

        // Step 5: Start container
        const startResult = await dockerPost(id, "start");
        if (startResult.ok || startResult.status === 304) {
          steps.push("✅ Container started");
          return {
            success: true,
            message: "Server restarted successfully",
            steps,
          };
        }

        steps.push(`❌ Failed to start: Docker returned ${startResult.status}`);
        return { success: false, error: "Failed to start container", steps };
      } catch (e: any) {
        steps.push(`❌ Error: ${e.message}`);
        return { success: false, error: e.message, steps };
      }
    },
    {
      body: t.Object({
        waittime: t.Optional(t.Number()),
        message: t.Optional(t.String()),
      }),
    },
  )

  .listen(PORT);

console.log(`Palworld Web Backend running at http://localhost:${PORT}`);
