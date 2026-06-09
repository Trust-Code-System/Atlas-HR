import "server-only";
import crypto from "node:crypto";

/**
 * At-rest encryption for sensitive stored values — notably org_integrations
 * config (webhook URLs, tokens, service-account JSON). §28 "confirmed token
 * encryption".
 *
 * AES-256-GCM. The key comes from ATLAS_ENCRYPTION_KEY when set (32 bytes,
 * base64 or hex); otherwise it is derived from SUPABASE_SERVICE_ROLE_KEY so
 * encryption works out of the box without a new env var. Set a dedicated
 * ATLAS_ENCRYPTION_KEY in production if you rotate the service-role key.
 *
 * Encrypted values are tagged `enc:v1:<iv>:<tag>:<data>` (all base64). Values
 * without that prefix are returned unchanged on decrypt, so pre-existing
 * plaintext rows keep working and migrate lazily on next write.
 */

const PREFIX = "enc:v1:";

let cachedKey: Buffer | null = null;
function getKey(): Buffer {
  if (cachedKey) return cachedKey;
  const explicit = process.env.ATLAS_ENCRYPTION_KEY?.trim();
  if (explicit) {
    const buf = explicit.length === 64 ? Buffer.from(explicit, "hex") : Buffer.from(explicit, "base64");
    if (buf.length !== 32) {
      throw new Error("ATLAS_ENCRYPTION_KEY must be 32 bytes (hex or base64).");
    }
    cachedKey = buf;
    return cachedKey;
  }
  const seed = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!seed) throw new Error("No encryption key available (set ATLAS_ENCRYPTION_KEY or SUPABASE_SERVICE_ROLE_KEY).");
  cachedKey = crypto.scryptSync(seed, "atlas-org-integrations-v1", 32);
  return cachedKey;
}

export function isEncrypted(value: string): boolean {
  return typeof value === "string" && value.startsWith(PREFIX);
}

export function encryptValue(plain: string): string {
  if (plain === "" || isEncrypted(plain)) return plain;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getKey(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString("base64")}:${tag.toString("base64")}:${enc.toString("base64")}`;
}

export function decryptValue(value: string): string {
  if (!isEncrypted(value)) return value;
  try {
    const [, , ivB64, tagB64, dataB64] = value.split(":");
    const iv = Buffer.from(ivB64, "base64");
    const tag = Buffer.from(tagB64, "base64");
    const data = Buffer.from(dataB64, "base64");
    const decipher = crypto.createDecipheriv("aes-256-gcm", getKey(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
  } catch {
    // Tampered or key-mismatch — fail closed with an empty string rather than throwing.
    return "";
  }
}

/** Encrypt every value in an integration config map. */
export function encryptConfig(config: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(config)) out[k] = typeof v === "string" ? encryptValue(v) : v;
  return out;
}

/** Decrypt every value in an integration config map. */
export function decryptConfig(config: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(config)) out[k] = typeof v === "string" ? decryptValue(v) : v;
  return out;
}
