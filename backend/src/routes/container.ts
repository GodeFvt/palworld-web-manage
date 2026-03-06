// ---------------------------------------------------------------------------
// Docker container management routes — /api/container/*
// ---------------------------------------------------------------------------

import { Elysia, t } from "elysia";
import { PALWORLD_CONTAINER_NAME } from "../config";
import { sleep } from "../utils";
import {
  findContainerId,
  dockerPost,
  getContainerState,
  getContainerStats,
} from "../services/docker";
import { palworldFetch } from "../services/palworld-api";

export const containerRoutes = new Elysia()

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

  // GET container resource stats (CPU & RAM)
  .get("/api/container/stats", async () => {
    try {
      const id = await findContainerId();
      if (!id)
        return {
          success: false,
          error: `Container '${PALWORLD_CONTAINER_NAME}' not found`,
        };
      const stats = await getContainerStats(id);
      if (!stats)
        return {
          success: false,
          error: "Could not retrieve container stats (is it running?)",
        };
      return { success: true, data: stats };
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
  );
