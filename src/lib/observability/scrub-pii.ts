const PII_PATTERNS = [
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  /\+?[1-9]\d{6,14}/g,
  /sk_(live|test)_[a-zA-Z0-9]{24,}/g,
  /Bearer\s+[a-zA-Z0-9._-]+/g,
];

const PII_KEYS = ["password", "token", "secret", "authorization", "cookie", "api_key"];

export function scrubPII(obj: unknown): unknown {
  if (!obj) return obj;
  if (typeof obj === "string") {
    let s = obj;
    for (const p of PII_PATTERNS) s = s.replace(p, "[REDACTED]");
    return s;
  }
  if (typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(scrubPII);
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    cleaned[key] = PII_KEYS.some((p) => key.toLowerCase().includes(p))
      ? "[REDACTED]"
      : scrubPII(value);
  }
  return cleaned;
}
