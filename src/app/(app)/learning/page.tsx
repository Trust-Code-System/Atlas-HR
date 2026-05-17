import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/get-current-org";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { LearningClient } from "./learning-client";
import type { LMSCourse, LMSEnrolment, LMSCertification, Employee } from "@/types/database";
import { dataOrEmpty } from "@/lib/supabase/schema";

export const metadata: Metadata = { title: "Learning & Development | Atlas HR" };

export default async function LearningPage() {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx) redirect("/dashboard");

  const supabase = await createClient();

  const [rawCourses, rawEnrolments, rawCerts, rawEmployees] =
    await Promise.all([
      dataOrEmpty(supabase
        .from("lms_courses")
        .select("*")
        .eq("org_id", orgCtx.org.id)
        .neq("status", "archived")
        .order("created_at", { ascending: false })),
      dataOrEmpty(supabase
        .from("lms_enrolments")
        .select("*")
        .eq("org_id", orgCtx.org.id)
        .order("created_at", { ascending: false })),
      dataOrEmpty(supabase
        .from("lms_certifications")
        .select("*")
        .eq("org_id", orgCtx.org.id)
        .order("issued_date", { ascending: false })),
      dataOrEmpty(supabase
        .from("employees")
        .select("id, full_name, job_title, department, status")
        .eq("org_id", orgCtx.org.id)
        .eq("status", "active")
        .order("full_name")),
    ]);

  const courses        = (rawCourses   ?? []) as LMSCourse[];
  const enrolments     = (rawEnrolments ?? []) as LMSEnrolment[];
  const certifications = (rawCerts     ?? []) as LMSCertification[];
  const employees      = (rawEmployees ?? []) as Pick<Employee, "id" | "full_name" | "job_title" | "department" | "status">[];

  const activeCourses   = courses.filter((c) => c.status === "published").length;
  const completedEnrols = enrolments.filter((e) => e.status === "completed").length;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto w-full">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-[24px] bg-linear-to-br from-navy-950 via-navy-900 to-navy-800 px-7 py-6 mb-8 shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.12),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(139,92,246,0.08),transparent_60%)]" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-white/10 ring-1 ring-white/10 flex items-center justify-center text-white shrink-0">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Learning & Development</h1>
              <p className="text-blue-300 text-sm mt-0.5">
                {orgCtx.org.name}
                {activeCourses > 0 && (
                  <span className="ml-2 inline-flex items-center gap-1 bg-blue-500/20 text-blue-300 text-xs font-semibold px-2 py-0.5 rounded-full ring-1 ring-blue-400/30">
                    {activeCourses} published
                  </span>
                )}
              </p>
            </div>
          </div>
          {(enrolments.length > 0 || certifications.length > 0) && (
            <div className="flex gap-5 shrink-0">
              {enrolments.length > 0 && (
                <div className="text-right">
                  <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Enrolments</p>
                  <p className="font-mono text-2xl font-bold text-white tabular-nums">{enrolments.length}</p>
                </div>
              )}
              {completedEnrols > 0 && (
                <div className="text-right">
                  <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Completed</p>
                  <p className="font-mono text-2xl font-bold text-emerald-300 tabular-nums">{completedEnrols}</p>
                </div>
              )}
              {certifications.length > 0 && (
                <div className="text-right">
                  <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Certs</p>
                  <p className="font-mono text-2xl font-bold text-amber-300 tabular-nums">{certifications.length}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <LearningClient
        courses={courses}
        enrolments={enrolments}
        certifications={certifications}
        employees={employees}
        isAdmin={orgCtx.isAdmin}
      />
    </div>
  );
}
