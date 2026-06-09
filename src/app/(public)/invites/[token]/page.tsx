import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getUser } from "@/lib/auth/get-user";
import { AcceptInviteButton } from "./accept-invite-button";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function InvitePage({ params }: Props) {
  const { token } = await params;
  const supabase = await createClient();

  const { data: invite } = await supabase
    .from("org_invites")
    .select("*")
    .eq("token", token)
    .single();

  if (!invite) return notFound();

  const expired =
    invite.expires_at && new Date(invite.expires_at) < new Date();
  const accepted = !!invite.accepted_at;

  const user = await getUser();

  return (
    <div className="min-h-screen bg-navy-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl border border-navy-200 shadow-md p-8 text-center">
          {/* Logo */}
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 mx-auto mb-6">
            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>

          {expired ? (
            <>
              <h1 className="text-xl font-bold text-navy-900 mb-2">Invite expired</h1>
              <p className="text-navy-500 text-sm mb-6">
                This invitation link has expired. Ask your organisation admin to send a new one.
              </p>
              <Link href="/" className="text-blue-600 font-semibold hover:text-blue-700 text-sm">
                Go to Atlas HR →
              </Link>
            </>
          ) : accepted ? (
            <>
              <h1 className="text-xl font-bold text-navy-900 mb-2">Already accepted</h1>
              <p className="text-navy-500 text-sm mb-6">
                This invitation has already been accepted. Sign in to access your workspace.
              </p>
              <Link
                href="/sign-in"
                className="inline-flex items-center justify-center w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
              >
                Sign in
              </Link>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-navy-900 mb-2">
                You&apos;ve been invited
              </h1>
              <p className="text-navy-500 text-sm mb-1">
                You&apos;ve been invited to join an organisation on Atlas HR.
              </p>
              <p className="text-navy-400 text-xs mb-8">
                Invited to: <strong className="text-navy-600">{invite.email}</strong>
              </p>

              {user ? (
                <AcceptInviteButton token={token} />
              ) : (
                <div className="space-y-3">
                  <Link
                    href={`/sign-up?invite=${token}`}
                    className="flex items-center justify-center w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
                  >
                    Create account &amp; accept
                  </Link>
                  <Link
                    href={`/sign-in?invite=${token}`}
                    className="flex items-center justify-center w-full border-2 border-navy-200 hover:border-navy-300 hover:bg-navy-50 text-navy-700 font-semibold py-3 rounded-xl transition-colors text-sm"
                  >
                    Sign in &amp; accept
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
