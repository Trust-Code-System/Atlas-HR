"use client";

import Link from "next/link";
import { useActionState } from "react";
import { sendPasswordResetEmail } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState(sendPasswordResetEmail, null);

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl border border-navy-200 shadow-md p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-navy-900">Reset password</h1>
          <p className="text-navy-500 mt-1 text-sm">
            Enter your email and we&apos;ll send you a reset link.
          </p>
        </div>

        {state?.success ? (
          <div className="text-center py-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 mx-auto mb-4">
              <svg aria-hidden="true" className="h-7 w-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="font-semibold text-navy-900 mb-2">Check your email</h2>
            <p className="text-navy-500 text-sm mb-6">
              We&apos;ve sent a password reset link to your email address.
            </p>
            <Link href="/sign-in" className="text-blue-600 font-semibold hover:text-blue-700 text-sm">
              Back to sign in
            </Link>
          </div>
        ) : (
          <form action={action} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@company.com"
                autoComplete="email"
                required
              />
            </div>

            {state?.error && (
              <p className="text-sm text-error bg-red-50 border border-red-200 rounded-xl p-3">
                {state.error}
              </p>
            )}

            <Button type="submit" className="w-full" size="lg" loading={pending}>
              Send reset link
            </Button>

            <p className="text-center text-sm text-navy-500">
              Remembered it?{" "}
              <Link href="/sign-in" className="text-blue-600 font-semibold hover:text-blue-700 transition-colors">
                Sign in
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
