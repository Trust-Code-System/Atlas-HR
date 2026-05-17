"use server";

import { createHmac } from "crypto";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { CONSENT_COOKIE_NAME, CONSENT_VERSION, type CookieConsent } from "@/lib/consent";

type UpdateBuilder = {
  update(values: Record<string, unknown>): {
    eq(column: string, value: unknown): Promise<unknown>;
  };
};

type UntypedSupabase = {
  from(table: string): UpdateBuilder;
};

function signedConsentVersion() {
  const secret =
    process.env.UNSUBSCRIBE_SECRET ??
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    "dev-secret";
  const signature = createHmac("sha256", secret)
    .update(CONSENT_VERSION)
    .digest("base64url");
  return `${CONSENT_VERSION}.${signature}`;
}

export async function saveCookieConsent(consent: CookieConsent) {
  const cookieStore = await cookies();
  cookieStore.set(CONSENT_COOKIE_NAME, signedConsentVersion(), {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const db = supabase as unknown as UntypedSupabase;
    await db
      .from("profiles")
      .update({ cookie_consent: consent })
      .eq("id", user.id);
  }

  return { ok: true as const };
}
