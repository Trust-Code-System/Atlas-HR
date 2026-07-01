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
    <div className="w-full max-w-[480px]">
      <div className="rounded-3xl border border-navy-200/80 bg-white/95 p-6 shadow-2xl shadow-blue-950/10 backdrop-blur sm:p-8">
        <div className="mb-8">
          <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-blue-700 ring-1 ring-blue-100">
            Secure sign in
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-navy-950">
            Welcome back
          </h1>
          <p className="mt-2 text-sm leading-6 text-navy-500">
            Sign in to your Atlas HR account
          </p>
        </div>

        {resetSuccess && (
          <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm font-medium text-blue-700">
            Password updated successfully. Sign in with your new password.
          </div>
        )}

        <form action={action} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@company.com"
              autoComplete="email"
              className="h-12 rounded-2xl"
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
              className="h-12 rounded-2xl"
              required
            />
          </div>

          {state?.error && (
            <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-error">
              {state.error}
            </p>
          )}

          <Button type="submit" className="h-12 w-full rounded-2xl" size="lg" loading={pending}>
            Sign in
          </Button>
        </form>

        <p className="mt-6 rounded-2xl bg-navy-50 px-4 py-3 text-center text-sm text-navy-500">
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
