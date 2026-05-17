"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

async function createOrg(name: string, slug: string) {
  const res = await fetch("/api/org", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, slug }),
  });
  const data = await res.json();
  if (!res.ok) return { error: data.error ?? "Something went wrong." };
  return data;
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export default function OrgOnboardingPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const slug = slugify(name);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError("");

    const result = await createOrg(name.trim(), slug);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="min-h-screen bg-navy-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 mx-auto mb-4">
            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-navy-900">Create your organisation</h1>
          <p className="text-navy-500 text-sm mt-1">
            This is your company&apos;s workspace on Atlas HR.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-navy-200 shadow-md p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="name" required>Organisation name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Acme Corp"
                autoFocus
                required
              />
            </div>

            {slug && (
              <div className="bg-navy-50 rounded-xl px-3 py-2.5">
                <p className="text-xs text-navy-500">
                  Your workspace URL will be:{" "}
                  <span className="font-mono font-medium text-navy-700">
                    atlashr.com/<span className="text-blue-600">{slug}</span>
                  </span>
                </p>
              </div>
            )}

            {error && (
              <p className="text-sm text-error bg-red-50 border border-red-200 rounded-xl p-3">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" size="lg" loading={loading}>
              Create workspace
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
