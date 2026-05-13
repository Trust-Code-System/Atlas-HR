"use client";

import { useState, useTransition, useRef, useCallback } from "react";
import NextImage from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import { useAccent } from "@/hooks/use-accent";
import { useUser } from "@/hooks/use-user";
import { createClient } from "@/lib/supabase/client";
import {
  Monitor, Check, Loader2, Upload, Trash2, Download, AlertTriangle,
  PanelLeft, MenuOpen, RotateCcw, Eye, Type, Palette, Save, Contrast,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  updateProfile,
  updateAppearance,
  updateNotificationPreferences,
  updatePassword,
  updateEmail,
  exportMyData,
  deleteAccount,
} from "@/app/(app)/settings/actions";
import { useThemeStore } from "@/stores/theme-store";
import { COMPANY_SIZES, INDUSTRIES } from "@/lib/constants";
import { track } from "@/lib/analytics/track";
import COUNTRIES from "@/lib/data/countries.json";

const COUNTRY_OPTIONS = COUNTRIES.map((c) => ({ value: c, label: c }));
const TABS = ["Profile", "Account", "Appearance", "Notifications", "Data"] as const;
type Tab = (typeof TABS)[number];

const DEFAULT_NOTIF_PREFS = {
  email: {
    replies: true,
    mentions: true,
    org_invites: true,
    org_activity: true,
    weekly_digest: true,
    product_updates: false,
  },
  in_app: { replies: true, mentions: true, votes: true },
};

// ── Inline feedback ────────────────────────────────────────────────────────────
function SaveFeedback({ saved, error }: { saved: boolean; error: string | null }) {
  if (error) return <p className="text-sm text-red-500">{error}</p>;
  if (saved) return <p className="flex items-center gap-1 text-sm text-green-600"><Check size={13} /> Saved!</p>;
  return null;
}

// ── Avatar upload helper ───────────────────────────────────────────────────────
async function resizeAndUpload(
  file: File,
  userId: string
): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
      img.onload = async () => {
        const canvas = document.createElement("canvas");
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext("2d")!;
        // Cover crop
        const ratio = Math.max(256 / img.width, 256 / img.height);
        const w = img.width * ratio;
        const h = img.height * ratio;
        ctx.drawImage(img, (256 - w) / 2, (256 - h) / 2, w, h);

        canvas.toBlob(
          async (blob) => {
            if (!blob) return resolve(null);
            const supabase = createClient();
            const path = `${userId}/avatar.jpg`;
            const { error } = await supabase.storage
              .from("avatars")
              .upload(path, blob, { upsert: true, contentType: "image/jpeg" });
            if (error) return resolve(null);
            const { data } = supabase.storage.from("avatars").getPublicUrl(path);
            // Bust CDN cache with a timestamp query param
            resolve(`${data.publicUrl}?t=${Date.now()}`);
          },
          "image/jpeg",
          0.9
        );
      };
    };
    reader.readAsDataURL(file);
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// Profile tab
// ══════════════════════════════════════════════════════════════════════════════
function ProfileTab() {
  const { user, profile } = useUser();
  const [isPending, start] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    full_name: profile?.full_name ?? "",
    job_title: profile?.job_title ?? "",
    country: profile?.country ?? "",
    company_size: profile?.company_size ?? "",
    industry: profile?.industry ?? "",
    bio: profile?.bio ?? "",
  });

  const handleAvatarPick = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !user) return;
      setAvatarUploading(true);
      const url = await resizeAndUpload(file, user.id);
      if (url) {
        setAvatarPreview(url);
        await updateProfile({ avatar_url: url });
      } else {
        setError("Avatar upload failed — please try again.");
      }
      setAvatarUploading(false);
    },
    [user]
  );

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const res = await updateProfile({
        full_name: form.full_name || null,
        job_title: form.job_title || null,
        country: form.country || null,
        company_size: form.company_size || null,
        industry: form.industry || null,
        bio: form.bio || null,
      });
      if (!res.ok) { setError(res.error); return; }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    });
  }

  const avatarSrc = avatarPreview ?? profile?.avatar_url ?? null;
  const initials = (profile?.full_name ?? "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const inputCls =
    "w-full rounded-xl border border-[--border] bg-[--bg-input] px-3 py-2.5 text-sm text-[--text-primary] outline-none focus:border-[--accent] focus:ring-1 focus:ring-[--accent] placeholder:text-[--text-tertiary] transition-colors";

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-[--text-primary] mb-1">Profile</h2>
        <p className="text-sm text-[--text-secondary]">Your public profile on Atlas.</p>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-4">
        <div className="relative h-16 w-16 shrink-0">
          {avatarSrc ? (
            <NextImage
              src={avatarSrc}
              alt="Avatar"
              width={64}
              height={64}
              unoptimized
              className="h-16 w-16 rounded-full object-cover ring-2 ring-[--border]"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[--accent] text-lg font-bold text-[--primary-foreground]">
              {initials}
            </div>
          )}
          {avatarUploading && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
              <Loader2 size={16} className="animate-spin text-white" />
            </div>
          )}
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            aria-label="Upload avatar photo"
            onChange={handleAvatarPick}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={avatarUploading}
            className="flex items-center gap-2 rounded-lg border border-[--border] px-3 py-2 text-sm font-medium text-[--text-primary] hover:bg-[--bg-hover] transition-colors disabled:opacity-50"
          >
            <Upload size={14} />
            Upload photo
          </button>
          <p className="mt-1 text-xs text-[--text-tertiary]">JPG, PNG or WebP. Max 5 MB.</p>
        </div>
      </div>

      {/* Fields */}
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[--text-primary]">Full name</label>
          <input
            type="text"
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            placeholder="Jane Smith"
            className={inputCls}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[--text-primary]">Job title</label>
          <input
            type="text"
            value={form.job_title}
            onChange={(e) => setForm({ ...form, job_title: e.target.value })}
            placeholder="HR Manager"
            className={inputCls}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[--text-primary]">Country</label>
          <Combobox
            options={COUNTRY_OPTIONS}
            value={form.country}
            onValueChange={(v) => setForm({ ...form, country: v })}
            placeholder="Select country…"
            searchPlaceholder="Search countries…"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[--text-primary]">Company size</label>
            <Select
              value={form.company_size}
              onValueChange={(v) => setForm({ ...form, company_size: v ?? "" })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select…" />
              </SelectTrigger>
              <SelectContent>
                {COMPANY_SIZES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[--text-primary]">Industry</label>
            <Select
              value={form.industry}
              onValueChange={(v) => setForm({ ...form, industry: v ?? "" })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select…" />
              </SelectTrigger>
              <SelectContent>
                {INDUSTRIES.map((i) => (
                  <SelectItem key={i.slug} value={i.label}>{i.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[--text-primary]">Bio</label>
          <textarea
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            rows={3}
            placeholder="Tell the community about your HR experience…"
            className={`${inputCls} resize-none`}
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 rounded-xl bg-[--accent] px-5 py-2.5 text-sm font-semibold text-[--primary-foreground] hover:bg-[--accent-hover] disabled:opacity-60 transition-colors"
        >
          {isPending && <Loader2 size={14} className="animate-spin" />}
          Save profile
        </button>
        <SaveFeedback saved={saved} error={error} />
      </div>
    </form>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Account tab
// ══════════════════════════════════════════════════════════════════════════════
function AccountTab() {
  const { profile } = useUser();
  const [pwPending, startPw] = useTransition();
  const [emailPending, startEmail] = useTransition();
  const [pwSaved, setPwSaved] = useState(false);
  const [emailSaved, setEmailSaved] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [newEmail, setNewEmail] = useState("");

  const inputCls =
    "w-full rounded-xl border border-[--border] bg-[--bg-input] px-3 py-2.5 text-sm text-[--text-primary] outline-none focus:border-[--accent] focus:ring-1 focus:ring-[--accent] placeholder:text-[--text-tertiary] transition-colors";

  function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    if (pwForm.next !== pwForm.confirm) {
      setPwError("New passwords do not match.");
      return;
    }
    if (pwForm.next.length < 8) {
      setPwError("Password must be at least 8 characters.");
      return;
    }
    setPwError(null);
    startPw(async () => {
      const res = await updatePassword({ currentPassword: pwForm.current, newPassword: pwForm.next });
      if (!res.ok) { setPwError(res.error); return; }
      setPwSaved(true);
      setPwForm({ current: "", next: "", confirm: "" });
      setTimeout(() => setPwSaved(false), 2500);
    });
  }

  function handleEmailChange(e: React.FormEvent) {
    e.preventDefault();
    setEmailError(null);
    startEmail(async () => {
      const res = await updateEmail({ newEmail });
      if (!res.ok) { setEmailError(res.error); return; }
      setEmailSaved(true);
      setNewEmail("");
      setTimeout(() => setEmailSaved(false), 3000);
    });
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-[--text-primary] mb-1">Account</h2>
        <p className="text-sm text-[--text-secondary]">Manage your login credentials.</p>
      </div>

      {/* Change password */}
      <form onSubmit={handlePasswordChange} className="space-y-4">
        <h3 className="text-sm font-semibold text-[--text-primary]">Change password</h3>
        {(["current", "next", "confirm"] as const).map((key) => {
          const label =
            key === "current" ? "Current password" : key === "next" ? "New password" : "Confirm new password";
          const placeholder =
            key === "current" ? "Your current password" : key === "next" ? "8+ characters" : "Repeat new password";
          return (
            <div key={key}>
              <label htmlFor={`pw-${key}`} className="mb-1.5 block text-sm font-medium text-[--text-primary]">
                {label}
              </label>
              <input
                id={`pw-${key}`}
                type="password"
                value={pwForm[key]}
                onChange={(e) => setPwForm({ ...pwForm, [key]: e.target.value })}
                required
                placeholder={placeholder}
                className={inputCls}
              />
            </div>
          );
        })}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={pwPending}
            className="flex items-center gap-2 rounded-xl bg-[--accent] px-4 py-2.5 text-sm font-semibold text-[--primary-foreground] hover:bg-[--accent-hover] disabled:opacity-60 transition-colors"
          >
            {pwPending && <Loader2 size={14} className="animate-spin" />}
            Update password
          </button>
          <SaveFeedback saved={pwSaved} error={pwError} />
        </div>
      </form>

      <div className="border-t border-[--border]" />

      {/* Change email */}
      <form onSubmit={handleEmailChange} className="space-y-4">
        <h3 className="text-sm font-semibold text-[--text-primary]">Change email</h3>
        <p className="text-sm text-[--text-tertiary]">Current: <span className="text-[--text-primary]">{profile?.email}</span></p>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[--text-primary]">New email address</label>
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            required
            placeholder="new@company.com"
            className={inputCls}
          />
        </div>
        {emailSaved && (
          <p className="text-sm text-green-600">Check your new inbox to confirm the change.</p>
        )}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={emailPending}
            className="flex items-center gap-2 rounded-xl bg-[--accent] px-4 py-2.5 text-sm font-semibold text-[--primary-foreground] hover:bg-[--accent-hover] disabled:opacity-60 transition-colors"
          >
            {emailPending && <Loader2 size={14} className="animate-spin" />}
            Update email
          </button>
          {emailError && <p className="text-sm text-red-500">{emailError}</p>}
        </div>
      </form>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Appearance tab
// ══════════════════════════════════════════════════════════════════════════════
function AppearanceTab() {
  const { theme, setTheme } = useTheme();
  const { accent, setAccent } = useAccent();
  const setStoreAccent = useThemeStore((s) => s.setAccent);
  const [saved, setSaved] = useState(false);
  const [isPending, start] = useTransition();
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [compactView, setCompactView] = useState(false);
  const [highContrast, setHighContrast] = useState(false);

  const smooth = "transition-all duration-280 ease-[cubic-bezier(0.32,0.72,0,1)]";

  async function handleTheme(value: string) {
    track("theme_changed", { from: theme ?? "system", to: value });
    setTheme(value);
    start(async () => {
      await updateAppearance({ theme: value as "light" | "dark" | "system" });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  async function handleMode(value: "light-blue" | "dark-blue" | "light-purple" | "dark-purple") {
    const [mode, nextAccent] = value.split("-") as ["light" | "dark", "blue" | "purple"];
    track("appearance_mode_changed", { theme: mode, accent: nextAccent });
    setTheme(mode);
    setStoreAccent(nextAccent);
    setAccent(nextAccent);
    start(async () => {
      await updateAppearance({ theme: mode, accent: nextAccent });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  const activeMode =
    theme === "dark"
      ? accent === "purple" ? "dark-purple" : "dark-blue"
      : accent === "purple" ? "light-purple" : "light-blue";

  const themeOptions = [
    {
      value: "light-blue" as const,
      label: "Light Blue",
      frame: "bg-card border-border",
      preview: "bg-sidebar",
      wash: "from-accent-soft to-card",
      tile: "bg-accent",
    },
    {
      value: "dark-blue" as const,
      label: "Dark Blue",
      frame: "bg-slate-950 border-slate-800",
      preview: "bg-slate-900",
      wash: "from-slate-900 to-black",
      tile: "bg-chart-1",
    },
    {
      value: "light-purple" as const,
      label: "Light Purple",
      frame: "bg-card border-border",
      preview: "bg-[--sidebar]",
      wash: "from-accent-soft to-card",
      tile: "bg-secondary",
    },
    {
      value: "dark-purple" as const,
      label: "Royal Purple",
      frame: "bg-slate-950 border-slate-800",
      preview: "bg-secondary",
      wash: "from-chart-4/50 to-background",
      tile: "bg-chart-4",
    },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Theme Selection</h2>
            <p className="mt-1 text-sm text-text-secondary">
              Choose a visual style that best fits your workflow and focus.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleTheme("system")}
              disabled={isPending}
              className="rounded-xl"
            >
              <Monitor size={15} />
              Use system
            </Button>
            <Button type="button" disabled={isPending} className="rounded-xl">
              {isPending ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              Save Changes
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {themeOptions.map((option) => {
            const active = activeMode === option.value && theme !== "system";
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleMode(option.value)}
                disabled={isPending}
                className={`group text-left outline-none disabled:opacity-60 ${smooth}`}
              >
                <div className={`rounded-xl border bg-card p-2 ${
                  active ? "border-accent ring-2 ring-accent ring-offset-2 ring-offset-background" : "border-border hover:bg-bg-hover"
                } ${smooth}`}>
                  <div className={`relative aspect-video overflow-hidden rounded-lg ${option.preview}`}>
                    <div className={`absolute inset-0 bg-linear-to-br ${option.wash} opacity-70`} />
                    <div className={`absolute left-1/2 top-1/2 flex h-8 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded shadow-sm ${option.tile}`}>
                      <div className="h-1 w-8 rounded-full bg-primary-foreground/25" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between px-1 pt-2">
                    <span className={`text-sm font-semibold ${active ? "text-foreground" : "text-text-secondary"}`}>
                      {option.label}
                    </span>
                    {active && (
                      <span className="flex size-5 items-center justify-center rounded-full text-accent">
                        <Check size={18} />
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {theme === "system" && (
          <p className="mt-4 flex items-center gap-2 rounded-xl bg-bg-hover px-3 py-2 text-sm text-text-secondary">
            <Monitor size={15} className="text-accent" />
            Atlas is following your system appearance.
          </p>
        )}
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6 lg:col-span-2">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Layout &amp; Density</h2>
              <p className="mt-1 text-sm text-text-secondary">
                Tune workspace density, navigation behavior, and readability.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => { setSidebarExpanded(true); setCompactView(false); setHighContrast(false); }}
              className="rounded-xl"
            >
              <RotateCcw size={15} />
              Restore Default
            </Button>
          </div>

          <div className="space-y-3">
            {[
              {
                label: "Sidebar Expansion",
                description: "Auto-expand menu on hover.",
                icon: PanelLeft,
                iconClass: "bg-accent-soft text-accent",
                on: sidebarExpanded,
                toggle: () => setSidebarExpanded((value) => !value),
              },
              {
                label: "Compact View",
                description: "Reduce whitespace for more data.",
                icon: MenuOpen,
                iconClass: "bg-secondary/10 text-secondary",
                on: compactView,
                toggle: () => setCompactView((value) => !value),
              },
              {
                label: "High Contrast",
                description: "Enhanced readability for low light.",
                icon: Contrast,
                iconClass: "bg-bg-hover text-foreground",
                on: highContrast,
                toggle: () => setHighContrast((value) => !value),
              },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-4 rounded-xl border border-border bg-bg-input p-4">
                <div className="flex items-center gap-3">
                  <div className={`flex size-10 shrink-0 items-center justify-center rounded-full ${item.iconClass}`}>
                    <item.icon size={18} />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-foreground">{item.label}</p>
                    <p className="text-xs text-text-tertiary">{item.description}</p>
                  </div>
                </div>
                <button
                  type="button"
                  aria-label={item.label}
                  onClick={item.toggle}
                  className={`relative inline-flex h-6 w-11 shrink-0 rounded-full p-1 outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${item.on ? "bg-accent" : "bg-border"} ${smooth}`}
                >
                  <span className={`size-4 rounded-full bg-primary-foreground shadow ${item.on ? "translate-x-5" : "translate-x-0"} ${smooth}`} />
                  <span className="sr-only">{item.on ? "Enabled" : "Disabled"}</span>
                </button>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-end">
            <Button type="button" className="rounded-xl">
              Save Layout
            </Button>
          </div>
        </section>

        <section className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <h2 className="text-xl font-semibold text-foreground">Live Preview</h2>
          <p className="mt-1 text-xs text-text-tertiary">Visualizing changes in real-time.</p>
          <div className="mt-6 flex min-h-64 flex-1 flex-col justify-between overflow-hidden rounded-xl border border-border bg-card p-4">
            <div className={`rounded-lg border border-border ${activeMode.includes("dark") ? "bg-slate-950" : "bg-bg-hover"} p-3`}>
              <div className={`mb-4 flex h-28 items-center justify-center rounded-lg ${activeMode.includes("purple") ? "bg-[--sidebar]" : "bg-sidebar"} opacity-90`}>
                <div className="grid w-28 gap-2 rounded-lg bg-card/90 p-3 shadow-sm">
                  <div className="h-2 rounded-full bg-accent" />
                  <div className="h-2 rounded-full bg-border" />
                  <div className="h-2 w-3/4 rounded-full bg-border" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-4 w-1/3 rounded-full bg-border" />
                <div className="h-3 w-full rounded-full bg-bg-hover" />
                <div className="h-3 w-5/6 rounded-full bg-bg-hover" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-text-tertiary">
              <Palette size={14} className="text-accent" />
              {highContrast ? "High contrast preview enabled" : "Real-time rendering active"}
            </div>
          </div>
          <Button type="button" variant="outline" className="mt-6 rounded-xl text-accent">
            Reset Preview
          </Button>
        </section>
      </div>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Accessibility &amp; Reading</h2>
            <p className="mt-1 text-sm text-text-secondary">
              Adjust text sizes and visual aid settings for your comfort.
            </p>
          </div>
          <Button type="button" className="rounded-xl">
            Save Accessibility
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                <Type size={15} className="text-accent" />
                Font Size Scale
              </span>
              <input className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-border accent-accent" type="range" aria-label="Font size scale" />
              <span className="mt-2 flex justify-between text-xs text-text-tertiary">
                <span>Default (100%)</span>
                <span>Large (120%)</span>
              </span>
            </label>
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                <Eye size={15} className="text-accent" />
                Contrast Ratio
              </label>
              <Select
                value={highContrast ? "high" : "standard"}
                onValueChange={(value) => setHighContrast(value === "high")}
                items={[
                  { value: "standard", label: "Standard (AA)" },
                  { value: "high", label: "High Contrast (AAA)" },
                  { value: "legibility", label: "Increased Legibility" },
                ]}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select contrast" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard (AA)</SelectItem>
                  <SelectItem value="high">High Contrast (AAA)</SelectItem>
                  <SelectItem value="legibility">Increased Legibility</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-bg-input p-4">
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-text-tertiary">Visual Preview</p>
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-foreground">Sample Headline</h3>
              <p className="text-sm leading-7 text-text-secondary">
                This text updates dynamically as you adjust font scales and contrast settings to ensure clarity across the Atlas HR platform.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-lg bg-accent-soft px-2 py-1 text-xs font-bold text-accent">Active Status</span>
                <span className="rounded-lg bg-accent-soft px-2 py-1 text-xs font-bold text-accent">Premium Tier</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {saved && (
        <p className="flex items-center gap-1 text-sm text-success">
          <Check size={13} /> Appearance saved to your account.
        </p>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Notifications tab
// ══════════════════════════════════════════════════════════════════════════════
function NotificationsTab() {
  const { profile } = useUser();
  const [isPending, start] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rawPrefs = profile?.notification_preferences as Record<string, Record<string, boolean>> | null;
  const [prefs, setPrefs] = useState<typeof DEFAULT_NOTIF_PREFS>(() => ({
    email: { ...DEFAULT_NOTIF_PREFS.email, ...(rawPrefs?.email ?? {}) },
    in_app: { ...DEFAULT_NOTIF_PREFS.in_app, ...(rawPrefs?.in_app ?? {}) },
  }));

  function toggle(section: "email" | "in_app", key: string) {
    const next = {
      ...prefs,
      [section]: { ...prefs[section], [key]: !prefs[section][key as keyof typeof prefs[typeof section]] },
    };
    setPrefs(next);
    setError(null);
    start(async () => {
      const res = await updateNotificationPreferences(next);
      if (!res.ok) { setError(res.error); return; }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  const sections = [
    {
      key: "email" as const,
      label: "Email notifications",
      items: [
        { key: "replies", label: "Replies to my threads" },
        { key: "mentions", label: "Mentions" },
        { key: "org_invites", label: "Org invitations" },
        { key: "org_activity", label: "Org activity" },
        { key: "weekly_digest", label: "Weekly HR digest" },
        { key: "product_updates", label: "Product updates" },
      ],
    },
    {
      key: "in_app" as const,
      label: "In-app notifications",
      items: [
        { key: "replies", label: "Replies to my threads" },
        { key: "mentions", label: "Mentions" },
        { key: "votes", label: "Votes on my content" },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-[--text-primary] mb-1">Notifications</h2>
        <p className="text-sm text-[--text-secondary]">Choose what you want to be notified about.</p>
      </div>

      {sections.map((section) => (
        <div key={section.key} className="space-y-3">
          <h3 className="text-sm font-semibold text-[--text-primary]">{section.label}</h3>
          {section.items.map((item) => {
            const on = prefs[section.key][item.key as keyof typeof prefs[typeof section.key]] ?? false;
            return (
              <label key={item.key} className="flex cursor-pointer items-center justify-between rounded-xl border border-[--border] bg-[--bg-card] px-4 py-3">
                <span className="text-sm text-[--text-primary]">{item.label}</span>
                <button
                  type="button"
                  aria-label={`${item.label}: ${on ? "enabled" : "disabled"}`}
                  disabled={isPending}
                  onClick={() => toggle(section.key, item.key)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors [duration:280ms] disabled:opacity-50 ${
                    on ? "bg-[--accent]" : "bg-[--border]"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 translate-x-0 rounded-full bg-primary-foreground shadow ring-0 transition-transform [duration:280ms] ${
                      on ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                  <span className="sr-only">{on ? "Enabled" : "Disabled"}</span>
                </button>
              </label>
            );
          })}
        </div>
      ))}

      {saved && <p className="flex items-center gap-1 text-sm text-green-600"><Check size={13} /> Saved.</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Data tab
// ══════════════════════════════════════════════════════════════════════════════
function DataTab() {
  const [exportPending, startExport] = useTransition();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deletePending, startDelete] = useTransition();
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function handleExport() {
    startExport(async () => {
      const res = await exportMyData();
      if (!res.ok) return;
      const blob = new Blob([res.data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `atlas-hr-data-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    });
  }

  function handleDelete() {
    if (deleteConfirm !== "DELETE") return;
    setDeleteError(null);
    startDelete(async () => {
      const res = await deleteAccount();
      if (!res.ok) { setDeleteError(res.error ?? "Failed to delete account."); return; }
      window.location.href = "/";
    });
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-[--text-primary] mb-1">Your data</h2>
        <p className="text-sm text-[--text-secondary]">Export or permanently delete your account and all associated data.</p>
      </div>

      {/* Export */}
      <div className="rounded-2xl border border-[--border] bg-[--bg-card] p-5 space-y-3">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[--accent-soft]">
            <Download size={16} className="text-[--accent]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[--text-primary]">Export my data</p>
            <p className="text-xs text-[--text-tertiary] mt-0.5">
              Download a JSON file containing your profile, generated documents, saved items, Copilot conversations, and community contributions.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleExport}
          disabled={exportPending}
          className="flex items-center gap-2 rounded-xl border border-[--border] px-4 py-2.5 text-sm font-medium text-[--text-primary] hover:bg-[--bg-hover] disabled:opacity-60 transition-colors"
        >
          {exportPending ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
          {exportPending ? "Preparing export…" : "Download my data"}
        </button>
      </div>

      {/* Delete */}
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5 space-y-3 dark:border-red-900 dark:bg-red-950/20">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/40">
            <Trash2 size={16} className="text-red-600 dark:text-red-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-red-700 dark:text-red-400">Delete account</p>
            <p className="text-xs text-red-500 mt-0.5">
              Permanently delete your account and all your data. This cannot be undone.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setDeleteOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
        >
          <Trash2 size={14} />
          Delete my account
        </button>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40 mb-2">
              <AlertTriangle size={18} className="text-red-600 dark:text-red-400" />
            </div>
            <DialogTitle>Delete your account?</DialogTitle>
            <p className="text-sm text-[--text-secondary]">
              This will permanently delete your profile, documents, conversations, and all other data. There is no undo.
            </p>
          </DialogHeader>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[--text-primary]">
              Type <span className="font-mono font-bold">DELETE</span> to confirm
            </label>
            <input
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="DELETE"
              className="w-full rounded-xl border border-[--border] bg-[--bg-input] px-3 py-2.5 text-sm text-[--text-primary] outline-none focus:border-red-500 placeholder:text-[--text-tertiary]"
            />
            {deleteError && <p className="text-xs text-red-500">{deleteError}</p>}
          </div>

          <DialogFooter className="border-0 bg-transparent p-0 mt-2">
            <DialogClose
              render={
                <button
                  type="button"
                  aria-label="Cancel"
                  className="rounded-xl border border-[--border] px-4 py-2.5 text-sm font-medium text-[--text-secondary] hover:bg-[--bg-hover] transition-colors"
                />
              }
            >
              Cancel
            </DialogClose>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleteConfirm !== "DELETE" || deletePending}
              className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {deletePending && <Loader2 size={14} className="animate-spin" />}
              Delete account
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Settings page
// ══════════════════════════════════════════════════════════════════════════════
export default function SettingsPage() {
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const initialTab = TABS.includes(requestedTab as Tab) ? (requestedTab as Tab) : "Profile";
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const localTabs: Tab[] = ["Profile", "Account", "Appearance", "Notifications", "Data"];
  const linkedTabs = [
    { label: "Billing", href: "/settings/billing" },
    { label: "Privacy", href: "/settings/privacy" },
    { label: "Security", href: "/settings/security" },
  ];

  return (
    <div className="mx-auto max-w-[1200px] space-y-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">System Settings</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Manage your organizational preferences and personal interface styles.
        </p>
      </header>

      <nav className="flex items-center gap-6 overflow-x-auto border-b border-border" aria-label="Settings sections">
        {localTabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`shrink-0 border-b-2 px-1 pb-3 text-sm font-semibold transition-colors duration-280 focus-visible:ring-2 focus-visible:ring-accent/40 ${
              activeTab === tab
                ? "border-accent text-accent"
                : "border-transparent text-text-tertiary hover:text-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
        {linkedTabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className="shrink-0 border-b-2 border-transparent px-1 pb-3 text-sm font-semibold text-text-tertiary transition-colors duration-280 hover:text-foreground focus-visible:ring-2 focus-visible:ring-accent/40"
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      <div className="min-w-0">
        {activeTab === "Profile" && <ProfileTab />}
        {activeTab === "Account" && <AccountTab />}
        {activeTab === "Appearance" && <AppearanceTab />}
        {activeTab === "Notifications" && <NotificationsTab />}
        {activeTab === "Data" && <DataTab />}
      </div>
    </div>
  );
}
