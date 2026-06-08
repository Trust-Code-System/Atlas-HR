import { redirect } from "next/navigation";
import { getCurrentOrg } from "@/lib/org/get-current-org";
import { OrgForm } from "./org-form";

export default async function OrgOnboardingPage() {
  const orgCtx = await getCurrentOrg();
  if (orgCtx) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-navy-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 mx-auto mb-4">
            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-navy-900">Create your organisation</h1>
          <p className="text-navy-500 text-sm mt-1">
            Set up your organisation workspace on Atlas HR.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-navy-200 shadow-md p-8">
          <OrgForm />
        </div>
      </div>
    </div>
  );
}
