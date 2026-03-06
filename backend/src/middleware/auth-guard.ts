// ---------------------------------------------------------------------------
// JWT auth guard middleware — protects all non-public routes
// ---------------------------------------------------------------------------

import { Elysia } from "elysia";
import { COOKIE_NAME } from "../config";

/** Set of public paths that skip authentication. */
const PUBLIC_PATHS = new Set([
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/me",
  "/api/auth/refresh",
]);

/**
 * Auth guard plugin.
 * Attach this AFTER the JWT plugins and auth routes so that
 * all subsequent routes require a valid access token.
 */
export const authGuard = new Elysia().onBeforeHandle(
  async ({ jwt, cookie, headers, set, path }: any) => {
    // Public endpoints — skip guard
    if (PUBLIC_PATHS.has(path)) return;

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
  },
);
