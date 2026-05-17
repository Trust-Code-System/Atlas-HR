import { createHash } from "crypto";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import { NewSignIn } from "@/emails/auth/NewSignIn";

type DbError = { message: string };
type QueryResult<T> = Promise<{ data: T | null; error: DbError | null; count?: number | null }>;
type QueryBuilder<T = Record<string, unknown>> = {
  select(columns?: string, options?: Record<string, unknown>): QueryBuilder<T>;
  eq(column: string, value: unknown): QueryBuilder<T>;
  maybeSingle(): QueryResult<T>;
  single(): QueryResult<T>;
  insert(values: Record<string, unknown>): QueryBuilder<T>;
  update(values: Record<string, unknown>): QueryBuilder<T>;
  then<TResult1 = { data: T[] | null; error: DbError | null; count: number | null }, TResult2 = never>(
    onfulfilled?:
      | ((value: { data: T[] | null; error: DbError | null; count: number | null }) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2>;
};
type UntypedSupabase = {
  from<T = Record<string, unknown>>(table: string): QueryBuilder<T>;
};

type ProfileRow = {
  email: string;
  full_name: string | null;
};

type DeviceRow = {
  id: string;
};

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function inferDevice(userAgent: string) {
  if (!userAgent) return "Unknown device";
  const browser = userAgent.includes("Edg/")
    ? "Edge"
    : userAgent.includes("Chrome/")
      ? "Chrome"
      : userAgent.includes("Firefox/")
        ? "Firefox"
        : userAgent.includes("Safari/")
          ? "Safari"
          : "Browser";
  const os = userAgent.includes("Windows")
    ? "Windows"
    : userAgent.includes("Mac OS")
      ? "macOS"
      : userAgent.includes("Android")
        ? "Android"
        : userAgent.includes("iPhone") || userAgent.includes("iPad")
          ? "iOS"
          : "Unknown OS";
  return `${browser} on ${os}`;
}

function cleanHeader(value: string | null) {
  if (!value) return null;
  try {
    return decodeURIComponent(value).slice(0, 80);
  } catch {
    return value.slice(0, 80);
  }
}

export async function trackSignInDevice(userId: string) {
  try {
    const headerStore = await headers();
    const userAgent = headerStore.get("user-agent") ?? "";
    const city = cleanHeader(headerStore.get("x-vercel-ip-city"));
    const country = cleanHeader(headerStore.get("x-vercel-ip-country"));
    const deviceHash = sha256(`${userAgent}:${city ?? ""}:${country ?? ""}`);
    const supabase = createAdminClient() as unknown as UntypedSupabase;

    const { data: existing } = await supabase
      .from<DeviceRow>("user_devices")
      .select("id")
      .eq("user_id", userId)
      .eq("device_hash", deviceHash)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("user_devices")
        .update({ last_seen_at: new Date().toISOString() })
        .eq("id", existing.id);
      return;
    }

    const { count } = await supabase
      .from("user_devices")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    await supabase.from("user_devices").insert({
      user_id: userId,
      device_hash: deviceHash,
      user_agent: sha256(userAgent),
      city,
      country,
    });

    if ((count ?? 0) === 0) return;

    const { data: profile } = await supabase
      .from<ProfileRow>("profiles")
      .select("email, full_name")
      .eq("id", userId)
      .single();

    if (!profile?.email) return;

    await sendEmail({
      to: profile.email,
      userId,
      type: "new_sign_in",
      subject: "New sign-in to your Atlas HR account",
      react: (
        <NewSignIn
          device={inferDevice(userAgent)}
          location={[city, country].filter(Boolean).join(", ") || "Unknown location"}
          time={new Date().toLocaleString("en", { dateStyle: "medium", timeStyle: "short" })}
          securityUrl={`${process.env.NEXT_PUBLIC_APP_URL}/settings/security`}
        />
      ),
    });
  } catch (err) {
    console.error("Failed to track sign-in device", err);
  }
}
