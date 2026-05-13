"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Bookmark,
  BookOpen,
  CalendarDays,
  Clock,
  FileCheck2,
  FileText,
  Filter,
  Globe,
  PartyPopper,
  Search,
  Settings,
  Sparkles,
  TrendingUp,
  UserPlus,
  Users,
  Wrench,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCopilot } from "@/stores/copilot-store";

const smoothTransition =
  "transition-[background-color,border-color,box-shadow,color,transform] duration-[280ms] ease-[cubic-bezier(0.32,0.72,0,1)]";

const BRIEFS = [
  {
    title: "Your handbook was last reviewed 14 months ago",
    action: "Review now",
    href: "/tools/onboarding-checklist",
    type: "warning" as const,
  },
  {
    title: "5 community questions matching your interests",
    action: "See questions",
    href: "/community",
    type: "info" as const,
  },
  {
    title: "New article: Remote work best practices in Nigeria",
    action: "Read article",
    href: "/knowledge/remote-and-hybrid-work",
    type: "info" as const,
  },
];

const QUICK_ACTIONS = [
  { label: "Add Hire", icon: UserPlus, href: "/workspace/people" },
  { label: "Run Payroll", icon: FileCheck2, href: "/workspace/reports/compensation" },
  { label: "Leave Req", icon: CalendarDays, href: "/workspace/leave" },
  { label: "Knowledge", icon: BookOpen, href: "/knowledge" },
];

const PERSONAL_ACTIONS = [
  { label: "Generate a document", icon: FileText, href: "/tools" },
  { label: "Browse templates", icon: BookOpen, href: "/templates" },
  { label: "Explore knowledge", icon: TrendingUp, href: "/knowledge" },
  { label: "Join community", icon: Users, href: "/community" },
];

const REPORTS = [
  { slug: "headcount", label: "Headcount", description: "Growth, distribution, and net change." },
  { slug: "turnover", label: "Turnover", description: "Exits, monthly rate, and risk patterns." },
  { slug: "hiring", label: "Hiring", description: "Open-role and funnel placeholders for ATS-lite." },
  { slug: "leave", label: "Leave", description: "Utilization, approvals, and upcoming absence." },
  { slug: "demographics", label: "Demographics", description: "Tenure, employment type, and distribution." },
  { slug: "compensation", label: "Compensation", description: "Restricted compensation analytics." },
  { slug: "compliance", label: "Compliance", description: "Document and policy readiness." },
];

const ITEM_TYPE_ICONS: Record<string, typeof FileText> = {
  article: BookOpen,
  template: FileText,
  tool: Wrench,
};

type DashboardTab = "workspace" | "for-you" | "reports";

interface RecentDoc {
  id: string;
  title: string | null;
  tool_name: string;
  created_at: string;
}

interface SavedItem {
  id: string;
  item_type: "article" | "template" | "tool";
  item_slug: string;
  saved_at: string;
}

interface Profile {
  full_name: string | null;
  country: string | null;
}

interface WorkspaceDashboard {
  orgId: string;
  orgName: string;
  roles: string[];
  defaultTab: "workspace" | "for-you";
  employeeCount: number;
  activeCount: number;
  onLeaveCount: number;
  terminatedThisMonth: number;
  pendingLeaveApprovals: number;
  leaveTodayCount: number;
  leaveThisWeekCount: number;
  newHiresNext7: number;
  probationDueCount: number;
  contractsExpiringCount: number;
  headcountTrend: { label: string; count: number }[];
  departmentCounts: { department: string; count: number }[];
  activity: { id: string; label: string; at: string; type: string }[];
}

interface Props {
  profile: Profile | null;
  recentDocs: RecentDoc[];
  savedItems: SavedItem[];
  workspace: WorkspaceDashboard | null;
}

function timeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.max(0, Math.floor(diff / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

function firstName(profile: Profile | null) {
  return profile?.full_name?.split(" ")[0] ?? "there";
}

function initials(label: string) {
  return label
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function savedItemLabel(item: SavedItem): string {
  return item.item_slug
    .split("/")
    .pop()!
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function savedItemHref(item: SavedItem): string {
  if (item.item_type === "article") return `/knowledge/${item.item_slug}`;
  if (item.item_type === "template") return `/templates/${item.item_slug}`;
  return `/tools/${item.item_slug}`;
}

function barWidthClass(value: number, max: number) {
  const pct = max > 0 ? value / max : 0;
  if (pct >= 0.9) return "w-full";
  if (pct >= 0.75) return "w-4/5";
  if (pct >= 0.6) return "w-2/3";
  if (pct >= 0.45) return "w-1/2";
  if (pct >= 0.3) return "w-1/3";
  if (pct > 0) return "w-1/4";
  return "w-0";
}

function MobileMetricCard({
  label,
  value,
  helper,
  href,
  icon: Icon,
  tone = "accent",
}: {
  label: string;
  value: number | string;
  helper: string;
  href: string;
  icon: typeof Users;
  tone?: "accent" | "warning";
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center justify-between rounded-xl border border-[--border] bg-[--bg-card] p-5 shadow-sm hover:-translate-y-0.5 hover:border-[--accent] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--accent]/30",
        smoothTransition
      )}
    >
      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[--text-tertiary]">{label}</p>
        <h3 className="text-3xl font-semibold leading-tight tracking-normal text-[--text-primary]">{value}</h3>
        <div className="mt-2 flex items-center gap-1.5">
          <TrendingUp aria-hidden="true" size={15} className={tone === "warning" ? "text-amber-600 dark:text-amber-300" : "text-[--accent]"} />
          <span className={cn("text-xs font-semibold", tone === "warning" ? "text-amber-600 dark:text-amber-300" : "text-[--accent]")}>{helper}</span>
        </div>
      </div>
      <div className={cn("flex size-12 shrink-0 items-center justify-center rounded-full", tone === "warning" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" : "bg-[--accent-soft] text-[--accent]")}>
        <Icon aria-hidden="true" size={22} />
      </div>
    </Link>
  );
}

function Sparkline({ data }: { data: { label: string; count: number }[] }) {
  const max = Math.max(1, ...data.map((item) => item.count));
  const points = data
    .map((item, index) => {
      const x = data.length <= 1 ? 0 : (index / (data.length - 1)) * 100;
      const y = 36 - (item.count / max) * 30;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg className="h-10 w-20 text-[--accent]" viewBox="0 0 100 40" aria-label="12 month headcount trend">
      <polyline points={points} className="fill-none stroke-current stroke-[3]" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function WorkspaceTab({ workspace, profile }: { workspace: WorkspaceDashboard; profile: Profile | null }) {
  const roleLabel = useMemo(() => {
    if (workspace.roles.includes("finance")) return "Finance view";
    if (workspace.roles.includes("people_manager") && !workspace.roles.includes("hr_admin")) return "Team view";
    if (workspace.roles.includes("employee") && workspace.roles.length === 1) return "Employee view";
    return "Workspace view";
  }, [workspace.roles]);

  const maxDepartment = Math.max(1, ...workspace.departmentCounts.map((item) => item.count));
  const priorityCount = workspace.pendingLeaveApprovals + workspace.probationDueCount;
  const activityPreview = workspace.activity.slice(0, 2);

  return (
    <div className="mx-auto max-w-md space-y-6 pb-24 lg:max-w-none lg:pb-0">
      <section className="lg:hidden">
        <h1 className="text-2xl font-semibold tracking-normal text-[--text-primary]">Hello, {firstName(profile)}</h1>
        <p className="mt-1 text-sm text-[--text-tertiary]">Workspace: {workspace.orgName}</p>
      </section>

      <section className="hidden rounded-2xl border border-[--border] bg-[--bg-card] p-6 shadow-sm lg:flex lg:items-end lg:justify-between">
        <div>
          <Badge variant="ghost" className="mb-3 rounded-full bg-[--accent-soft] px-3 text-[--accent]">
            {roleLabel}
          </Badge>
          <h1 className="text-4xl font-semibold tracking-normal text-[--text-primary]">{workspace.orgName}</h1>
          <p className="mt-2 max-w-2xl text-sm text-[--text-secondary]">Operational HR work, workforce movement, and reports in one place.</p>
        </div>
        <div className="grid grid-cols-3 gap-2 rounded-2xl bg-[--bg-hover] p-2 text-center">
          {[
            ["People", workspace.employeeCount, "text-[--text-primary]"],
            ["Active", workspace.activeCount, "text-emerald-600 dark:text-emerald-300"],
            ["On Leave", workspace.onLeaveCount, "text-amber-600 dark:text-amber-300"],
          ].map(([label, value, className]) => (
            <div key={label} className="rounded-xl bg-[--bg-card] px-3 py-2">
              <p className={cn("text-lg font-semibold", className)}>{value}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[--text-tertiary]">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <MobileMetricCard
          label="Active employees"
          value={workspace.activeCount}
          helper={`${workspace.employeeCount} total people`}
          href="/workspace/people"
          icon={Users}
        />
        <MobileMetricCard
          label="Pending approvals"
          value={workspace.pendingLeaveApprovals}
          helper={`${priorityCount} priority item${priorityCount === 1 ? "" : "s"}`}
          href="/workspace/approvals"
          icon={FileCheck2}
          tone="warning"
        />
        <MobileMetricCard
          label="Leave today"
          value={workspace.leaveTodayCount}
          helper={`${workspace.leaveThisWeekCount} this week`}
          href="/workspace/leave"
          icon={CalendarDays}
        />
        <MobileMetricCard
          label="Contracts"
          value={workspace.contractsExpiringCount}
          helper="Expiring in 60 days"
          href="/workspace/reports/compliance"
          icon={FileText}
          tone="warning"
        />
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-[--text-primary]">Quick Actions</h2>
          <Link href="/workspace" className="text-sm font-semibold text-[--accent] hover:underline">
            View all
          </Link>
        </div>
        <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className={cn(
                "flex w-32 shrink-0 flex-col items-center gap-3 rounded-xl border border-[--border] bg-[--bg-card] p-4 text-center hover:-translate-y-0.5 hover:border-[--accent] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--accent]/30",
                smoothTransition
              )}
            >
              <span className="flex size-10 items-center justify-center rounded-lg bg-[--accent-soft] text-[--accent]">
                <action.icon aria-hidden="true" size={20} />
              </span>
              <span className="text-xs font-semibold text-[--text-primary]">{action.label}</span>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.9fr)]">
        <section className="rounded-xl border border-[--border] bg-[--bg-card] p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-[--text-primary]">Workforce at a glance</h2>
            <Sparkline data={workspace.headcountTrend} />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["New hires", `${workspace.newHiresNext7}`, "Next 7 days"],
              ["Probation", `${workspace.probationDueCount}`, "Due this week"],
              ["Turnover", `${workspace.terminatedThisMonth}`, "This month"],
              ["On leave", `${workspace.onLeaveCount}`, "Current"],
            ].map(([label, value, helper]) => (
              <div key={label} className="rounded-xl bg-[--bg-input] p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-[--text-tertiary]">{label}</p>
                <p className="mt-2 text-2xl font-semibold text-[--text-primary]">{value}</p>
                <p className="mt-1 text-xs text-[--text-secondary]">{helper}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[--text-primary]">Headcount by department</h3>
              <BarChart3 aria-hidden="true" size={18} className="text-[--accent]" />
            </div>
            {workspace.departmentCounts.length === 0 ? (
              <p className="rounded-xl border border-dashed border-[--border] p-4 text-sm text-[--text-tertiary]">No departments assigned yet.</p>
            ) : (
              workspace.departmentCounts.slice(0, 5).map((item) => (
                <Link key={item.department} href="/workspace/reports/headcount" className="block">
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-[--text-secondary]">{item.department}</span>
                    <span className="font-semibold text-[--text-primary]">{item.count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[--bg-hover]">
                    <div className={`h-full rounded-full bg-[--accent] ${barWidthClass(item.count, maxDepartment)}`} />
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-[--text-primary]">Recent activity</h2>
            <Button variant="ghost" size="icon-sm" className="text-[--text-tertiary]" aria-label="Filter activity">
              <Filter aria-hidden="true" size={16} />
            </Button>
          </div>
          <div className="space-y-3">
            {activityPreview.length === 0 ? (
              <p className="rounded-xl border border-dashed border-[--border] bg-[--bg-card] p-5 text-sm text-[--text-tertiary]">No workspace activity yet.</p>
            ) : (
              activityPreview.map((item) => {
                const Icon = item.type === "leave" ? CalendarDays : PartyPopper;
                return (
                  <Link
                    key={`${item.type}-${item.id}`}
                    href={item.type === "leave" ? "/workspace/leave" : "/workspace/people"}
                    className={cn(
                      "flex items-center justify-between rounded-xl border border-[--border] bg-[--bg-card] p-4 hover:border-[--accent] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--accent]/30",
                      smoothTransition
                    )}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar size="lg">
                        <AvatarFallback className="bg-[--accent-soft] text-[--accent]">
                          {item.type === "leave" ? <Icon aria-hidden="true" size={18} /> : initials(item.label)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[--text-primary]">{item.label}</p>
                        <p className="text-xs text-[--text-tertiary]">{timeAgo(item.at)}</p>
                      </div>
                    </div>
                    <Icon aria-hidden="true" size={20} className="shrink-0 text-[--accent]" />
                  </Link>
                );
              })
            )}
          </div>
          <div className="mt-4 rounded-xl bg-[--accent-soft] p-4">
            <div className="mb-2 flex items-center gap-2 text-[--accent]">
              <PartyPopper aria-hidden="true" size={17} />
              <p className="text-sm font-bold">Pro Tip</p>
            </div>
            <p className="text-xs leading-5 text-[--text-secondary]">Automate probation and contract reminders from workspace settings to reduce manual follow-ups.</p>
          </div>
        </section>
      </div>
    </div>
  );
}

function ReportsTab({ workspace }: { workspace: WorkspaceDashboard | null }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-normal text-[--text-primary]">Reports</h1>
        <p className="mt-1 text-sm text-[--text-secondary]">Pre-built workforce reports with filters, exports, scheduling, and Atlas insights.</p>
      </div>
      {!workspace ? (
        <div className="rounded-xl border border-dashed border-[--border] p-8 text-center">
          <p className="text-sm text-[--text-secondary]">Create a workspace to unlock operational reports.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {REPORTS.map((report) => (
            <Link key={report.slug} href={`/workspace/reports/${report.slug}`} className={cn("rounded-xl border border-[--border] bg-[--bg-card] p-5 hover:border-[--accent] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--accent]/30", smoothTransition)}>
              <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-[--accent-soft] text-[--accent]">
                <BarChart3 aria-hidden="true" size={18} />
              </div>
              <h2 className="font-semibold text-[--text-primary]">{report.label}</h2>
              <p className="mt-1 text-sm leading-6 text-[--text-secondary]">{report.description}</p>
              <span className="mt-4 flex items-center gap-1 text-sm font-medium text-[--accent]">
                Open report <ArrowRight aria-hidden="true" size={13} />
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function ForYouTab({ profile, recentDocs, savedItems }: Pick<Props, "profile" | "recentDocs" | "savedItems">) {
  const { open: openCopilot } = useCopilot();
  const greeting = `${timeGreeting()}${profile?.full_name ? `, ${firstName(profile)}` : ""}`;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-normal text-[--text-primary]">{greeting}</h1>
          <p className="mt-1 text-[--text-secondary]">Here&apos;s your HR brief for today.</p>
        </div>
        <Button type="button" onClick={openCopilot} className="w-fit shrink-0 rounded-xl">
          <Sparkles aria-hidden="true" size={15} />
          Ask Atlas
        </Button>
      </div>

      {profile?.country && (
        <div className="flex items-center gap-4 rounded-xl border border-[--border] bg-[--bg-card] p-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[--accent-soft]">
            <Globe aria-hidden="true" size={18} className="text-[--accent]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-[--text-primary]">Latest in HR for {profile.country}</p>
            <p className="mt-0.5 text-xs text-[--text-tertiary]">Country-specific articles, laws and updates tailored to your region.</p>
          </div>
          <Link href={`/knowledge?country=${encodeURIComponent(profile.country)}`} className="flex shrink-0 items-center gap-1 text-xs font-medium text-[--accent] hover:underline">
            Explore <ArrowRight aria-hidden="true" size={11} />
          </Link>
        </div>
      )}

      <div>
        <h2 className="mb-4 text-lg font-semibold text-[--text-primary]">Today&apos;s HR brief</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {BRIEFS.map((brief) => (
            <div key={brief.title} className={cn("rounded-xl border p-4", brief.type === "warning" ? "border-amber-300 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-900/20" : "border-[--border] bg-[--bg-card]")}>
              <p className="text-sm font-medium leading-snug text-[--text-primary]">{brief.title}</p>
              <Link href={brief.href} className="mt-3 flex items-center gap-1 text-xs font-medium text-[--accent] hover:underline">
                {brief.action} <ArrowRight aria-hidden="true" size={11} />
              </Link>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold text-[--text-primary]">Quick actions</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {PERSONAL_ACTIONS.map((action) => (
            <Link key={action.label} href={action.href} className={cn("group flex flex-col items-center gap-2 rounded-xl border border-[--border] bg-[--bg-card] p-4 text-center hover:border-[--accent] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--accent]/30", smoothTransition)}>
              <div className="flex size-10 items-center justify-center rounded-xl bg-[--accent-soft] group-hover:bg-[--accent]">
                <action.icon aria-hidden="true" size={18} className="text-[--accent] group-hover:text-[--primary-foreground]" />
              </div>
              <span className="text-xs font-medium text-[--text-secondary] group-hover:text-[--text-primary]">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[--text-primary]">Recent documents</h2>
          <Link href="/dashboard/documents" className="text-sm text-[--accent] hover:underline">View all</Link>
        </div>
        <div className="space-y-2">
          {recentDocs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[--border] p-6 text-center">
              <p className="text-sm text-[--text-tertiary]">
                No documents yet. <Link href="/tools" className="text-[--accent] hover:underline">Generate your first one</Link>.
              </p>
            </div>
          ) : (
            recentDocs.map((doc) => (
              <Link key={doc.id} href={`/dashboard/documents/${doc.id}`} className={cn("flex items-center gap-4 rounded-xl border border-[--border] bg-[--bg-card] p-4 hover:border-[--accent]", smoothTransition)}>
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[--accent-soft]">
                  <FileText aria-hidden="true" size={16} className="text-[--accent]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[--text-primary]">{doc.title ?? "Untitled Document"}</p>
                  <p className="text-xs text-[--text-tertiary]">{doc.tool_name}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1 text-xs text-[--text-tertiary]">
                  <Clock aria-hidden="true" size={11} />
                  {timeAgo(doc.created_at)}
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      {savedItems.length > 0 && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[--text-primary]">Saved items</h2>
            <Link href="/dashboard/library" className="text-sm text-[--accent] hover:underline">View library</Link>
          </div>
          <div className="space-y-2">
            {savedItems.map((item) => {
              const Icon = ITEM_TYPE_ICONS[item.item_type] ?? Bookmark;
              return (
                <Link key={item.id} href={savedItemHref(item)} className={cn("flex items-center gap-4 rounded-xl border border-[--border] bg-[--bg-card] p-4 hover:border-[--accent]", smoothTransition)}>
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[--accent-soft]">
                    <Icon aria-hidden="true" size={16} className="text-[--accent]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium capitalize text-[--text-primary]">{savedItemLabel(item)}</p>
                    <p className="text-xs capitalize text-[--text-tertiary]">{item.item_type}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1 text-xs text-[--text-tertiary]">
                    <Clock aria-hidden="true" size={11} />
                    {timeAgo(item.saved_at)}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function DashboardClient({ profile, recentDocs, savedItems, workspace }: Props) {
  const [activeTab, setActiveTab] = useState<DashboardTab>(workspace?.defaultTab ?? "for-you");
  const tabs: { key: DashboardTab; label: string; disabled?: boolean; icon: typeof Users }[] = [
    { key: "workspace", label: "Workspace", disabled: !workspace, icon: Users },
    { key: "for-you", label: "For you", icon: Sparkles },
    { key: "reports", label: "Reports", disabled: !workspace, icon: BarChart3 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 lg:hidden">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-xl bg-[--accent] text-[--primary-foreground]">
            <Users aria-hidden="true" size={17} />
          </div>
          <span className="text-lg font-bold text-[--accent]">Atlas HR</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-lg" aria-label="Search dashboard">
            <Search aria-hidden="true" size={18} />
          </Button>
          <Button variant="ghost" size="icon-lg" aria-label="Dashboard settings">
            <Settings aria-hidden="true" size={18} />
          </Button>
        </div>
      </div>

      <div className="flex w-fit gap-1 rounded-xl border border-[--border] bg-[--bg-card] p-1">
        {tabs.map((tab) => (
          <Button
            key={tab.key}
            type="button"
            disabled={tab.disabled}
            onClick={() => setActiveTab(tab.key)}
            variant={activeTab === tab.key ? "default" : "ghost"}
            className={cn("rounded-xl px-3", activeTab !== tab.key && "text-[--text-secondary] hover:bg-[--bg-hover]")}
          >
            <tab.icon aria-hidden="true" size={14} />
            {tab.label}
          </Button>
        ))}
      </div>

      {activeTab === "workspace" && workspace ? <WorkspaceTab workspace={workspace} profile={profile} /> : null}
      {activeTab === "for-you" ? <ForYouTab profile={profile} recentDocs={recentDocs} savedItems={savedItems} /> : null}
      {activeTab === "reports" ? <ReportsTab workspace={workspace} /> : null}
    </div>
  );
}
