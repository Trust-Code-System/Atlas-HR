"use client";

import { useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Edit2,
  FileText,
  FileUp,
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  NotebookPen,
  Phone,
  Save,
  Send,
  ShieldCheck,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";
import { Avatar, AvatarBadge, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { sendEmployeePortalInvite, updateEmployee, updateEmployeeNotes } from "../actions";
import { requestAcknowledgment, sendDocumentReminder, uploadEmployeeComplianceDocument } from "@/app/(app)/workspace/compliance/actions";
import type { Employee, LeaveRequest } from "@/types/database";

const STATUS_OPTIONS: { value: Employee["status"]; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "on_leave", label: "On Leave" },
  { value: "terminated", label: "Terminated" },
];

const LEAVE_STATUS_COLORS: Record<LeaveRequest["status"], string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  rejected: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300",
  cancelled: "bg-[--bg-hover] text-[--text-tertiary]",
};

type DirectReport = Pick<Employee, "id" | "full_name" | "job_title">;
type DocumentStatus = {
  employee_id: string;
  doc_type: string;
  status: "missing" | "submitted" | "expired" | "expiring_soon" | "approved";
  current_document_id: string | null;
  last_checked_at: string | null;
};
type DocumentRequirement = {
  doc_type: string;
  display_name: string;
  description: string | null;
  expiry_required: boolean | null;
  expiry_warning_days: number | null;
  legal_basis: string | null;
  knowledge_article_slug: string | null;
};
type EmployeeDocumentRow = {
  id: string;
  doc_type: string;
  file_name: string;
  file_url: string;
  expires_at: string | null;
  created_at: string;
};
type AcknowledgmentRow = {
  id: string;
  document_type: string;
  document_version: string;
  acknowledged_at: string;
};

interface Props {
  employee: Employee;
  managerName: string | null;
  directReports: DirectReport[];
  leaveRequests: LeaveRequest[];
  documentStatuses: DocumentStatus[];
  documentRequirements: DocumentRequirement[];
  documents: EmployeeDocumentRow[];
  acknowledgments: AcknowledgmentRow[];
  isAdmin: boolean;
}

type Tab = "overview" | "compliance" | "documents" | "leave" | "notes";

const DOC_STATUS_STYLES: Record<DocumentStatus["status"], string> = {
  missing: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300",
  expired: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300",
  expiring_soon: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  submitted: "bg-[--accent-soft] text-[--accent]",
  approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
};

const DOC_STATUS_ICONS: Record<DocumentStatus["status"], typeof AlertTriangle> = {
  missing: AlertTriangle,
  expired: AlertTriangle,
  expiring_soon: AlertTriangle,
  submitted: FileText,
  approved: CheckCircle2,
};

const smoothTransition =
  "transition-[background-color,border-color,box-shadow,color,transform] duration-[280ms] ease-[cubic-bezier(0.32,0.72,0,1)]";

function knowledgeHref(slug: string) {
  const countryMap: Record<string, string> = {
    nigeria: "nigeria",
    "united-states": "united-states",
    "united-kingdom": "united-kingdom",
    india: "india",
  };
  return countryMap[slug] ? `/knowledge/country/${countryMap[slug]}` : "/knowledge";
}

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatDate(date: string | null | undefined, options?: Intl.DateTimeFormatOptions) {
  if (!date) return "Not set";
  return new Date(date).toLocaleDateString("en-US", options ?? { month: "long", day: "numeric", year: "numeric" });
}

function titleCase(value: string | null | undefined) {
  if (!value) return "Not set";
  return value
    .replace(/_/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatCurrency(employee: Employee) {
  if (!employee.salary) return "Not set";
  return `${employee.salary_currency} ${employee.salary.toLocaleString()}`;
}

function daysUntil(date: string | null) {
  if (!date) return "Not scheduled";
  const start = new Date(date);
  const next = new Date();
  next.setMonth(start.getMonth(), start.getDate());
  if (next < new Date()) next.setFullYear(next.getFullYear() + 1);
  const diff = Math.ceil((next.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return diff === 0 ? "Today" : `In ${diff} days`;
}

function tenure(date: string | null) {
  if (!date) return "—";
  const start = new Date(date);
  const now = new Date();
  let years = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();
  if (now.getDate() < start.getDate()) months -= 1;
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  if (years <= 0 && months <= 0) return "New hire";
  if (years <= 0) return `${months}m`;
  if (months <= 0) return `${years}y`;
  return `${years}y ${months}m`;
}

function nextAnniversary(date: string | null) {
  if (!date) return null;
  const start = new Date(date);
  const next = new Date();
  next.setMonth(start.getMonth(), start.getDate());
  if (next < new Date()) next.setFullYear(next.getFullYear() + 1);
  return next;
}

function InfoItem({ label, value, icon: Icon }: { label: string; value: ReactNode; icon?: typeof Mail }) {
  return (
    <div className="min-w-0">
      <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[--text-tertiary]">
        {Icon && <Icon aria-hidden="true" size={13} />}
        <span>{label}</span>
      </div>
      <div className="break-words text-sm font-medium leading-6 text-[--text-primary]">{value}</div>
    </div>
  );
}

function SectionCard({
  title,
  icon: Icon,
  action,
  children,
  className,
}: {
  title: string;
  icon?: typeof ShieldCheck;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-xl border border-[--border] bg-[--bg-card] p-5 shadow-sm sm:p-6", className)}>
      <div className="mb-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <span className="flex size-9 items-center justify-center rounded-lg bg-[--accent-soft] text-[--accent]">
              <Icon aria-hidden="true" size={18} />
            </span>
          )}
          <h2 className="text-lg font-semibold tracking-normal text-[--text-primary]">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function EmployeeProfile({
  employee,
  managerName,
  directReports,
  leaveRequests,
  documentStatuses,
  documentRequirements,
  documents,
  acknowledgments,
  isAdmin,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [editNotes, setEditNotes] = useState(false);
  const [notes, setNotes] = useState(employee.notes ?? "");
  const [status, setStatus] = useState<Employee["status"]>(employee.status);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);

  function saveNotes() {
    startTransition(async () => {
      const res = await updateEmployeeNotes(employee.id, notes);
      if (res.ok) {
        setEditNotes(false);
        setFeedback("Notes saved.");
        setTimeout(() => setFeedback(null), 2000);
      }
    });
  }

  function updateStatus(newStatus: Employee["status"]) {
    setStatus(newStatus);
    startTransition(async () => {
      await updateEmployee(employee.id, { status: newStatus });
    });
  }

  function inviteToPortal() {
    startTransition(async () => {
      const res = await sendEmployeePortalInvite(employee.id);
      setFeedback(res.ok ? "Portal invite sent." : res.error);
      setTimeout(() => setFeedback(null), 3000);
    });
  }

  const openComplianceItems = documentStatuses.filter((statusRow) => statusRow.status !== "approved");
  const approvedComplianceItems = documentStatuses.length - openComplianceItems.length;
  const complianceScore = documentStatuses.length > 0 ? Math.round((approvedComplianceItems / documentStatuses.length) * 100) : 100;
  const complianceDashOffset = 263 - (263 * complianceScore) / 100;
  const requirementMap = new Map(documentRequirements.map((requirement) => [requirement.doc_type, requirement]));
  const documentsByType = new Map<string, EmployeeDocumentRow>();
  for (const document of documents) {
    if (!documentsByType.has(document.doc_type)) documentsByType.set(document.doc_type, document);
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "overview", label: "Profile" },
    { key: "compliance", label: `Compliance${openComplianceItems.length ? ` (${openComplianceItems.length})` : ""}` },
    { key: "documents", label: `Documents${documents.length ? ` (${documents.length})` : ""}` },
    { key: "leave", label: `Leave${leaveRequests.length ? ` (${leaveRequests.length})` : ""}` },
    { key: "notes", label: "Notes" },
  ];

  return (
    <div data-private className="w-full max-w-7xl">
      {feedback && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-300">
          {feedback}
        </div>
      )}

      <section className="mb-6 rounded-2xl border border-[--border] bg-[--bg-card] px-5 pb-5 pt-6 text-center shadow-sm sm:px-6">
        <div className="flex flex-col items-center gap-4">
          <Avatar className="size-24 text-xl font-bold shadow-sm ring-4 ring-[--accent-soft]" size="lg">
            <AvatarImage src={employee.photo_url ?? undefined} alt={`${employee.full_name} profile photo`} />
            <AvatarFallback className="bg-[--accent] text-[--primary-foreground]">
              {initials(employee.full_name)}
            </AvatarFallback>
            {status === "active" && (
              <AvatarBadge className="size-6 border-4 border-[--bg-card] bg-emerald-500" aria-label="Active employee" />
            )}
          </Avatar>
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-normal text-[--text-primary]">{employee.full_name}</h1>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-[--text-secondary]">
              {employee.job_title ?? "No title"}
            </p>
            <div className="mt-2 flex items-center justify-center gap-1.5 text-xs text-[--text-tertiary]">
              <MapPin aria-hidden="true" size={13} className="text-[--accent]" />
              <span>
                {employee.country ?? "Location not set"}
                {employee.department ? ` - ${employee.department}` : ""}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-2">
          <a
            href={`mailto:${employee.email ?? ""}`}
            aria-disabled={employee.email ? "false" : "true"}
            className={cn(
              "flex min-h-20 flex-col items-center justify-center rounded-xl bg-[--accent-soft] px-3 py-4 text-[--accent] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--accent]/30",
              !employee.email && "pointer-events-none opacity-50",
              smoothTransition
            )}
          >
            <Mail aria-hidden="true" size={20} />
            <span className="mt-1 text-xs font-bold">Email</span>
          </a>
          <a
            href={`tel:${employee.phone ?? ""}`}
            aria-disabled={employee.phone ? "false" : "true"}
            className={cn(
              "flex min-h-20 flex-col items-center justify-center rounded-xl bg-[--accent-soft] px-3 py-4 text-[--accent] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--accent]/30",
              !employee.phone && "pointer-events-none opacity-50",
              smoothTransition
            )}
          >
            <Phone aria-hidden="true" size={20} />
            <span className="mt-1 text-xs font-bold">Call</span>
          </a>
          <button
            type="button"
            onClick={() => setActiveTab("notes")}
            className={cn(
              "flex min-h-20 flex-col items-center justify-center rounded-xl bg-[--accent-soft] px-3 py-4 text-[--accent] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--accent]/30",
              smoothTransition
            )}
          >
            <MessageSquare aria-hidden="true" size={20} />
            <span className="mt-1 text-xs font-bold">Chat</span>
          </button>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-center">
          {isAdmin && (
            <div className="mx-auto w-full max-w-48">
              <label className="mb-1.5 block text-left text-xs font-semibold uppercase tracking-wide text-[--text-tertiary]">
                Status
              </label>
              <Select
                value={status}
                onValueChange={(value) => value && updateStatus(value as Employee["status"])}
                items={STATUS_OPTIONS}
              >
                <SelectTrigger className="h-9 w-full rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {isAdmin && employee.email && (
            <Button
              type="button"
              onClick={inviteToPortal}
              disabled={isPending}
              variant="outline"
              className={cn("h-9 rounded-xl border-[--border] text-[--text-secondary] hover:bg-[--bg-hover]", smoothTransition)}
            >
              {isPending ? <Loader2 aria-hidden="true" size={15} className="animate-spin" /> : <Send aria-hidden="true" size={15} />}
              Portal invite
            </Button>
          )}
        </div>
      </section>

      <nav className="sticky top-0 z-20 mb-4 flex gap-1 overflow-x-auto border-b border-[--border] bg-[--bg-app]/95 backdrop-blur" aria-label="Employee profile sections">
        {tabs.map(({ key, label }) => (
          <button
            type="button"
            key={key}
            onClick={() => setActiveTab(key)}
            className={cn(
              "min-h-12 shrink-0 border-b-2 px-4 text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-[--accent]/30 sm:px-6",
              activeTab === key
                ? "border-[--accent] text-[--accent]"
                : "border-transparent text-[--text-tertiary] hover:text-[--text-secondary]",
              smoothTransition
            )}
            aria-current={activeTab === key ? "page" : undefined}
          >
            {label}
          </button>
        ))}
      </nav>

      {activeTab === "overview" && (
        <div className="mx-auto max-w-md space-y-4 lg:max-w-5xl">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-[--border] bg-[--bg-card] p-5 shadow-sm">
              <span className="text-xs font-semibold uppercase tracking-wide text-[--text-tertiary]">Employee ID</span>
              <p className="mt-2 font-mono text-xl font-semibold text-[--text-primary]">#{employee.id.slice(0, 8).toUpperCase()}</p>
            </div>
            <div className="rounded-xl border border-[--border] bg-[--bg-card] p-5 shadow-sm">
              <span className="text-xs font-semibold uppercase tracking-wide text-[--text-tertiary]">Joined</span>
              <p className="mt-2 text-xl font-semibold text-[--text-primary]">
                {employee.start_date ? formatDate(employee.start_date, { month: "short", year: "numeric" }) : "Not set"}
              </p>
            </div>
          </div>

          <section className="overflow-hidden rounded-xl border border-[--border] bg-[--bg-card] shadow-sm">
            <div className="flex items-center justify-between border-b border-[--border] p-5">
              <h2 className="text-xl font-semibold text-[--text-primary]">Personal Details</h2>
              {isAdmin && (
                <button type="button" onClick={() => setActiveTab("notes")} className="text-sm font-bold text-[--accent]">
                  Edit
                </button>
              )}
            </div>
            <div className="space-y-5 p-5">
              <InfoItem label="Email address" icon={Mail} value={employee.email ?? "Not set"} />
              <InfoItem label="Phone number" icon={Phone} value={employee.phone ?? "Not set"} />
              <InfoItem label="Country / Nationality" icon={MapPin} value={employee.country ?? "Not set"} />
              <InfoItem label="Residential address" icon={MapPin} value={employee.address ?? "Not set"} />
              <InfoItem label="Emergency contact" icon={UserRoundCheck} value={employee.emergency_contact_name ?? "Not set"} />
            </div>
          </section>

          <section className="overflow-hidden rounded-xl border border-[--border] bg-[--bg-card] shadow-sm">
            <div className="flex items-center justify-between border-b border-[--border] p-5">
              <h2 className="text-xl font-semibold text-[--text-primary]">Employment Status</h2>
              <Badge className="rounded-lg bg-[--accent-soft] text-[--accent]">{titleCase(employee.employment_type)}</Badge>
            </div>
            <div className="space-y-5 p-5">
              <div className="flex items-center justify-between gap-4">
                <InfoItem label="Reporting manager" value={managerName ?? "Not set"} />
                <Avatar size="lg">
                  <AvatarFallback className="bg-[--accent-soft] text-[--accent]">
                    {initials(managerName ?? "Manager")}
                  </AvatarFallback>
                </Avatar>
              </div>
              <InfoItem label="Department" value={employee.department ?? "Not set"} />
              <InfoItem label="Tenure" value={tenure(employee.start_date)} />
              <InfoItem
                label="Next anniversary"
                value={
                  employee.start_date
                    ? `${daysUntil(employee.start_date)} - ${
                        nextAnniversary(employee.start_date)?.toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        }) ?? "Not scheduled"
                      }`
                    : "Not scheduled"
                }
              />
              <InfoItem label="Salary" value={formatCurrency(employee)} />
              <div>
                <span className="text-xs font-semibold uppercase tracking-wide text-[--text-tertiary]">Probation status</span>
                <div className="mt-2 flex items-center gap-3">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-[--bg-hover]">
                    <div className="h-full w-full rounded-full bg-emerald-500" />
                  </div>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-300">Completed</span>
                </div>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-xl border border-[--border] bg-[--bg-card] shadow-sm">
            <div className="flex items-center justify-between border-b border-[--border] p-5">
              <h2 className="text-xl font-semibold text-[--text-primary]">Recent Documents</h2>
              <button
                type="button"
                onClick={() => setActiveTab("documents")}
                aria-label="View all employee documents"
                className="rounded-lg p-1 text-[--text-secondary] hover:bg-[--bg-hover] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--accent]/30"
              >
                <ArrowRight aria-hidden="true" size={18} />
              </button>
            </div>
            <div className="divide-y divide-[--border]">
              {documents.length === 0 ? (
                <p className="p-5 text-sm text-[--text-tertiary]">No employee documents have been uploaded yet.</p>
              ) : (
                documents.slice(0, 2).map((document) => (
                  <a key={document.id} href={`/api/employee-documents/${document.id}`} className="flex items-center gap-4 p-5 hover:bg-[--bg-hover]">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[--accent-soft] text-[--accent]">
                      <FileText aria-hidden="true" size={18} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-[--text-primary]">{document.file_name}</span>
                      <span className="block text-xs text-[--text-tertiary]">
                        Modified {formatDate(document.created_at, { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    </span>
                  </a>
                ))
              )}
            </div>
          </section>

          <section className="rounded-xl border border-[--border] bg-[--bg-card] p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-[--text-primary]">Compliance Score</h2>
                <p className="mt-1 text-sm text-[--text-secondary]">
                  {openComplianceItems.length === 0 ? "All requirements approved" : `${openComplianceItems.length} need attention`}
                </p>
              </div>
              <div className="relative flex size-20 shrink-0 items-center justify-center">
                <svg className="size-full -rotate-90" viewBox="0 0 96 96" aria-hidden="true">
                  <circle className="text-[--bg-hover]" cx="48" cy="48" fill="transparent" r="42" stroke="currentColor" strokeWidth="8" />
                  <circle
                    className={complianceScore >= 80 ? "text-emerald-500" : "text-amber-500"}
                    cx="48"
                    cy="48"
                    fill="transparent"
                    r="42"
                    stroke="currentColor"
                    strokeDasharray="263"
                    strokeDashoffset={complianceDashOffset}
                    strokeLinecap="round"
                    strokeWidth="8"
                  />
                </svg>
                <span className="absolute text-lg font-semibold text-[--text-primary]">{complianceScore}%</span>
              </div>
            </div>
          </section>

          {directReports.length > 0 && (
            <SectionCard title="Direct Reports" icon={UsersRound} className="lg:col-span-2">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {directReports.map((report) => (
                  <Link
                    key={report.id}
                    href={`/workspace/people/${report.id}`}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border border-[--border] bg-[--bg-input] p-3 text-sm text-[--text-secondary] hover:border-[--accent] hover:text-[--accent] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--accent]/30",
                      smoothTransition
                    )}
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[--accent] text-xs font-bold text-[--primary-foreground]">
                      {initials(report.full_name)}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-[--text-primary]">{report.full_name}</span>
                      <span className="block truncate text-xs text-[--text-tertiary]">{report.job_title ?? "No title"}</span>
                    </span>
                  </Link>
                ))}
              </div>
            </SectionCard>
          )}
        </div>
      )}

      {activeTab === "compliance" && (
        <div className="space-y-6">
          <SectionCard title="Required Documents" icon={ShieldCheck}>
            <p className="-mt-3 mb-5 text-sm leading-6 text-[--text-secondary]">
              Each requirement links back to Atlas HR knowledge where available.
            </p>
            <div className="space-y-4">
              {documentStatuses.length === 0 ? (
                <div className="rounded-xl border border-[--border] bg-[--bg-input] px-5 py-8 text-sm text-[--text-tertiary]">
                  No compliance requirements have been computed yet.
                </div>
              ) : (
                documentStatuses.map((statusRow) => {
                  const requirement = requirementMap.get(statusRow.doc_type);
                  const document = documentsByType.get(statusRow.doc_type);
                  const Icon = DOC_STATUS_ICONS[statusRow.status];
                  return (
                    <article key={statusRow.doc_type} className="rounded-xl border border-[--border] bg-[--bg-input] p-4 sm:p-5">
                      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <Icon aria-hidden="true" size={17} className={statusRow.status === "approved" ? "text-emerald-600 dark:text-emerald-300" : "text-amber-600 dark:text-amber-300"} />
                            <h3 className="font-semibold text-[--text-primary]">{requirement?.display_name ?? titleCase(statusRow.doc_type)}</h3>
                            <Badge className={cn("capitalize", DOC_STATUS_STYLES[statusRow.status])}>{statusRow.status.replace(/_/g, " ")}</Badge>
                          </div>
                          {requirement?.description && <p className="mt-2 text-sm leading-6 text-[--text-secondary]">{requirement.description}</p>}
                          {requirement?.legal_basis && <p className="mt-2 text-xs leading-5 text-[--text-tertiary]">{requirement.legal_basis}</p>}
                          {requirement?.knowledge_article_slug && (
                            <a href={knowledgeHref(requirement.knowledge_article_slug)} className="mt-2 inline-flex text-xs font-semibold text-[--accent] hover:underline">
                              Learn more
                            </a>
                          )}
                          {document && (
                            <p className="mt-3 text-xs text-[--text-tertiary]">
                              Current:{" "}
                              <a href={`/api/employee-documents/${document.id}`} className="font-semibold text-[--accent] hover:underline">
                                {document.file_name}
                              </a>
                              {document.expires_at ? ` - Expires ${formatDate(document.expires_at)}` : ""}
                            </p>
                          )}
                        </div>
                        {isAdmin && (
                          <form action={sendDocumentReminder}>
                            <input type="hidden" name="employee_id" value={employee.id} />
                            <input type="hidden" name="doc_type" value={statusRow.doc_type} />
                            <Button type="submit" variant="outline" className={cn("rounded-xl border-[--border] text-[--text-secondary] hover:bg-[--bg-hover]", smoothTransition)}>
                              <Send aria-hidden="true" size={13} /> Request
                            </Button>
                          </form>
                        )}
                      </div>
                      {isAdmin && (
                        <form action={uploadEmployeeComplianceDocument} className="mt-4 grid gap-3 border-t border-[--border] pt-4 md:grid-cols-[minmax(0,1fr)_160px_120px]">
                          <input type="hidden" name="employee_id" value={employee.id} />
                          <input type="hidden" name="doc_type" value={statusRow.doc_type} />
                          <label className="block">
                            <span className="mb-1.5 block text-xs font-semibold text-[--text-secondary]">Upload file</span>
                            <input
                              type="file"
                              name="file"
                              accept=".pdf,image/jpeg,image/png"
                              className="w-full rounded-lg border border-[--border] bg-[--bg-card] px-3 py-2 text-xs text-[--text-secondary] outline-none focus-visible:border-[--accent] focus-visible:ring-2 focus-visible:ring-[--accent]/30"
                            />
                          </label>
                          <label className="block">
                            <span className="mb-1.5 block text-xs font-semibold text-[--text-secondary]">Expiry date</span>
                            <input
                              type="date"
                              name="expires_at"
                              className="w-full rounded-lg border border-[--border] bg-[--bg-card] px-3 py-2 text-xs text-[--text-secondary] outline-none focus-visible:border-[--accent] focus-visible:ring-2 focus-visible:ring-[--accent]/30"
                            />
                          </label>
                          <div className="flex items-end">
                            <Button type="submit" className={cn("w-full rounded-xl bg-[--accent] text-[--primary-foreground] hover:bg-[--accent-hover]", smoothTransition)}>
                              <FileUp aria-hidden="true" size={13} /> Upload
                            </Button>
                          </div>
                        </form>
                      )}
                    </article>
                  );
                })
              )}
            </div>
          </SectionCard>
        </div>
      )}

      {activeTab === "documents" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <SectionCard title="Employee Documents" icon={FileText}>
            <div className="space-y-3">
              {documents.length === 0 ? (
                <p className="rounded-xl border border-[--border] bg-[--bg-input] p-5 text-sm text-[--text-tertiary]">No employee documents have been uploaded yet.</p>
              ) : (
                documents.map((document) => (
                  <a
                    key={document.id}
                    href={`/api/employee-documents/${document.id}`}
                    className={cn(
                      "block rounded-xl border border-[--border] bg-[--bg-input] p-4 hover:border-[--accent] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--accent]/30",
                      smoothTransition
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[--text-primary]">{document.file_name}</p>
                        <p className="mt-1 text-xs capitalize text-[--text-tertiary]">{document.doc_type.replace(/_/g, " ")}</p>
                      </div>
                      <Badge variant="outline" className="shrink-0 border-[--border] text-[--text-secondary]">
                        {formatDate(document.created_at, { month: "short", day: "numeric" })}
                      </Badge>
                    </div>
                    {document.expires_at && <p className="mt-3 text-xs text-amber-600 dark:text-amber-300">Expires {formatDate(document.expires_at)}</p>}
                  </a>
                ))
              )}
            </div>
          </SectionCard>

          <SectionCard title="Acknowledgments" icon={CheckCircle2}>
            <div className="space-y-3">
              {acknowledgments.length === 0 ? (
                <p className="rounded-xl border border-[--border] bg-[--bg-input] p-5 text-sm text-[--text-tertiary]">No policy acknowledgments recorded yet.</p>
              ) : (
                acknowledgments.map((ack) => (
                  <div key={ack.id} className="rounded-xl border border-[--border] bg-[--bg-input] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold capitalize text-[--text-primary]">{ack.document_type.replace(/_/g, " ")}</p>
                        <p className="mt-1 text-xs text-[--text-tertiary]">Version {ack.document_version}</p>
                      </div>
                      <p className="text-xs text-[--text-tertiary]">{formatDate(ack.acknowledged_at, { month: "short", day: "numeric", year: "numeric" })}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            {isAdmin && (
              <>
                <Separator className="my-5" />
                <form action={requestAcknowledgment} className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                  <input type="hidden" name="employee_id" value={employee.id} />
                  <label>
                    <span className="mb-1.5 block text-xs font-semibold text-[--text-secondary]">Document type</span>
                    <input
                      name="document_type"
                      placeholder="handbook"
                      className="h-10 w-full rounded-lg border border-[--border] bg-[--bg-input] px-3 text-sm text-[--text-primary] outline-none placeholder:text-[--text-tertiary] focus-visible:border-[--accent] focus-visible:ring-2 focus-visible:ring-[--accent]/30"
                    />
                  </label>
                  <div className="flex items-end">
                    <Button type="submit" variant="outline" className={cn("h-10 rounded-xl border-[--border] text-[--text-secondary] hover:bg-[--bg-hover]", smoothTransition)}>
                      Send request
                    </Button>
                  </div>
                </form>
              </>
            )}
          </SectionCard>
        </div>
      )}

      {activeTab === "leave" && (
        <SectionCard title="Leave History" icon={CalendarDays}>
          {leaveRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-[--border] bg-[--bg-input] py-12 text-center">
              <p className="font-semibold text-[--text-primary]">No leave requests</p>
              <p className="max-w-md text-sm leading-6 text-[--text-secondary]">Leave requests submitted for this employee will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-[--border]">
              <table className="w-full min-w-[720px]">
                <thead>
                  <tr className="border-b border-[--border] bg-[--bg-input]">
                    {["Type", "From", "To", "Reason", "Status"].map((col) => (
                      <th key={col} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[--text-tertiary]">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[--border]">
                  {leaveRequests.map((leaveRequest) => (
                    <tr key={leaveRequest.id} className={cn("hover:bg-[--bg-hover]", smoothTransition)}>
                      <td className="px-4 py-3 text-sm font-medium capitalize text-[--text-primary]">{leaveRequest.leave_type}</td>
                      <td className="px-4 py-3 text-sm text-[--text-secondary]">{formatDate(leaveRequest.start_date, { month: "short", day: "numeric", year: "numeric" })}</td>
                      <td className="px-4 py-3 text-sm text-[--text-secondary]">{formatDate(leaveRequest.end_date, { month: "short", day: "numeric", year: "numeric" })}</td>
                      <td className="max-w-[240px] truncate px-4 py-3 text-sm text-[--text-secondary]">{leaveRequest.reason ?? "Not provided"}</td>
                      <td className="px-4 py-3">
                        <Badge className={cn("capitalize", LEAVE_STATUS_COLORS[leaveRequest.status])}>{leaveRequest.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      )}

      {activeTab === "notes" && (
        <SectionCard title="Private Notes" icon={NotebookPen}>
          {!isAdmin ? (
            <p className="whitespace-pre-wrap rounded-xl border border-[--border] bg-[--bg-input] p-5 text-sm leading-6 text-[--text-secondary]">{notes || "No notes."}</p>
          ) : editNotes ? (
            <>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-[--text-primary]">Notes</span>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={8}
                  placeholder="Add private notes about this employee..."
                  className="min-h-48 resize-none border-[--border] bg-[--bg-input] text-[--text-primary] focus-visible:border-[--accent] focus-visible:ring-[--accent]/30"
                />
              </label>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button type="button" onClick={saveNotes} disabled={isPending} className={cn("rounded-xl bg-[--accent] text-[--primary-foreground] hover:bg-[--accent-hover]", smoothTransition)}>
                  {isPending && <Loader2 aria-hidden="true" size={13} className="animate-spin" />}
                  <Save aria-hidden="true" size={13} /> Save notes
                </Button>
                <Button type="button" variant="outline" onClick={() => setEditNotes(false)} className={cn("rounded-xl border-[--border] text-[--text-secondary] hover:bg-[--bg-hover]", smoothTransition)}>
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="min-h-24 whitespace-pre-wrap rounded-xl border border-[--border] bg-[--bg-input] p-5 text-sm leading-6 text-[--text-secondary]">{notes || "No notes yet."}</p>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditNotes(true)}
                className={cn("mt-4 rounded-xl border-[--border] text-[--text-secondary] hover:bg-[--bg-hover]", smoothTransition)}
              >
                <Edit2 aria-hidden="true" size={13} /> Edit notes
              </Button>
            </>
          )}
        </SectionCard>
      )}
    </div>
  );
}
