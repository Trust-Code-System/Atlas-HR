import { createHmac, timingSafeEqual } from "crypto";
import type { EmailType } from "@/lib/email/send";

type UnsubscribePayload = {
  userId: string;
  type: EmailType;
  exp: number;
};

function secret() {
  return process.env.UNSUBSCRIBE_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "dev-secret";
}

function base64url(value: string | Buffer) {
  return Buffer.from(value).toString("base64url");
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function createUnsubscribeToken(userId: string, type: EmailType) {
  const payload = base64url(
    JSON.stringify({
      userId,
      type,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365,
    } satisfies UnsubscribePayload)
  );
  return `${payload}.${sign(payload)}`;
}

export function verifyUnsubscribeToken(token: string): UnsubscribePayload | null {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = sign(payload);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as UnsubscribePayload;
    if (!parsed.userId || !parsed.type || parsed.exp < Math.floor(Date.now() / 1000)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function unsubscribeUrl(userId: string, type: EmailType) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${baseUrl}/unsubscribe?token=${createUnsubscribeToken(userId, type)}`;
}
