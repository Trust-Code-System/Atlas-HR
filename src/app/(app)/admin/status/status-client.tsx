"use client";

import { useState, useActionState, useTransition } from "react";
import { Plus, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createIncident, updateIncidentStatus } from "./actions";
import type { StatusIncident } from "@/types/database";

const SERVICES = ["database", "ai", "email", "stripe"];

const SEVERITY_BADGE: Record<string, string> = {
  minor: "bg-amber-500/10 text-amber-600",
  major: "bg-[--danger]/10 text-[--danger]",
  critical: "bg-[--danger]/10 text-[--danger] font-bold",
};

const STATUS_BADGE: Record<string, string> = {
  investigating: "bg-[--accent-soft] text-[--accent]",
  identified: "bg-amber-500/10 text-amber-600",
  monitoring: "bg-chart-4/10 text-chart-4",
  resolved: "bg-[--success]/10 text-[--success]",
};

const STATUS_LABELS: Record<string, string> = {
  investigating: "Investigating",
  identified: "Identified",
  monitoring: "Monitoring",
  resolved: "Resolved",
};

const INITIAL_STATE: { success?: true; error?: string } = {};
const SEVERITY_ITEMS = ["minor", "major", "critical"];
const STATUS_ITEMS = Object.keys(STATUS_LABELS);

function NewIncidentForm({ onClose }: { onClose: () => void }) {
  const [state, action, isPending] = useActionState(createIncident, INITIAL_STATE);

  if (state.success) {
    onClose();
    return null;
  }

  return (
    <form action={action} className="space-y-4 rounded-xl border border-[--border] bg-[--bg-card] p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-[--text-primary]">New incident</h3>
        <button type="button" onClick={onClose} aria-label="Close form" className="text-[--text-tertiary] hover:text-[--text-primary]">
          <X size={16} />
        </button>
      </div>

      {state.error && (
        <p className="rounded-lg border border-[--danger]/30 bg-[--danger]/10 px-3 py-2 text-sm text-[--danger]">
          {state.error}
        </p>
      )}

      <div>
        <label className="mb-1.5 block text-sm font-medium text-[--text-primary]">Title</label>
        <input
          name="title"
          required
          placeholder="Brief description of the incident"
          className="w-full rounded-lg border border-[--border] bg-[--bg-input] px-3 py-2 text-sm text-[--text-primary] outline-none focus:border-[--accent]"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-[--text-primary]">Update</label>
        <textarea
          name="body"
          required
          rows={3}
          placeholder="What's happening? What are you doing about it?"
          className="w-full resize-none rounded-lg border border-[--border] bg-[--bg-input] px-3 py-2 text-sm text-[--text-primary] outline-none focus:border-[--accent]"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[--text-primary]">Severity</label>
          <Select name="severity" defaultValue="minor" items={SEVERITY_ITEMS.map((value) => ({ value, label: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="minor">Minor</SelectItem>
              <SelectItem value="major">Major</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[--text-primary]">Status</label>
          <Select name="status" defaultValue="investigating" items={STATUS_ITEMS.map((value) => ({ value, label: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-[--text-primary]">
          Affected services (comma-separated)
        </label>
        <input
          name="affected_services"
          placeholder={SERVICES.join(", ")}
          className="w-full rounded-lg border border-[--border] bg-[--bg-input] px-3 py-2 text-sm text-[--text-primary] outline-none focus:border-[--accent]"
        />
      </div>

      <div className="flex justify-end gap-3">
        <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-[--text-secondary] hover:text-[--text-primary]">
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-xl bg-[--accent] px-4 py-2 text-sm font-semibold text-[--primary-foreground] hover:bg-[--accent-hover] disabled:opacity-60"
        >
          {isPending ? "Creating…" : "Create incident"}
        </button>
      </div>
    </form>
  );
}

function IncidentRow({ incident }: { incident: StatusIncident }) {
  const [isPending, startTransition] = useTransition();

  const handleStatus = (value: string | null) => {
    if (!value) return;
    startTransition(async () => {
      await updateIncidentStatus(
        incident.id,
        value as "investigating" | "identified" | "monitoring" | "resolved"
      );
    });
  };

  return (
    <div className="flex items-start gap-4 px-5 py-4">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium text-[--text-primary]">{incident.title}</p>
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${SEVERITY_BADGE[incident.severity]}`}>
            {incident.severity}
          </span>
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_BADGE[incident.status]}`}>
            {STATUS_LABELS[incident.status]}
          </span>
        </div>
        <p className="mt-0.5 text-sm text-[--text-secondary] line-clamp-1">{incident.body}</p>
        <p className="mt-1 text-xs text-[--text-tertiary]">
          {new Date(incident.started_at).toLocaleString()}
          {incident.affected_services.length > 0 && ` · ${incident.affected_services.join(", ")}`}
        </p>
      </div>
      <Select
        value={incident.status}
        onValueChange={handleStatus}
        disabled={isPending}
        items={STATUS_ITEMS.map((value) => ({ value, label: value }))}
      >
        <SelectTrigger className="h-9 w-36 shrink-0 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
        {Object.entries(STATUS_LABELS).map(([value, label]) => (
          <SelectItem key={value} value={value}>{label}</SelectItem>
        ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function AdminStatusClient({ incidents }: { incidents: StatusIncident[] }) {
  const [showForm, setShowForm] = useState(false);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-[--text-primary]">Incidents</h2>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 rounded-lg bg-[--accent] px-3 py-1.5 text-sm font-semibold text-[--primary-foreground] hover:bg-[--accent-hover]"
        >
          <Plus size={14} />
          New incident
        </button>
      </div>

      {showForm && <NewIncidentForm onClose={() => setShowForm(false)} />}

      <div className="overflow-hidden rounded-xl border border-[--border] bg-[--bg-card]">
        {incidents.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-[--text-tertiary]">
            No incidents logged. Create one above when a service issue occurs.
          </p>
        ) : (
          <ul className="divide-y divide-[--border]">
            {incidents.map((incident) => (
              <li key={incident.id}>
                <IncidentRow incident={incident} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
