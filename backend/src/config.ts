// ---------------------------------------------------------------------------
// Environment variables & constants
// ---------------------------------------------------------------------------

export const PALWORLD_API_HOST =
  process.env.PALWORLD_API_HOST || "palworld-server";
export const PALWORLD_API_PORT = process.env.PALWORLD_API_PORT || "8212";
export const PALWORLD_API_USER = process.env.PALWORLD_API_USER || "admin";
export const PALWORLD_API_PASSWORD = process.env.PALWORLD_API_PASSWORD || "";

export const SETTINGS_PATH =
  process.env.SETTINGS_PATH ||
  "/app/palworld-saved/Config/LinuxServer/PalWorldSettings.ini";

export const PORT = parseInt(process.env.PORT || "3000");

export const PALWORLD_CONTAINER_NAME =
  process.env.PALWORLD_CONTAINER_NAME || "palworld-server";
export const DOCKER_SOCKET = "/var/run/docker.sock";

export const JWT_SECRET =
  process.env.JWT_SECRET ||
  PALWORLD_API_PASSWORD ||
  "palworld-web-manage-secret";
export const JWT_EXPIRY = process.env.JWT_EXPIRY || "30m";
export const REFRESH_EXPIRY = process.env.REFRESH_EXPIRY || "7d";
export const COOKIE_EXPIRY = process.env.COOKIE_EXPIRY || REFRESH_EXPIRY;

export const COOKIE_NAME = "palworld_token";
export const REFRESH_COOKIE_NAME = "palworld_refresh";
