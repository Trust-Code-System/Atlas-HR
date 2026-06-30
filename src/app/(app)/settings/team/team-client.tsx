"use client";

import { useTransition, useState } from "react";
import { Select } from "@/components/ui/select";
import { updateMemberRole } from "../org/actions";

interface Member {
  id: string;
  user_id: string;
  org_role: "admin" | "member";
  roles: string[];
  joined_at: string;
}

interface Profile {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
}

interface Props {
  members: Member[];
  profileMap: Record<string, Profile>;
  currentUserId: string;
}

const ROLE_LABELS: Record<string, string> = {
  workspace_owner: "Workspace Owner",
  hr_admin: "HR Admin",
  hr_manager: "HR Manager",
  employee: "Employee",
  viewer: "Viewer",
};

function roleLabels(member: Member) {
  const roles = Array.isArray(member.roles) && member.roles.length > 0
    ? member.roles
    : [member.org_role === "admin" ? "hr_admin" : "employee"];
  return roles.map((role) => ROLE_LABELS[role] ?? role.replace(/_/g, " "));
}

function RoleToggle({
  member,
  isCurrentUser,
}: {
  member: Member;
  isCurrentUser: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [role, setRole] = useState<"admin" | "member">(member.org_role);
  const [error, setError] = useState<string | null>(null);

  function handleChange(value: string) {
    const next = value as "admin" | "member";
    setError(null);
    startTransition(async () => {
      const result = await updateMemberRole(member.id, next);
      if (result?.error) {
        setError(result.error);
      } else {
        setRole(next);
      }
    });
  }

  return (
    <div>
      <Select
        value={role}
        onChange={handleChange}
        disabled={isPending || isCurrentUser}
        className="w-28"
        triggerClassName={`h-8 rounded-lg px-2.5 py-1.5 text-xs font-semibold ${
          role === "admin" ? "bg-blue-50 text-blue-700" : "bg-navy-50 text-navy-600"
        } ${isPending ? "opacity-60" : ""} ${isCurrentUser ? "cursor-not-allowed" : "cursor-pointer"}`}
        options={[
          { value: "admin", label: "Admin" },
          { value: "member", label: "Member" },
        ]}
      />
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

export function TeamClient({ members, profileMap, currentUserId }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-navy-200 overflow-hidden">
      {members.length > 0 ? (
        <div className="divide-y divide-navy-100">
          {members.map((member) => {
            const profile = profileMap[member.user_id];
            const isCurrentUser = member.user_id === currentUserId;
            const initials = (profile?.full_name ?? profile?.email ?? "?")
              .split(" ")
              .slice(0, 2)
              .map((w) => w[0])
              .join("")
              .toUpperCase();

            return (
              <div key={member.id} className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.full_name ?? ""}
                      className="h-9 w-9 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-xs font-bold text-blue-700">{initials}</span>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-navy-800">
                      {profile?.full_name ?? "No name"}
                      {isCurrentUser && <span className="ml-1.5 text-xs text-navy-400">(you)</span>}
                    </p>
                    <p className="text-xs text-navy-400">{profile?.email}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {roleLabels(member).map((role) => (
                        <span key={role} className="rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                          {role}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <p className="font-mono text-xs text-navy-400 hidden sm:block">
                    Joined {new Date(member.joined_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                  <RoleToggle member={member} isCurrentUser={isCurrentUser} />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-sm text-navy-500">No members found.</p>
        </div>
      )}
    </div>
  );
}
