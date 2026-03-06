// ---------------------------------------------------------------------------
// Settings routes — /api/settings-schema, /api/config, /api/config/raw
// ---------------------------------------------------------------------------

import { Elysia, t } from "elysia";
import { SETTINGS_PATH } from "../config";
import {
  parseSettings,
  serializeSettings,
  validateSettings,
  SETTINGS_SCHEMA,
} from "../settings-parser";
import type { PalWorldSettings } from "../settings-parser";

export const settingsRoutes = new Elysia()

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
  );
