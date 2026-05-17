import { NextRequest, NextResponse } from "next/server";
import { createElement } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { syncOrgSeats } from "@/lib/stripe/seats";
import { sendEmail } from "@/lib/email/send";
import { InviteAccepted } from "@/emails/org/InviteAccepted";
import { normalizeRoles } from "@/lib/auth/permissions";

export async function POST(req: NextRequest) {
  const { token, orgId } = await req.json();

  // Verify user is authenticated
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });

  const admin = createAdminClient();

  // Validate invite
  const { data: invite } = await admin
    .from("org_invites")
    .select("id, org_id, email, org_role, roles, expires_at, accepted_at, invited_by")
    .eq("token", token)
    .eq("org_id", orgId)
    .maybeSingle();

  if (!invite) return NextResponse.json({ ok: false, error: "Invite not found" }, { status: 404 });
  if (invite.accepted_at) return NextResponse.json({ ok: false, error: "Already accepted" }, { status: 400 });
  if (new Date(invite.expires_at) < new Date()) return NextResponse.json({ ok: false, error: "Invite expired" }, { status: 400 });
  if (!user.email || user.email.toLowerCase() !== invite.email.toLowerCase()) {
    return NextResponse.json(
      { ok: false, error: "This invitation was sent to a different email address" },
      { status: 403 }
    );
  }

  // Check if already a member
  const { data: existing } = await supabase
    .from("org_members")
    .select("id")
    .eq("org_id", orgId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!existing) {
    const { error: memberErr } = await admin.from("org_members").insert({
      org_id: orgId,
      user_id: user.id,
      roles: normalizeRoles(invite.roles),
    });
    if (memberErr) return NextResponse.json({ ok: false, error: memberErr.message }, { status: 500 });
  }

  await applyPaidWorkspaceRole(admin, orgId, user.id);

  await admin
    .from("employees")
    .update({ linked_user_id: user.id })
    .eq("org_id", orgId)
    .ilike("email", user.email);

  // Mark invite as accepted
  await admin
    .from("org_invites")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", invite.id);

  syncOrgSeats(orgId).catch((err) => {
    console.error("Failed to sync org seats after invite acceptance", err);
  });

  sendInviteAcceptedEmail(orgId, invite.invited_by, user.id).catch((err) => {
    console.error("Failed to send invite accepted email", err);
  });

  return NextResponse.json({ ok: true });
}

async function applyPaidWorkspaceRole(
  admin: ReturnType<typeof createAdminClient>,
  orgId: string,
  userId: string
) {
  const { data: subscription } = await admin
    .from("subscriptions")
    .select("plan, status")
    .eq("org_id", orgId)
    .in("status", ["active", "trialing", "past_due"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const plan = (subscription as { plan?: string } | null)?.plan;
  if (plan !== "team" && plan !== "business") return;

  const { data: membership } = await admin
    .from("org_members")
    .select("roles")
    .eq("org_id", orgId)
    .eq("user_id", userId)
    .maybeSingle();

  const roles = Array.isArray(membership?.roles) ? membership.roles : [];
  const nextRole = roles.includes("workspace_owner")
    ? plan === "business"
      ? "business_admin"
      : "team_admin"
    : plan === "business"
      ? "business_member"
      : "team_member";

  await admin.from("profiles").update({ role: nextRole }).eq("id", userId);
}

async function sendInviteAcceptedEmail(orgId: string, inviterId: string | null, inviteeId: string) {
  if (!inviterId) return;
  const admin = createAdminClient();
  const [{ data: org }, { data: inviter }, { data: invitee }, { data: subscription }, memberCount] = await Promise.all([
    admin.from("organisations").select("name").eq("id", orgId).single(),
    admin.from("profiles").select("email, full_name").eq("id", inviterId).single(),
    admin.from("profiles").select("email, full_name").eq("id", inviteeId).single(),
    admin
      .from("subscriptions")
      .select("plan")
      .eq("org_id", orgId)
      .in("status", ["active", "trialing", "past_due"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin
      .from("org_members")
      .select("id", { count: "exact", head: true })
      .eq("org_id", orgId)
      .then((res) => res.count ?? 0),
  ]);

  if (!org || !inviter?.email) return;
  const plan = (subscription as { plan?: string } | null)?.plan;
  const seatBreakdown =
    plan === "team" || plan === "business"
      ? `Your workspace now has ${memberCount} member${memberCount === 1 ? "" : "s"}. Billing is based on active employee records, not support/admin workspace members.`
      : `Your workspace now has ${memberCount} member${memberCount === 1 ? "" : "s"}.`;

  await sendEmail({
    to: inviter.email,
    userId: inviterId,
    type: "invite_accepted",
    subject: `${invitee?.full_name ?? invitee?.email ?? "A teammate"} joined your team on Atlas HR`,
    react: createElement(InviteAccepted, {
      inviteeName: invitee?.full_name ?? invitee?.email ?? "A teammate",
      orgName: org.name,
      seatCount: memberCount,
      seatBreakdown,
      teamUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/workspace/settings`,
    }),
  });
}
