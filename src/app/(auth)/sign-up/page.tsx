"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signUpWithPassword } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { COMPANY_SIZES, INDUSTRIES, GOALS, HR_ROLES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "atlas-signup-wizard";

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

type Step = 1 | 2 | 3;

interface WizardState {
  full_name: string;
  email: string;
  password: string;
  company_name: string;
  industry: string;
  company_size: string;
  role: string;
  goals: string[];
}

const defaultState: WizardState = {
  full_name: "",
  email: "",
  password: "",
  company_name: "",
  industry: "",
  company_size: "",
  role: "",
  goals: [],
};

function getStored(): Partial<WizardState> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="w-full max-w-lg" />}>
      <SignUpWizard />
    </Suspense>
  );
}

function SignUpWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite") ?? "";
  const inviteEmail = searchParams.get("email") ?? "";
  const isInvited = Boolean(inviteToken);

  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<WizardState>({
    ...defaultState,
    ...getStored(),
    // An invited user's email is fixed by the invitation.
    ...(inviteEmail ? { email: inviteEmail } : {}),
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Invited users join an existing workspace, so the Company step is skipped.
  const steps = isInvited
    ? [
        { label: "Account", number: 1 as const },
        { label: "Goals", number: 3 as const },
      ]
    : [
        { label: "Account", number: 1 as const },
        { label: "Company", number: 2 as const },
        { label: "Goals", number: 3 as const },
      ];

  function persist(updates: Partial<WizardState>) {
    const next = { ...form, ...updates };
    setForm(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  async function handleSubmit() {
    setLoading(true);
    setError("");
    const fd = new FormData();
    fd.set("email", form.email);
    fd.set("password", form.password);
    fd.set("full_name", form.full_name);
    fd.set("goals", JSON.stringify(form.goals));

    if (isInvited) {
      fd.set("invite_token", inviteToken);
    } else {
      if (form.industry) fd.set("industry", form.industry);
      if (form.company_size) fd.set("company_size", form.company_size);
      if (form.role) fd.set("role", form.role);
      if (form.company_name.trim()) {
        fd.set("company_name", form.company_name.trim());
        fd.set("company_slug", slugify(form.company_name.trim()));
      }
    }

    const result = await signUpWithPassword(fd);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    localStorage.removeItem(STORAGE_KEY);
    router.push(result?.needsVerification ? "/verify-email" : "/dashboard");
  }

  return (
    <div className="w-full max-w-[580px]">
      <div className="mb-5 rounded-3xl border border-navy-200/80 bg-white/80 px-5 py-4 shadow-lg shadow-blue-950/5 backdrop-blur">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">
              Workspace setup
            </p>
            <p className="mt-1 text-sm text-navy-500">
              Create your account, company profile, and first priorities.
            </p>
          </div>
          <span className="hidden rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100 sm:inline-flex">
            Free forever
          </span>
        </div>

        <div className="flex items-center justify-center gap-0">
        {steps.map((s, i) => (
          <div key={s.number} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all",
                  step > s.number
                    ? "border-blue-600 bg-blue-600 text-white shadow-sm shadow-blue-600/30"
                    : step === s.number
                    ? "border-blue-600 bg-white text-blue-600 shadow-sm"
                    : "border-navy-200 bg-white text-navy-400"
                )}
              >
                {step > s.number ? (
                  <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={cn(
                  "text-xs font-medium",
                  step === s.number ? "text-blue-600" : "text-navy-400"
                )}
              >
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  "mx-2 mb-5 h-0.5 w-12 transition-colors sm:w-16",
                  step > s.number ? "bg-blue-600" : "bg-navy-200"
                )}
              />
            )}
          </div>
        ))}
      </div>
      </div>

      <div className="rounded-3xl border border-navy-200/80 bg-white/95 p-6 shadow-2xl shadow-blue-950/10 backdrop-blur sm:p-8">
        {/* Step 1: Account */}
        {step === 1 && (
          <>
            <div className="mb-6">
              <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-blue-700 ring-1 ring-blue-100">
                Step 1 of {steps.length}
              </span>
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-navy-950">Create your account</h1>
              <p className="mt-2 text-sm leading-6 text-navy-500">
                {isInvited
                  ? "You've been invited to join a workspace on Atlas HR."
                  : "Get started with Atlas HR - free forever."}
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="full_name" required>Full name</Label>
                <Input
                  id="full_name"
                  value={form.full_name}
                  onChange={(e) => persist({ full_name: e.target.value })}
                  placeholder="Jane Smith"
                  autoComplete="name"
                  className="h-12 rounded-2xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email" required>Work email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => persist({ email: e.target.value })}
                  placeholder="jane@company.com"
                  autoComplete="email"
                  readOnly={isInvited && Boolean(inviteEmail)}
                  className={cn("h-12 rounded-2xl", isInvited && inviteEmail && "bg-navy-50 text-navy-500")}
                />
                {isInvited && inviteEmail && (
                  <p className="text-xs text-navy-400">This is the address your invitation was sent to.</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" required>Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={(e) => persist({ password: e.target.value })}
                  placeholder="Min. 8 characters"
                  autoComplete="new-password"
                  className="h-12 rounded-2xl"
                />
              </div>
            </div>

            <Button
              className="mt-6 h-12 w-full rounded-2xl"
              size="lg"
              onClick={() => {
                if (!form.full_name || !form.email || !form.password) {
                  setError("Please fill in all fields.");
                  return;
                }
                if (form.password.length < 8) {
                  setError("Password must be at least 8 characters.");
                  return;
                }
                setError("");
                setStep(isInvited ? 3 : 2);
              }}
            >
              Continue
            </Button>

            {error && (
              <p className="mt-3 rounded-2xl border border-red-200 bg-red-50 p-3 text-center text-sm text-error">{error}</p>
            )}

            <p className="mt-4 rounded-2xl bg-navy-50 px-4 py-3 text-center text-sm text-navy-500">
              Already have an account?{" "}
              <Link
                href={isInvited ? `/sign-in?invite=${inviteToken}` : "/sign-in"}
                className="text-blue-600 font-semibold hover:text-blue-700"
              >
                Sign in
              </Link>
            </p>
          </>
        )}

        {/* Step 2: Company (workspace creators only) */}
        {step === 2 && !isInvited && (
          <>
            <div className="mb-6">
              <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-blue-700 ring-1 ring-blue-100">
                Step 2 of {steps.length}
              </span>
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-navy-950">About you and your company</h1>
              <p className="mt-2 text-sm leading-6 text-navy-500">
                You&apos;ll be the workspace admin and can invite your team after signup.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="role" required>Your role</Label>
                <Select
                  id="role"
                  value={form.role}
                  onChange={(value) => persist({ role: value })}
                  placeholder="Select your role..."
                  options={HR_ROLES.map((r) => ({ value: r, label: r }))}
                />
                <p className="text-xs text-navy-400">
                  As the person setting up Atlas HR, you become the workspace admin.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="company_name" required>Company name</Label>
                <Input
                  id="company_name"
                  value={form.company_name}
                  onChange={(e) => persist({ company_name: e.target.value })}
                  placeholder="Acme Corp"
                  className="h-12 rounded-2xl"
                />
                <p className="text-xs text-navy-400">
                  This creates your workspace at{" "}
                  <span className="font-mono text-navy-500">
                    atlashr.xyz/{slugify(form.company_name.trim()) || "your-company"}
                  </span>
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="industry">Industry</Label>
                <Select
                  id="industry"
                  value={form.industry}
                  onChange={(value) => persist({ industry: value })}
                  placeholder="Select industry..."
                  options={INDUSTRIES.map((i) => ({
                    value: i.slug,
                    label: i.label,
                  }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="company_size">Company size</Label>
                <Select
                  id="company_size"
                  value={form.company_size}
                  onChange={(value) => persist({ company_size: value })}
                  placeholder="Select size..."
                  options={COMPANY_SIZES.map((s) => ({
                    value: s,
                    label: `${s} employees`,
                  }))}
                />
              </div>
            </div>

            {error && (
              <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-error">
                {error}
              </p>
            )}

            <div className="flex gap-3 mt-6">
              <Button variant="outline" size="lg" className="h-12 flex-1 rounded-2xl" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button
                size="lg"
                onClick={() => {
                  if (!form.role) {
                    setError("Please select your role.");
                    return;
                  }
                  if (!form.company_name.trim()) {
                    setError("Please enter your company name.");
                    return;
                  }
                  setError("");
                  setStep(3);
                }}
                className="h-12 flex-1 rounded-2xl"
              >
                Continue
              </Button>
            </div>
          </>
        )}

        {/* Step 3: Goals */}
        {step === 3 && (
          <>
            <div className="mb-6">
              <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-blue-700 ring-1 ring-blue-100">
                Final step
              </span>
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-navy-950">What brings you here?</h1>
              <p className="mt-2 text-sm leading-6 text-navy-500">Select all that apply. We&apos;ll tailor your experience.</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {GOALS.map((goal) => {
                const selected = form.goals.includes(goal);
                return (
                  <button
                    key={goal}
                    type="button"
                    onClick={() =>
                      persist({
                        goals: selected
                          ? form.goals.filter((g) => g !== goal)
                          : [...form.goals, goal],
                      })
                    }
                    className={cn(
                      "min-h-12 rounded-2xl border-2 px-3 py-2.5 text-left text-xs font-semibold transition-all",
                      selected
                        ? "border-blue-600 bg-blue-50 text-blue-700 shadow-sm"
                        : "border-navy-200 bg-white text-navy-600 hover:border-navy-300 hover:bg-navy-50"
                    )}
                  >
                    {goal}
                  </button>
                );
              })}
            </div>

            {error && (
              <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-error">
                {error}
              </p>
            )}

            <div className="flex gap-3 mt-6">
              <Button variant="outline" size="lg" className="h-12 flex-1 rounded-2xl" onClick={() => setStep(isInvited ? 1 : 2)}>
                Back
              </Button>
              <Button size="lg" className="h-12 flex-1 rounded-2xl" loading={loading} onClick={handleSubmit}>
                {isInvited ? "Join workspace" : "Create account"}
              </Button>
            </div>

            <button
              type="button"
              className="w-full mt-3 text-sm text-navy-400 hover:text-navy-600 transition-colors"
              onClick={handleSubmit}
            >
              Skip for now
            </button>
          </>
        )}
      </div>

      <p className="mt-4 px-4 text-center text-xs leading-5 text-navy-400">
        By signing up, you agree to our{" "}
        <Link href="/terms" className="underline hover:text-navy-600">Terms</Link> and{" "}
        <Link href="/privacy" className="underline hover:text-navy-600">Privacy Policy</Link>.
      </p>
    </div>
  );
}
