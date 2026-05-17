"use client";

import { useActionState } from "react";
import { resetPassword } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ResetPasswordPage() {
  const [state, action, pending] = useActionState(resetPassword, null);

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl border border-navy-200 shadow-md p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-navy-900">Set new password</h1>
          <p className="text-navy-500 mt-1 text-sm">
            Choose a strong password for your account.
          </p>
        </div>

        <form action={action} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Minimum 8 characters"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirm">Confirm new password</Label>
            <Input
              id="confirm"
              name="confirm"
              type="password"
              placeholder="Repeat your new password"
              autoComplete="new-password"
              required
            />
          </div>

          {state?.error && (
            <p className="text-sm text-error bg-red-50 border border-red-200 rounded-xl p-3">
              {state.error}
            </p>
          )}

          <Button type="submit" className="w-full" size="lg" loading={pending}>
            Update password
          </Button>
        </form>
      </div>
    </div>
  );
}
