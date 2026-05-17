import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { trackSignInDevice } from "@/lib/auth/device-tracking";
import { applyBetaInviteToUser } from "@/lib/beta";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const betaCode = searchParams.get("beta_code");
  // Only allow relative paths to prevent open-redirect attacks
  const rawNext = searchParams.get("next") ?? "";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") && !rawNext.includes("://")
    ? rawNext
    : "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await trackSignInDevice(user.id);
        if (betaCode && user.email) {
          const betaResult = await applyBetaInviteToUser({
            code: betaCode,
            userId: user.id,
            email: user.email,
          });
          if (!betaResult.ok) {
            await supabase.auth.signOut();
            return NextResponse.redirect(
              `${origin}/sign-up?error=${encodeURIComponent(betaResult.error)}`
            );
          }
        }
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/sign-in?error=auth_callback_failed`);
}
