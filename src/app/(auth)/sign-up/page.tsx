"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signUpWithPassword } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { COMPANY_SIZES, INDUSTRIES, GOALS } from "@/lib/constants";
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
  goals: string[];
}

const defaultState: WizardState = {
  full_name: "",
  email: "",
  password: "",
  company_name: "",
  industry: "",
  company_size: "",
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

const steps = [
  { label: "Account", number: 1 },
  { label: "Company", number: 2 },
  { label: "Goals", number: 3 },
];

export default function SignUpPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<WizardState>({
    ...defaultState,
    ...getStored(),
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
    if (form.industry) fd.set("industry", form.industry);
    if (form.company_size) fd.set("company_size", form.company_size);
    fd.set("goals", JSON.stringify(form.goals));
    if (form.company_name.trim()) {
      fd.set("company_name", form.company_name.trim());
      fd.set("company_slug", slugify(form.company_name.trim()));
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
    <div className="w-full max-w-lg">
      {/* Progress */}
      <div className="flex items-center justify-center gap-0 mb-8">
        {steps.map((s, i) => (
          <div key={s.number} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all",
                  step > s.number
                    ? "bg-blue-600 border-blue-600 text-white"
                    : step === s.number
                    ? "bg-white border-blue-600 text-blue-600"
                    : "bg-white border-navy-200 text-navy-400"
                )}
              >
                {step > s.number ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  s.number
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
                  "h-0.5 w-16 mx-2 mb-5 transition-colors",
                  step > s.number ? "bg-blue-600" : "bg-navy-200"
                )}
              />
            )}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-navy-200 shadow-md p-8">
        {/* Step 1: Account */}
        {step === 1 && (
          <>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-navy-900">Create your account</h1>
              <p className="text-navy-500 text-sm mt-1">Get started with Atlas HR — free forever.</p>
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
                />
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
                />
              </div>
            </div>

            <Button
              className="w-full mt-6"
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
                setStep(2);
              }}
            >
              Continue →
            </Button>

            {error && (
              <p className="mt-3 text-sm text-error text-center">{error}</p>
            )}

            <p className="mt-4 text-center text-sm text-navy-500">
              Already have an account?{" "}
              <Link href="/sign-in" className="text-blue-600 font-semibold hover:text-blue-700">
                Sign in
              </Link>
            </p>
          </>
        )}

        {/* Step 2: Company */}
        {step === 2 && (
          <>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-navy-900">About your company</h1>
              <p className="text-navy-500 text-sm mt-1">Help us personalise your experience.</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="company_name" required>Company name</Label>
                <Input
                  id="company_name"
                  value={form.company_name}
                  onChange={(e) => persist({ company_name: e.target.value })}
                  placeholder="Acme Corp"
                />
                <p className="text-xs text-navy-400">
                  This creates your workspace at{" "}
                  <span className="font-mono text-navy-500">
                    atlashr.com/{slugify(form.company_name.trim()) || "your-company"}
                  </span>
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="industry">Industry</Label>
                <Select
                  id="industry"
                  value={form.industry}
                  onChange={(value) => persist({ industry: value })}
                  placeholder="Select industry…"
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
                  placeholder="Select size…"
                  options={COMPANY_SIZES.map((s) => ({
                    value: s,
                    label: `${s} employees`,
                  }))}
                />
              </div>
            </div>

            {error && (
              <p className="mt-4 text-sm text-error bg-red-50 border border-red-200 rounded-xl p-3">
                {error}
              </p>
            )}

            <div className="flex gap-3 mt-6">
              <Button variant="outline" size="lg" className="flex-1" onClick={() => setStep(1)}>
                ← Back
              </Button>
              <Button
                size="lg"
                className="flex-1"
                onClick={() => {
                  if (!form.company_name.trim()) {
                    setError("Please enter your company name.");
                    return;
                  }
                  setError("");
                  setStep(3);
                }}
              >
                Continue →
              </Button>
            </div>
          </>
        )}

        {/* Step 3: Goals */}
        {step === 3 && (
          <>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-navy-900">What brings you here?</h1>
              <p className="text-navy-500 text-sm mt-1">Select all that apply. We&apos;ll tailor your experience.</p>
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
                      "text-left px-3 py-2.5 rounded-xl border-2 text-xs font-medium transition-all",
                      selected
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-navy-200 bg-white text-navy-600 hover:border-navy-300"
                    )}
                  >
                    {goal}
                  </button>
                );
              })}
            </div>

            {error && (
              <p className="mt-4 text-sm text-error bg-red-50 border border-red-200 rounded-xl p-3">
                {error}
              </p>
            )}

            <div className="flex gap-3 mt-6">
              <Button variant="outline" size="lg" className="flex-1" onClick={() => setStep(2)}>
                ← Back
              </Button>
              <Button size="lg" className="flex-1" loading={loading} onClick={handleSubmit}>
                Create account
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

      <p className="mt-4 text-center text-xs text-navy-400">
        By signing up, you agree to our{" "}
        <Link href="/" className="underline hover:text-navy-600">Terms</Link> and{" "}
        <Link href="/" className="underline hover:text-navy-600">Privacy Policy</Link>.
      </p>
    </div>
  );
}
