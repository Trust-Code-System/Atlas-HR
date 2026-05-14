"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  BriefcaseBusiness,
  CalendarDays,
  ChevronDown,
  Grid3X3,
  List,
  Loader2,
  MapPin,
  MoreVertical,
  PartyPopper,
  Search,
  SlidersHorizontal,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createEmployee, deleteEmployee } from "./actions";
import type { Employee } from "@/types/database";

const DEPARTMENTS = ["Engineering", "Product", "Design", "Sales", "Marketing", "People", "Finance", "Operations", "Legal", "Other"];
const EMPLOYMENT_TYPES = [
  { value: "full_time", label: "Full Time" },
  { value: "part_time", label: "Part Time" },
  { value: "contract", label: "Contract" },
  { value: "intern", label: "Intern" },
];

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function statusBadge(status: Employee["status"]) {
  const map = {
    active: "bg-success/10 text-success",
    on_leave: "bg-warning/10 text-warning",
    terminated: "bg-danger/10 text-danger",
  };
  const label = { active: "Active", on_leave: "On Leave", terminated: "Terminated" };
  const dot = {
    active: "bg-success",
    on_leave: "bg-warning",
    terminated: "bg-danger",
  };

  return (
    <Badge variant="ghost" className={`h-6 rounded-lg px-2.5 ${map[status]}`}>
      <span className={`size-1.5 rounded-full ${dot[status]}`} />
      {label[status]}
    </Badge>
  );
}

function formatDate(date: string | null) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

interface Props {
  employees: Employee[];
  isAdmin: boolean;
  orgId: string;
}

export function PeopleClient({ employees, isAdmin }: Props) {
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filtered = employees.filter((e) =>
    e.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (e.job_title ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (e.department ?? "").toLowerCase().includes(search.toLowerCase())
  );
  const activeCount = employees.filter((employee) => employee.status === "active").length;
  const onLeaveCount = employees.filter((employee) => employee.status === "on_leave").length;
  const departmentCount = new Set(employees.map((employee) => employee.department).filter(Boolean)).size;
  const countries = employees.reduce<Record<string, number>>((acc, employee) => {
    if (!employee.country) return acc;
    acc[employee.country] = (acc[employee.country] ?? 0) + 1;
    return acc;
  }, {});
  const topHub = Object.entries(countries).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "No hub yet";

  function confirmDelete() {
    if (!deleteTarget || isDeleting) return;
    const { id } = deleteTarget;
    setIsDeleting(true);
    startTransition(async () => {
      const res = await deleteEmployee(id);
      if (!res.ok) alert(res.error);
      setIsDeleting(false);
      setDeleteTarget(null);
    });
  }

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const data = {
      full_name: fd.get("full_name") as string,
      email: (fd.get("email") as string) || null,
      job_title: (fd.get("job_title") as string) || null,
      department: fd.get("department") === "none" ? null : (fd.get("department") as string) || null,
      employment_type: fd.get("employment_type") === "none" ? null : (fd.get("employment_type") as Employee["employment_type"]) || null,
      start_date: (fd.get("start_date") as string) || null,
      country: (fd.get("country") as string) || null,
      status: "active" as const,
    };
    startTransition(async () => {
      const res = await createEmployee(data);
      if (res.ok) {
        setShowModal(false);
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div className="space-y-6 rounded-[2rem] bg-bg-hover/50 p-3 sm:p-4 lg:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">People</h1>
          <p className="mt-1 text-sm text-text-secondary sm:text-base">
            {employees.length} employee{employees.length !== 1 ? "s" : ""} · {activeCount} active · {onLeaveCount} on leave
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          {isAdmin && (
            <Button onClick={() => setShowModal(true)} size="lg" className="h-10 rounded-xl px-4">
              <UserPlus size={16} />
              Add employee
            </Button>
          )}
        </div>
      </div>

      <div className="sticky top-4 z-20 rounded-2xl border border-border bg-card/85 p-3 shadow-sm backdrop-blur sm:p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-3 md:flex-row md:items-center">
            <div className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-xl border border-border bg-bg-input px-3 md:max-w-md">
              <Search size={16} className="shrink-0 text-text-tertiary" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search people..."
                aria-label="Search people"
                className="h-9 flex-1 border-0 bg-transparent px-0 text-sm text-foreground shadow-none focus-visible:ring-0"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {[
                ["Department", "All"],
                ["Location", topHub],
                ["Status", "All"],
              ].map(([label, value]) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-bg-hover px-3 py-2 text-xs text-text-secondary"
                >
                  <span className="font-semibold">{label}:</span>
                  <span className="text-accent">{value}</span>
                  <ChevronDown size={14} className="text-text-tertiary" />
                </span>
              ))}
              {search && (
                <Button variant="link" size="sm" onClick={() => setSearch("")} className="h-8 px-1 text-accent">
                  Clear search
                </Button>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between gap-4 sm:justify-end">
            <p className="text-xs font-medium text-text-tertiary">
              Showing {filtered.length} result{filtered.length !== 1 ? "s" : ""}
            </p>
            <div className="flex rounded-xl bg-bg-hover p-1">
              <Button size="icon-sm" className="rounded-lg shadow-sm" aria-label="List view">
                <List size={16} />
              </Button>
              <Button variant="ghost" size="icon-sm" className="rounded-lg text-text-tertiary" aria-label="Grid view">
                <Grid3X3 size={16} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex min-h-80 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card p-8 text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">
            <UserPlus size={24} />
          </div>
          <div>
            <p className="font-semibold text-foreground">
              {employees.length === 0 ? "No employees yet" : "No results found"}
            </p>
            <p className="mt-1 text-sm text-text-secondary">
              {employees.length === 0 ? "Start your directory by adding the first employee." : "Try a different name, role, or department."}
            </p>
          </div>
          {employees.length === 0 && isAdmin && (
            <Button onClick={() => setShowModal(true)} className="mt-2 rounded-xl">
              <UserPlus size={16} />
              Add your first employee
            </Button>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left">
              <thead className="bg-bg-hover">
                <tr className="border-b border-border">
                  {["Name", "Role", "Department", "Location", "Status", "Joined Date", "Actions"].map((col) => (
                    <th
                      key={col}
                      className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-text-secondary lg:px-6"
                    >
                      <div className="flex items-center gap-1">
                        {col}
                        {col === "Name" && <SlidersHorizontal size={13} className="text-text-tertiary" />}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((emp) => (
                  <tr key={emp.id} data-private className="group hover:bg-bg-hover">
                    <td className="px-4 py-4 lg:px-6">
                      <Link href={`/workspace/people/${emp.id}`} className="flex items-center gap-3 transition-colors hover:text-accent">
                        <Avatar size="lg">
                          {emp.photo_url && <AvatarImage src={emp.photo_url} alt="" />}
                          <AvatarFallback className="bg-accent text-xs font-semibold text-primary-foreground">
                            {initials(emp.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">{emp.full_name}</p>
                          <p className="truncate text-xs text-text-tertiary">{emp.email ?? "No email on file"}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-4 text-sm text-text-secondary lg:px-6">{emp.job_title ?? "—"}</td>
                    <td className="px-4 py-4 text-sm text-text-secondary lg:px-6">{emp.department ?? "—"}</td>
                    <td className="px-4 py-4 text-sm text-text-secondary lg:px-6">{emp.country ?? "—"}</td>
                    <td className="px-4 py-4 lg:px-6">{statusBadge(emp.status)}</td>
                    <td className="px-4 py-4 text-sm text-text-tertiary lg:px-6">{formatDate(emp.start_date)}</td>
                    <td className="px-4 py-4 text-right lg:px-6">
                      <div className="flex justify-end gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setDeleteTarget({ id: emp.id, name: emp.full_name })}
                            className="text-text-tertiary hover:bg-danger/10 hover:text-danger"
                            aria-label="Remove employee"
                          >
                            <Trash2 size={15} />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon-sm" className="text-text-tertiary" aria-label="More actions">
                          <MoreVertical size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col gap-3 border-t border-border bg-card px-4 py-3 text-xs text-text-tertiary sm:flex-row sm:items-center sm:justify-between lg:px-6">
            <span>Page 1 of 1</span>
            <span>{filtered.length} visible employees</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="flex h-32 flex-col justify-between rounded-2xl border border-accent/10 bg-accent-soft p-5 text-accent">
          <div className="flex items-start justify-between">
            <Users size={22} />
            <span className="text-lg font-bold">{employees.length}</span>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-accent/80">Directory</p>
            <p className="text-xl font-semibold">Total People</p>
          </div>
        </div>
        <div className="flex h-32 flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-sm">
          <BriefcaseBusiness size={22} className="text-text-secondary" />
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-text-tertiary">Departments</p>
            <p className="text-xl font-semibold text-foreground">{departmentCount || "—"}</p>
          </div>
        </div>
        <div className="flex h-32 flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-sm">
          <MapPin size={22} className="text-text-secondary" />
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-text-tertiary">Top Hub</p>
            <p className="text-xl font-semibold text-foreground">{topHub}</p>
          </div>
        </div>
        <div className="flex h-32 flex-col justify-between rounded-2xl border border-accent/10 bg-accent-soft p-5 text-accent">
          <div className="flex items-start justify-between">
            <PartyPopper size={22} />
            <span className="text-lg font-bold">{onLeaveCount}</span>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-accent/80">Status</p>
            <p className="text-xl font-semibold">On Leave</p>
          </div>
        </div>
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto border-border bg-card p-0 sm:max-w-2xl" showCloseButton>
          <DialogHeader className="border-b border-border px-6 py-5">
            <DialogTitle className="text-lg font-semibold text-foreground">Add employee</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-5 p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="employee-full-name">Full name *</Label>
                <Input id="employee-full-name" name="full_name" required placeholder="Jane Smith" className="h-11 rounded-xl bg-bg-input px-3 text-sm" />
              </div>
              <div>
                <Label htmlFor="employee-email">Email</Label>
                <Input id="employee-email" name="email" type="email" placeholder="jane@company.com" className="h-11 rounded-xl bg-bg-input px-3 text-sm" />
              </div>
              <div>
                <Label htmlFor="employee-job-title">Job title</Label>
                <Input id="employee-job-title" name="job_title" placeholder="Software Engineer" className="h-11 rounded-xl bg-bg-input px-3 text-sm" />
              </div>
              <div>
                <Label htmlFor="employee-department">Department</Label>
                <Select
                  name="department"
                  defaultValue="none"
                  items={[
                    { value: "none", label: "Department" },
                    ...DEPARTMENTS.map((department) => ({ value: department, label: department })),
                  ]}
                >
                  <SelectTrigger id="employee-department" className="h-11 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select department</SelectItem>
                    {DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="employee-employment-type">Employment type</Label>
                <Select
                  name="employment_type"
                  defaultValue="none"
                  items={[
                    { value: "none", label: "Employment type" },
                    ...EMPLOYMENT_TYPES,
                  ]}
                >
                  <SelectTrigger id="employee-employment-type" className="h-11 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select type</SelectItem>
                    {EMPLOYMENT_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="employee-start-date">Start date</Label>
                <div className="relative">
                  <CalendarDays size={16} className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-text-tertiary" />
                  <Input id="employee-start-date" name="start_date" type="date" title="Start date" className="h-11 rounded-xl bg-bg-input pl-9 pr-3 text-sm" />
                </div>
              </div>
              <div>
                <Label htmlFor="employee-country">Country</Label>
                <Input id="employee-country" name="country" placeholder="United States" className="h-11 rounded-xl bg-bg-input px-3 text-sm" />
              </div>
            </div>

            {error && (
              <p className="rounded-xl bg-danger/10 px-3 py-2.5 text-sm text-danger">{error}</p>
            )}

            <DialogFooter className="mx-0 mb-0 rounded-none border-border bg-bg-hover/60 px-0 pb-0 pt-5 sm:justify-end">
              <DialogClose render={<Button type="button" variant="outline" className="rounded-xl" />}>
                Cancel
              </DialogClose>
              <Button type="submit" disabled={isPending} className="rounded-xl">
                {isPending && <Loader2 size={14} className="animate-spin" />}
                Add employee
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {deleteTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove {deleteTarget?.name} from this workspace. Their account and historical data will be
              preserved, but they will lose access to this workspace immediately. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isDeleting}
              className="inline-flex items-center gap-2 bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => confirmDelete()}
            >
              {isDeleting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Removing…
                </>
              ) : (
                "Remove employee"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
