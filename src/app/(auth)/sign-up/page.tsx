"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signUpWithPassword, signInWithOAuth } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select } from "@/components/ui/select";
import { COMPANY_SIZES, INDUSTRIES, GOALS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "atlas-signup-wizard";

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
    const result = await signUpWithPassword(fd);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
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
            </div>

            <Separator label="or" className="mb-6" />

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
                <Label htmlFor="company_name">Company name</Label>
                <Input
                  id="company_name"
                  value={form.company_name}
                  onChange={(e) => persist({ company_name: e.target.value })}
                  placeholder="Acme Corp"
                />
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

            <div className="flex gap-3 mt-6">
              <Button variant="outline" size="lg" className="flex-1" onClick={() => setStep(1)}>
                ← Back
              </Button>
              <Button size="lg" className="flex-1" onClick={() => setStep(3)}>
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
