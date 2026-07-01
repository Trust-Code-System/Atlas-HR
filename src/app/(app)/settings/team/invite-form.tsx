"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { inviteMember } from "../org/actions";

const ROLE_OPTIONS = [
  { value: "hr_admin", label: "HR Admin — full HR access" },
  { value: "hr_manager", label: "HR Manager — HR without billing" },
  { value: "people_manager", label: "People Manager — manages their team" },
  { value: "recruiter", label: "Recruiter — ATS access" },
  { value: "finance", label: "Finance — payroll & comp visibility" },
  { value: "employee", label: "Employee — self-service only" },
  { value: "viewer", label: "Viewer — read-only" },
];

export function InviteForm() {
  const [state, formAction, pending] = useActionState(inviteMember, null);
  const [role, setRole] = useState("hr_manager");
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state?.success]);

  return (
    <div className="bg-white rounded-2xl border border-navy-200 p-5 mb-6">
      <div className="mb-4">
        <h2 className="text-sm font-bold text-navy-900">Invite people by email</h2>
        <p className="text-xs text-navy-500 mt-0.5">
          They&apos;ll get an email with a secure link to join {""}
          <span className="font-medium">your workspace</span>. Invites expire after 7 days.
        </p>
      </div>

      <form
        ref={formRef}
        action={formAction}
        onReset={() => setRole("hr_manager")}
        className="flex flex-col sm:flex-row gap-3 sm:items-end"
      >
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="invite-email" required>Work email</Label>
          <Input
            id="invite-email"
            name="email"
            type="email"
            placeholder="teammate@company.com"
            autoComplete="off"
            required
          />
        </div>
        <div className="space-y-1.5 sm:w-72">
          <Label htmlFor="invite-role">Role</Label>
          <Select
            id="invite-role"
            name="role"
            value={role}
            onChange={setRole}
            options={ROLE_OPTIONS}
            menuClassName="border-navy-200 shadow-xl shadow-navy-900/10"
          />
        </div>
        <Button type="submit" loading={pending} className="sm:w-auto">
          Send invite
        </Button>
      </form>

      {state?.error && (
        <p className="mt-3 text-sm text-error bg-red-50 border border-red-200 rounded-xl p-3">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="mt-3 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
          Invitation sent. They&apos;ll appear here once they accept.
        </p>
      )}
    </div>
  );
}
