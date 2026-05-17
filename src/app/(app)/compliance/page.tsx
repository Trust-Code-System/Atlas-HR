import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/get-user";
import { getAllComplianceUpdates } from "@/lib/compliance-data";
import { ComplianceAdminClient } from "./compliance-admin-client";

export const metadata = {
  title: "Compliance CMS | Atlas HR",
};

export default async function ComplianceAdminPage() {
  const user = await getUser();
  if (!user) redirect("/sign-in");
  if (!["admin", "moderator"].includes(user.role)) redirect("/dashboard");

  const updates = getAllComplianceUpdates();

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-[24px] bg-linear-to-br from-navy-950 via-navy-900 to-navy-800 px-7 py-6 mb-8 shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.12),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(16,185,129,0.08),transparent_60%)]" />
        <div className="relative flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-white/10 ring-1 ring-white/10 flex items-center justify-center text-white shrink-0">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Compliance CMS</h1>
            <p className="text-blue-300 text-sm mt-0.5">Draft, review, and publish compliance updates to the public tracker</p>
          </div>
        </div>
      </div>

      <ComplianceAdminClient updates={updates} />
    </div>
  );
}
