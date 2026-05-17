import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/get-current-org";
import { redirect } from "next/navigation";
import { TimeClient } from "./time-client";
import { getTimeEmployeeForUser } from "./employee-lookup";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Time" };

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default async function TimePage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx) redirect("/dashboard");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const employee = user ? await getTimeEmployeeForUser(supabase, orgCtx, user) : null;

  // Week navigation
  const { week } = await searchParams;
  const weekStart = week
    ? new Date(week)
    : getWeekStart(new Date());
  const weekStartStr = weekStart.toISOString().split("T")[0];
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const weekEndStr = weekEnd.toISOString().split("T")[0];

  // Own entries for the week
  const { data: myEntries } = employee
    ? await supabase
        .from("time_entries")
        .select("*")
        .eq("employee_id", employee.id)
        .gte("date", weekStartStr)
        .lte("date", weekEndStr)
    : { data: [] };

  // Admin view: all entries for the week pending approval
  let pendingEntries: Array<{
    id: string;
    employee_id: string;
    date: string;
    hours: number;
    category: string;
    status: string;
    notes: string | null;
    approved_by: string | null;
  }> = [];
  let pendingEmployees: Array<{ id: string; full_name: string }> = [];

  if (orgCtx.isAdmin) {
    const { data: pending } = await supabase
      .from("time_entries")
      .select("*")
      .eq("status", "submitted")
      .gte("date", weekStartStr)
      .lte("date", weekEndStr);

    pendingEntries = pending ?? [];

    const pendingEmpIds = [...new Set(pendingEntries.map((e) => e.employee_id))];
    if (pendingEmpIds.length > 0) {
      const { data: emps } = await supabase
        .from("employees")
        .select("id, full_name")
        .in("id", pendingEmpIds)
        .eq("org_id", orgCtx.org.id);
      pendingEmployees = (emps ?? []) as Array<{ id: string; full_name: string }>;
    }
  }

  return (
    <TimeClient
      employee={employee as { id: string; full_name: string } | null}
      myEntries={myEntries ?? []}
      weekStartStr={weekStartStr}
      weekEndStr={weekEndStr}
      isAdmin={orgCtx.isAdmin}
      pendingEntries={pendingEntries}
      pendingEmployees={pendingEmployees}
    />
  );
}
