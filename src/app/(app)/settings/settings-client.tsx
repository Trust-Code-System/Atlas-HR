"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Input, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { updateProfile, changePassword, updateAvatarUrl } from "./actions";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/database";

const COUNTRIES = [
  "Australia", "Brazil", "Canada", "China", "France", "Germany", "Ghana",
  "India", "Ireland", "Kenya", "Mexico", "Netherlands", "New Zealand",
  "Nigeria", "Pakistan", "Singapore", "South Africa", "Spain", "Sweden",
  "United Arab Emirates", "United Kingdom", "United States",
];

const INDUSTRIES = [
  "Agriculture", "Construction", "Education", "Energy", "Finance",
  "Healthcare", "Hospitality", "Legal", "Manufacturing", "Media",
  "Non-profit", "Professional Services", "Real Estate", "Retail",
  "Technology", "Transportation", "Other",
];

const COMPANY_SIZES = [
  "1–10", "11–50", "51–200", "201–500", "501–1,000", "1,000+",
];

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="text-xs font-semibold text-navy-600 uppercase tracking-wide block mb-1.5">
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

function SuccessBanner({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-4">
      <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
      {message}
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
      <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {message}
    </div>
  );
}

function SelectDropdown({
  name,
  options,
  defaultValue,
  placeholder,
}: {
  name: string;
  options: string[];
  defaultValue?: string;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(defaultValue ?? "");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <input type="hidden" name={name} value={value} />
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-10 w-full items-center justify-between rounded-xl border border-navy-200 bg-white px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
      >
        <span className={value ? "text-navy-900" : "text-navy-400"}>
          {value || placeholder || "Select…"}
        </span>
        <svg
          className={`h-4 w-4 text-navy-400 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-navy-200 bg-white shadow-lg overflow-hidden">
          <div className="max-h-48 overflow-y-auto">
            <button
              type="button"
              onClick={() => { setValue(""); setOpen(false); }}
              className="w-full text-left px-3 py-2 text-sm text-navy-400 hover:bg-navy-50 transition-colors"
            >
              {placeholder || "Select…"}
            </button>
            {options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => { setValue(opt); setOpen(false); }}
                className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-blue-50 hover:text-blue-700 ${
                  value === opt ? "bg-blue-50 text-blue-700 font-medium" : "text-navy-900"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AvatarUpload({ user }: { user: Profile }) {
  const [src, setSrc] = useState(user.avatar_url ?? undefined);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUploadError("Please select an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image must be under 5 MB.");
      return;
    }

    setUploadError(null);
    setUploading(true);

    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${user.id}/avatar.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });

      if (uploadErr) throw new Error(uploadErr.message);

      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const publicUrl = `${data.publicUrl}?t=${Date.now()}`;

      const result = await updateAvatarUrl(publicUrl);
      if (result?.error) throw new Error(result.error);

      setSrc(publicUrl);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <div
        className="relative group cursor-pointer"
        onClick={() => !uploading && inputRef.current?.click()}
        title="Click to upload photo"
      >
        <Avatar src={src} name={user.full_name ?? user.email} size="xl" />
        <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          {uploading ? (
            <svg className="h-5 w-5 text-white animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          aria-label="Upload profile photo"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
      {uploadError && (
        <p className="text-xs text-red-600">{uploadError}</p>
      )}
      {!uploadError && (
        <p className="text-xs text-navy-400">Click photo to upload · Max 5 MB</p>
      )}
    </div>
  );
}

export function SettingsClient({ user }: { user: Profile }) {
  const [profileState, profileAction, profilePending] = useActionState(updateProfile, null);
  const [pwState, pwAction, pwPending] = useActionState(changePassword, null);

  return (
    <div className="space-y-6">
      {/* Profile section */}
      <section className="bg-white rounded-2xl border border-navy-200 p-6">
        <div className="flex items-center gap-4 mb-6">
          <AvatarUpload user={user} />
          <div>
            <h2 className="font-semibold text-navy-900 text-lg">{user.full_name ?? "No name set"}</h2>
            <p className="text-navy-500 text-sm">{user.email}</p>
            <Badge variant="success" className="mt-1">{user.role}</Badge>
          </div>
        </div>

        <h3 className="font-semibold text-navy-800 mb-4">Edit profile</h3>

        {profileState?.success && <SuccessBanner message="Profile updated successfully." />}
        {profileState?.error && <ErrorBanner message={profileState.error} />}

        <form action={profileAction} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel required>Full name</FieldLabel>
              <Input name="full_name" defaultValue={user.full_name ?? ""} placeholder="Jane Smith" required />
            </div>
            <div>
              <FieldLabel>Job title</FieldLabel>
              <Input name="job_title" defaultValue={user.job_title ?? ""} placeholder="HR Manager" />
            </div>
            <div>
              <FieldLabel>Country</FieldLabel>
              <SelectDropdown
                name="country"
                options={COUNTRIES}
                defaultValue={user.country ?? ""}
                placeholder="Select country…"
              />
            </div>
            <div>
              <FieldLabel>Industry</FieldLabel>
              <SelectDropdown
                name="industry"
                options={INDUSTRIES}
                defaultValue={user.industry ?? ""}
                placeholder="Select industry…"
              />
            </div>
            <div>
              <FieldLabel>Company size</FieldLabel>
              <SelectDropdown
                name="company_size"
                options={COMPANY_SIZES}
                defaultValue={user.company_size ?? ""}
                placeholder="Select size…"
              />
            </div>
          </div>
          <div>
            <FieldLabel>Bio</FieldLabel>
            <Textarea name="bio" defaultValue={user.bio ?? ""} placeholder="A short bio about yourself…" rows={3} />
          </div>
          <div className="flex justify-end">
            <Button type="submit" loading={profilePending} size="sm">
              Save changes
            </Button>
          </div>
        </form>
      </section>

      {/* Account section */}
      <section className="bg-white rounded-2xl border border-navy-200 p-6">
        <h2 className="font-semibold text-navy-900 mb-1">Account</h2>
        <p className="text-sm text-navy-400 mb-5">Manage your email and password.</p>

        <div className="mb-5 pb-5 border-b border-navy-100">
          <FieldLabel>Email address</FieldLabel>
          <p className="text-sm text-navy-800">{user.email}</p>
          <p className="text-xs text-navy-400 mt-1">To change your email, please contact support.</p>
        </div>

        <h3 className="font-semibold text-navy-800 mb-4">Change password</h3>
        {pwState?.success && <SuccessBanner message="Password changed successfully." />}
        {pwState?.error && <ErrorBanner message={pwState.error} />}

        <form action={pwAction} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel required>New password</FieldLabel>
              <Input name="new_password" type="password" placeholder="Min. 8 characters" autoComplete="new-password" />
            </div>
            <div>
              <FieldLabel required>Confirm password</FieldLabel>
              <Input name="confirm_password" type="password" placeholder="Repeat new password" autoComplete="new-password" />
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="submit" loading={pwPending} size="sm">
              Update password
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
