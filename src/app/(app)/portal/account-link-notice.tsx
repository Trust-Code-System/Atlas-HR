"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { linkMyEmployeeAccount } from "./link-account-actions";

type Props = {
  isAdmin: boolean;
  orgName: string;
};

export function AccountLinkNotice({ isAdmin, orgName }: Props) {
  const [state, formAction, isPending] = useActionState(linkMyEmployeeAccount, null);

  return (
    <div className="rounded-[18px] border border-amber-200 bg-amber-50 p-6 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600">
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
      </div>

      <h2 className="text-lg font-semibold text-amber-900 mb-1">
        {isAdmin ? "Your admin account is not linked to an employee profile" : "Account not linked"}
      </h2>
      <p className="text-sm text-amber-700 max-w-xl mx-auto">
        {isAdmin
          ? `You can manage ${orgName} because you are a workspace admin. These My Portal pages show employee self-service data, so Atlas also needs an employee record connected to your login.`
          : "Your account has not been linked to an employee record yet. Ask your HR admin to link your profile."}
      </p>

      {state?.error && (
        <p className="mt-3 text-sm font-medium text-red-700">{state.error}</p>
      )}

      {isAdmin && (
        <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <form action={formAction}>
            <Button type="submit" loading={isPending}>
              Create/link my employee profile
            </Button>
          </form>
          <Link
            href="/org/people"
            className="inline-flex items-center justify-center rounded-[8px] border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-900 transition-colors hover:bg-amber-100"
          >
            Manage employees
          </Link>
          <Link
            href="/dashboard"
            className="text-sm font-semibold text-amber-800 transition-colors hover:text-amber-950"
          >
            Go to admin dashboard
          </Link>
        </div>
      )}
    </div>
  );
}
