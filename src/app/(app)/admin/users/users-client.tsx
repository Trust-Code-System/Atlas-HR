"use client";

import { useState, useTransition } from "react";
import { Search, LogIn } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { startImpersonation } from "./impersonate-actions";

type User = {
  id: string;
  full_name: string | null;
  email: string;
  role: string;
  country: string | null;
  created_at: string;
  onboarding_completed: boolean;
};

const ROLE_BADGE: Record<string, string> = {
  free: "bg-[--bg-input] text-[--text-secondary]",
  pro: "bg-[--accent-soft] text-[--accent]",
  team_admin: "bg-chart-4/10 text-chart-4",
  team_member: "bg-chart-4/10 text-chart-4",
  business_admin: "bg-chart-1/10 text-chart-1",
  business_member: "bg-chart-1/10 text-chart-1",
  enterprise: "bg-amber-500/10 text-amber-600",
  moderator: "bg-teal-500/10 text-teal-600",
  admin: "bg-[--danger]/10 text-[--danger]",
};

const ROLE_LABELS: Record<string, string> = {
  free: "Free",
  pro: "Pro",
  team_admin: "Team",
  team_member: "Team",
  business_admin: "Business",
  business_member: "Business",
  enterprise: "Enterprise",
  moderator: "Mod",
  admin: "Admin",
};

const ALL_ROLES = ["free", "pro", "team_admin", "team_member", "business_admin", "business_member", "enterprise", "moderator", "admin"];

function ImpersonateButton({ userId }: { userId: string }) {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      await startImpersonation(userId);
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      title="Impersonate this user"
      className="flex items-center gap-1.5 rounded-lg border border-[--border] px-2.5 py-1 text-xs text-[--text-tertiary] transition-colors hover:border-[--accent] hover:text-[--accent] disabled:opacity-50"
    >
      <LogIn size={12} />
      {isPending ? "Loading…" : "View as"}
    </button>
  );
}

export function AdminUsersClient({ users }: { users: User[] }) {
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const filtered = users.filter((u) => {
    const matchesQuery =
      !query ||
      u.email.toLowerCase().includes(query.toLowerCase()) ||
      (u.full_name?.toLowerCase().includes(query.toLowerCase()) ?? false);
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesQuery && matchesRole;
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold text-[--text-primary]">Users</h1>
        <p className="mt-1 text-sm text-[--text-secondary]">
          {users.length.toLocaleString()} total users · showing {filtered.length.toLocaleString()}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex h-9 items-center gap-2 rounded-lg border border-[--border] bg-[--bg-input] px-3 text-sm">
          <Search size={14} className="shrink-0 text-[--text-tertiary]" />
          <input
            type="text"
            placeholder="Search by name or email…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-52 bg-transparent text-[--text-primary] outline-none placeholder:text-[--text-tertiary]"
          />
        </div>

        <Select
          value={roleFilter}
          onValueChange={(value) => setRoleFilter(value ?? "all")}
          items={["all", ...ALL_ROLES].map((value) => ({ value, label: value === "all" ? "All roles" : value }))}
        >
          <SelectTrigger className="h-9 w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
          <SelectItem value="all">All plans</SelectItem>
          {ALL_ROLES.map((r) => (
            <SelectItem key={r} value={r}>{ROLE_LABELS[r] ?? r}</SelectItem>
          ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-[--border] bg-[--bg-card]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[--border] text-left text-xs font-semibold uppercase tracking-wider text-[--text-tertiary]">
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Plan</th>
              <th className="hidden px-4 py-3 md:table-cell">Country</th>
              <th className="hidden px-4 py-3 lg:table-cell">Joined</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[--border]">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-[--text-tertiary]">
                  No users match your filters.
                </td>
              </tr>
            )}
            {filtered.map((user) => (
              <tr key={user.id} className="hover:bg-[--bg-hover]">
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium text-[--text-primary]">{user.full_name ?? "—"}</p>
                    <p className="text-xs text-[--text-tertiary]">{user.email}</p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${ROLE_BADGE[user.role] ?? ROLE_BADGE.free}`}
                  >
                    {ROLE_LABELS[user.role] ?? user.role}
                  </span>
                </td>
                <td className="hidden px-4 py-3 text-[--text-secondary] md:table-cell">
                  {user.country ?? "—"}
                </td>
                <td className="hidden px-4 py-3 text-[--text-secondary] lg:table-cell">
                  {new Date(user.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </td>
                <td className="px-4 py-3 text-right">
                  <ImpersonateButton userId={user.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
