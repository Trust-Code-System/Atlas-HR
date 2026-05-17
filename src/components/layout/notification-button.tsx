import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/get-current-org";
import { getMyEmployee } from "@/lib/portal/get-my-employee";
import { NotificationPanel } from "./notification-panel";
import type { AppNotification } from "./notification-panel";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)  return "Just now";
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days  < 7)  return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export async function NotificationButton() {
  try {
    const orgCtx = await getCurrentOrg();
    if (!orgCtx) return <NotificationPanel initialNotifications={[]} />;

    const supabase = await createClient();
    const notifications: AppNotification[] = [];

    const [employee] = await Promise.all([getMyEmployee()]);

    // ── Admin notifications ───────────────────────────────────────────────────
    if (orgCtx.isAdmin) {
      // Need org employee IDs to filter leave_requests (no org_id on that table)
      const { data: orgEmployees } = await supabase
        .from("employees")
        .select("id")
        .eq("org_id", orgCtx.org.id)
        .eq("status", "active");

      const orgEmployeeIds = (orgEmployees ?? []).map((e) => e.id);

      const [pendingLeaveRes, draftPayrollRes, openJobsRes] = await Promise.all([
        orgEmployeeIds.length > 0
          ? supabase
              .from("leave_requests")
              .select("id, created_at")
              .in("employee_id", orgEmployeeIds)
              .eq("status", "pending")
              .order("created_at", { ascending: false })
              .limit(20)
          : Promise.resolve({ data: [] }),
        supabase
          .from("payroll_runs")
          .select("id, name, created_at")
          .eq("org_id", orgCtx.org.id)
          .eq("status", "draft")
          .order("created_at", { ascending: false })
          .limit(3),
        supabase
          .from("jobs")
          .select("id")
          .eq("org_id", orgCtx.org.id)
          .eq("status", "open"),
      ]);

      // Pending leave approvals
      const pendingLeave = pendingLeaveRes.data ?? [];
      if (pendingLeave.length > 0) {
        notifications.push({
          id: "admin_leave_pending",
          type: "leave",
          urgent: true,
          title: `${pendingLeave.length} leave request${pendingLeave.length !== 1 ? "s" : ""} pending`,
          body: "Awaiting your approval.",
          time: timeAgo(pendingLeave[0].created_at),
          href: "/org/leave",
        });
      }

      // Draft payroll runs
      for (const pr of draftPayrollRes.data ?? []) {
        notifications.push({
          id: `payroll_${pr.id}`,
          type: "payroll",
          urgent: true,
          title: `${pr.name} awaiting sign-off`,
          body: "Draft payroll is ready for review and approval.",
          time: timeAgo(pr.created_at),
          href: "/payroll",
        });
      }

      // New applications in the last 7 days
      const openJobIds = (openJobsRes.data ?? []).map((j) => j.id);
      if (openJobIds.length > 0) {
        const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
        const { data: newApps } = await supabase
          .from("job_applications")
          .select("id, created_at")
          .in("job_id", openJobIds)
          .gte("created_at", sevenDaysAgo)
          .order("created_at", { ascending: false })
          .limit(1);

        const newAppsCount = newApps?.length ?? 0;
        if (newAppsCount > 0) {
          const { count } = await supabase
            .from("job_applications")
            .select("*", { count: "exact", head: true })
            .in("job_id", openJobIds)
            .gte("created_at", sevenDaysAgo);

          const total = count ?? newAppsCount;
          notifications.push({
            id: "admin_new_applications",
            type: "recruiting",
            title: `${total} new application${total !== 1 ? "s" : ""}`,
            body: "Received in the last 7 days across open roles.",
            time: timeAgo(newApps![0].created_at),
            href: "/recruiting",
          });
        }
      }
    }

    // ── Employee notifications (own) ──────────────────────────────────────────
    if (employee) {
      const [myLeaveRes, myRunsRes] = await Promise.all([
        supabase
          .from("leave_requests")
          .select("id, created_at, status")
          .eq("employee_id", employee.id)
          .eq("status", "pending")
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("lifecycle_runs")
          .select("id")
          .eq("employee_id", employee.id)
          .eq("status", "in_progress"),
      ]);

      // My pending leave
      const myPendingLeave = myLeaveRes.data ?? [];
      if (myPendingLeave.length > 0) {
        notifications.push({
          id: "my_leave_pending",
          type: "leave",
          title: `${myPendingLeave.length} leave request${myPendingLeave.length !== 1 ? "s" : ""} pending`,
          body: "Your request is awaiting manager approval.",
          time: timeAgo(myPendingLeave[0].created_at),
          href: "/portal/leave",
        });
      }

      // My overdue onboarding tasks
      const myRunIds = (myRunsRes.data ?? []).map((r) => r.id);
      if (myRunIds.length > 0) {
        const now = new Date().toISOString();
        const { data: overdueTasks } = await supabase
          .from("lifecycle_tasks")
          .select("id, due_at")
          .in("run_id", myRunIds)
          .in("status", ["pending", "in_progress"])
          .not("due_at", "is", null)
          .lt("due_at", now)
          .limit(20);

        const overdueCount = overdueTasks?.length ?? 0;
        if (overdueCount > 0) {
          notifications.push({
            id: "my_tasks_overdue",
            type: "task",
            urgent: true,
            title: `${overdueCount} overdue task${overdueCount !== 1 ? "s" : ""}`,
            body: "You have onboarding tasks past their due date.",
            time: "Overdue",
            href: "/portal/onboarding",
          });
        }
      }
    }

    // Urgent items first, then preserve insertion order
    notifications.sort((a, b) => (b.urgent ? 1 : 0) - (a.urgent ? 1 : 0));

    return <NotificationPanel initialNotifications={notifications} />;
  } catch {
    return <NotificationPanel initialNotifications={[]} />;
  }
}
