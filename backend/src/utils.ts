// ---------------------------------------------------------------------------
// Utility functions
// ---------------------------------------------------------------------------

/** Convert a duration string like "30m", "7d", "1h" to seconds. */
export function parseDurationToSeconds(dur: string): number {
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

/** Sleep for the given number of milliseconds. */
export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
