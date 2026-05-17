"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState, Suspense } from "react";
import { signInWithPassword, signInWithOAuth } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

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

        {/* OAuth */}
        <div className="space-y-3 mb-6">
          <button
            onClick={() => signInWithOAuth("google")}
            type="button"
            className="w-full flex items-center justify-center gap-3 h-10 rounded-xl border-2 border-navy-200 bg-white text-navy-700 text-sm font-medium hover:border-navy-300 hover:bg-navy-50 transition-colors"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
          <button
            onClick={() => signInWithOAuth("linkedin_oidc")}
            type="button"
            className="w-full flex items-center justify-center gap-3 h-10 rounded-xl border-2 border-navy-200 bg-white text-navy-700 text-sm font-medium hover:border-navy-300 hover:bg-navy-50 transition-colors"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
              <rect width="24" height="24" rx="3" fill="#0A66C2"/>
              <path fill="#fff" d="M7.2 10.1H4.8v8.9h2.4v-8.9zm-1.2-3.9C5.1 6.2 4.3 7 4.3 8s.8 1.8 1.7 1.8 1.7-.8 1.7-1.8-.8-1.8-1.7-1.8zM19.7 13.6c0-2.2-1.3-3.7-3.2-3.7-1 0-1.8.5-2.3 1.2v-1h-2.4v8.9h2.4v-4.8c0-1 .5-1.9 1.5-1.9s1.5.8 1.5 1.9v4.8h2.5v-5.4z"/>
            </svg>
            Continue with LinkedIn
          </button>
        </div>

        <Separator label="or" className="mb-6" />

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
