// ---------------------------------------------------------------------------
// Docker Engine API helpers (via Unix socket)
// ---------------------------------------------------------------------------

import { DOCKER_SOCKET, PALWORLD_CONTAINER_NAME } from "../config";

/**
 * Find the container ID for the palworld server.
 * First tries exact name match, then falls back to a name-contains filter.
 */
export async function findContainerId(): Promise<string | null> {
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

/** Send a POST action to a Docker container (start, stop, restart, etc.). */
export async function dockerPost(
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

/** Get the current state of the palworld container (running, exited, etc.). */
export async function getContainerState(): Promise<string | null> {
  const id = await findContainerId();
  if (!id) return null;
  const url = `http://localhost/containers/${id}/json`;
  const res = await fetch(url, { unix: DOCKER_SOCKET } as any);
  if (!res.ok) return null;
  const info = (await res.json()) as any;
  return info?.State?.Status ?? null;
}

export interface ContainerStats {
  cpuPercent: number;
  memoryUsageMB: number;
  memoryLimitMB: number;
  memoryPercent: number;
}

/** Get CPU & memory stats for a container (one-shot, non-streaming). */
export async function getContainerStats(
  containerId: string,
): Promise<ContainerStats | null> {
  const url = `http://localhost/containers/${containerId}/stats?stream=false`;
  const res = await fetch(url, { unix: DOCKER_SOCKET } as any);
  if (!res.ok) return null;
  const stats = (await res.json()) as any;

  // CPU % calculation — percentage of total system CPU (0–100%)
  const cpuDelta =
    stats.cpu_stats.cpu_usage.total_usage -
    stats.precpu_stats.cpu_usage.total_usage;
  const systemDelta =
    stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
  // system_cpu_usage is cumulative across ALL cores, so dividing directly
  // gives the fraction of total system capacity (no need to multiply by numCpus)
  const cpuPercent = systemDelta > 0 ? (cpuDelta / systemDelta) * 100 : 0;

  // Memory
  const memUsage = stats.memory_stats.usage ?? 0;
  const memCache = stats.memory_stats.stats?.cache ?? 0;
  const memoryUsageMB = (memUsage - memCache) / (1024 * 1024);
  const memoryLimitMB = (stats.memory_stats.limit ?? 0) / (1024 * 1024);
  const memoryPercent =
    memoryLimitMB > 0 ? (memoryUsageMB / memoryLimitMB) * 100 : 0;

  return {
    cpuPercent: Math.round(cpuPercent * 100) / 100,
    memoryUsageMB: Math.round(memoryUsageMB),
    memoryLimitMB: Math.round(memoryLimitMB),
    memoryPercent: Math.round(memoryPercent * 100) / 100,
  };
}
