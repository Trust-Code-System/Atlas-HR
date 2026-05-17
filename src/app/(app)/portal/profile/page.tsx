import { getUser } from "@/lib/auth/get-user";
import { getCurrentOrg } from "@/lib/org/get-current-org";
import { getMyEmployee } from "@/lib/portal/get-my-employee";
import { redirect } from "next/navigation";
import { ProfilePortalClient } from "./profile-portal-client";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "My Profile | Atlas HR" };

export default async function PortalProfilePage() {
  const user = await getUser();
  if (!user) redirect("/sign-in");

  const orgData = await getCurrentOrg();
  if (!orgData) redirect("/onboarding/org");

  const employee = await getMyEmployee();

  if (!employee) {
    return (
      <div className="p-6 lg:p-8 max-w-3xl mx-auto w-full">
        <div className="rounded-[18px] border border-amber-200 bg-amber-50 p-6 text-center mt-8">
          <p className="text-sm text-amber-700">Your account is not linked to an employee record. Ask your HR admin to link your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto w-full">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-[24px] bg-linear-to-br from-navy-950 via-navy-900 to-navy-800 px-7 py-6 mb-8 shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.12),transparent_60%)]" />
        <div className="relative flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-white/10 ring-1 ring-white/10 flex items-center justify-center text-white text-xl font-bold shrink-0">
            {employee.full_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">{employee.full_name}</h1>
            <p className="text-blue-300 text-sm mt-0.5">
              {[employee.job_title, employee.department].filter(Boolean).join(" · ")}
            </p>
          </div>
        </div>
      </div>

      <ProfilePortalClient employee={employee} />
    </div>
  );
}
