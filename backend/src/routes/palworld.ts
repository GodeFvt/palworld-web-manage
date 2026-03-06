// ---------------------------------------------------------------------------
// Palworld REST API proxy routes — /api/palworld/*
// ---------------------------------------------------------------------------

import { Elysia, t } from "elysia";
import { palworldFetch } from "../services/palworld-api";

export const palworldRoutes = new Elysia()

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
  });
