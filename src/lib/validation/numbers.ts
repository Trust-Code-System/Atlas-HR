/** Parse a form field as a finite, non-negative float, clamped to `max`. Returns null if empty or invalid. */
export function parseAmount(raw: string | null | undefined, max = 100_000_000): number | null {
  if (!raw || raw.trim() === "") return null;
  const n = parseFloat(raw);
  if (!isFinite(n) || isNaN(n)) return null;
  return Math.max(0, Math.min(n, max));
}

/** Parse a form field as a percentage (0–100). */
export function parsePct(raw: string | null | undefined): number {
  const n = parseFloat(raw ?? "0");
  if (!isFinite(n) || isNaN(n)) return 0;
  return Math.max(0, Math.min(n, 100));
}

/** Parse a form field as a positive integer, clamped to `max`. Returns null if empty or invalid. */
export function parseInt10(raw: string | null | undefined, max = 100_000): number | null {
  if (!raw || raw.trim() === "") return null;
  const n = parseInt(raw, 10);
  if (!isFinite(n) || isNaN(n)) return null;
  return Math.max(0, Math.min(n, max));
}
