"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState, Suspense } from "react";
import { signInWithPassword } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function SignInForm() {
  const searchParams = useSearchParams();
  const resetSuccess = searchParams.get("reset") === "success";
  const [state, action, pending] = useActionState(signInWithPassword, null);

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl border border-navy-200 shadow-md p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-navy-900">Welcome back</h1>
          <p className="text-navy-500 mt-1 text-sm">
            Sign in to your Atlas HR account
          </p>
        </div>

        {resetSuccess && (
          <div className="mb-6 p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-sm">
            Password updated successfully. Sign in with your new password.
          </div>
        )}

        {/* Email/password form */}
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

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                href="/forgot-password"
                className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
          </div>

          {state?.error && (
            <p className="text-sm text-error bg-red-50 border border-red-200 rounded-xl p-3">
              {state.error}
            </p>
          )}

          <Button type="submit" className="w-full" size="lg" loading={pending}>
            Sign in
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-navy-500">
          Don&apos;t have an account?{" "}
          <Link
            href="/sign-up"
            className="text-blue-600 font-semibold hover:text-blue-700 transition-colors"
          >
            Sign up free
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  );
}
