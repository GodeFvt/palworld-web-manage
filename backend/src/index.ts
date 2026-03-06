// ---------------------------------------------------------------------------
// Palworld Web Backend — Entry Point
// ---------------------------------------------------------------------------

import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { jwt } from "@elysiajs/jwt";

import { PORT, JWT_SECRET, JWT_EXPIRY, REFRESH_EXPIRY } from "./config";
import { authGuard } from "./middleware/auth-guard";
import { authRoutes } from "./routes/auth";
import { settingsRoutes } from "./routes/settings";
import { palworldRoutes } from "./routes/palworld";
import { containerRoutes } from "./routes/container";

const app = new Elysia()
  // ── Plugins ──────────────────────────────────────────────
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

  // ── Auth (public) ────────────────────────────────────────
  .use(authRoutes)

  // ── Auth Guard (protects all routes registered after this)
  .use(authGuard)

  // ── Protected Routes ─────────────────────────────────────
  .use(settingsRoutes)
  .use(palworldRoutes)
  .use(containerRoutes)

  .listen(PORT);

console.log(`Palworld Web Backend running at http://localhost:${PORT}`);
