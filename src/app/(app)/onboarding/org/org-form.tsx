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

export function OrgForm() {
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
        Create Organisation
      </Button>
    </form>
  );
}
