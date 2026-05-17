import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/get-user";

export async function requireOnboarding(): Promise<void> {
  const profile = await getUser();
  if (!profile) return; // unauthenticated — middleware handles the redirect to /sign-in

  if (!profile.onboarding_completed) {
    const step = profile.job_title ? 3 : 2;
    redirect(`/sign-up?step=${step}`);
  }
}
