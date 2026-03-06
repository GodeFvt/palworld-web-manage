// ---------------------------------------------------------------------------
// Auth routes — /api/auth/*
// ---------------------------------------------------------------------------

import { Elysia, t } from "elysia";
import {
  PALWORLD_API_USER,
  PALWORLD_API_PASSWORD,
  COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  COOKIE_EXPIRY,
} from "../config";
import { parseDurationToSeconds } from "../utils";

const COOKIE_MAX_AGE = parseDurationToSeconds(COOKIE_EXPIRY);

export const authRoutes = new Elysia()

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
  );
