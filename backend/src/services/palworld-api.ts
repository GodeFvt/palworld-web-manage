// ---------------------------------------------------------------------------
// Palworld REST API client
// ---------------------------------------------------------------------------

import {
  PALWORLD_API_HOST,
  PALWORLD_API_PORT,
  PALWORLD_API_USER,
  PALWORLD_API_PASSWORD,
} from "../config";

function palworldApiUrl(path: string): string {
  return `http://${PALWORLD_API_HOST}:${PALWORLD_API_PORT}/v1/api${path}`;
}

function authHeader(): string {
  return "Basic " + btoa(`${PALWORLD_API_USER}:${PALWORLD_API_PASSWORD}`);
}

/** Fetch from the Palworld REST API with auth headers. */
export async function palworldFetch(
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
