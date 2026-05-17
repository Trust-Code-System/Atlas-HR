"use client";

import { useState } from "react";
import Link from "next/link";
import type { Job } from "@/types/database";

const STATUS_VISUAL: Record<string, { pill: string; dot: string }> = {
  open:    { pill: "bg-blue-50 text-blue-700 border border-blue-200",    dot: "bg-blue-500" },
  draft:   { pill: "bg-navy-100 text-navy-600 border border-navy-200",   dot: "bg-navy-400" },
  on_hold: { pill: "bg-amber-50 text-amber-700 border border-amber-200", dot: "bg-amber-400" },
  closed:  { pill: "bg-slate-50 text-slate-500 border border-slate-200", dot: "bg-slate-400" },
};

const TYPE_LABEL: Record<string, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract:  "Contract",
  intern:    "Intern",
};

type Filter = "all" | "open" | "draft" | "on_hold" | "closed";

interface Props {
  jobs: Job[];
  appCountMap: Record<string, number>;
  hiredMap: Record<string, number>;
  isAdmin: boolean;
}

export function JobsTable({ jobs, appCountMap, hiredMap, isAdmin }: Props) {
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");

  const filtered = jobs.filter((j) => {
    const matchesFilter = filter === "all" || j.status === filter;
    const matchesSearch =
      !search ||
      j.title.toLowerCase().includes(search.toLowerCase()) ||
      (j.department ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (j.location ?? "").toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const counts: Record<Filter, number> = {
    all:     jobs.length,
    open:    jobs.filter((j) => j.status === "open").length,
    draft:   jobs.filter((j) => j.status === "draft").length,
    on_hold: jobs.filter((j) => j.status === "on_hold").length,
    closed:  jobs.filter((j) => j.status === "closed").length,
  };

  const filterOptions: Array<{ value: Filter; label: string }> = [
    { value: "all",     label: `All (${counts.all})` },
    { value: "open",    label: `Open (${counts.open})` },
    { value: "on_hold", label: `On hold (${counts.on_hold})` },
    { value: "draft",   label: `Draft (${counts.draft})` },
    { value: "closed",  label: `Closed (${counts.closed})` },
  ];

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex gap-1 bg-navy-50 rounded-[10px] p-1 border border-navy-100">
          {filterOptions.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 rounded-[7px] text-xs font-semibold transition-all whitespace-nowrap ${
                filter === f.value
                  ? "bg-white text-navy-900 shadow-sm"
                  : "text-slate-500 hover:text-navy-900"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex-1 min-w-[160px]">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search roles…"
            className="w-full rounded-[10px] border border-navy-200 bg-white px-3 py-2 text-sm text-navy-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-navy-200 overflow-hidden shadow-sm">
        {filtered.length > 0 ? (
          <>
            <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-navy-50/80 border-b border-navy-200 text-[11px] font-bold text-navy-400 uppercase tracking-widest">
              <div className="col-span-4">Role</div>
              <div className="col-span-2 hidden sm:block">Type</div>
              <div className="col-span-2 hidden md:block">Location</div>
              <div className="col-span-2">Applicants</div>
              <div className="col-span-4 sm:col-span-2">Status</div>
            </div>
            <div className="divide-y divide-navy-100">
              {filtered.map((job) => {
                const sv    = STATUS_VISUAL[job.status] ?? STATUS_VISUAL.open;
                const count = appCountMap[job.id] ?? 0;
                const hired = hiredMap[job.id] ?? 0;
                return (
                  <Link
                    key={job.id}
                    href={`/recruiting/${job.id}`}
                    className="grid grid-cols-12 gap-4 px-5 py-4 items-center hover:bg-blue-50/30 transition-colors group"
                  >
                    <div className="col-span-4 min-w-0">
                      <p className="text-sm font-semibold text-navy-900 truncate group-hover:text-blue-700 transition-colors">
                        {job.title}
                      </p>
                      {job.department && <p className="text-xs text-navy-400 truncate">{job.department}</p>}
                    </div>
                    <div className="col-span-2 hidden sm:block text-sm text-navy-600">
                      {TYPE_LABEL[job.employment_type ?? ""] ?? job.employment_type ?? "—"}
                    </div>
                    <div className="col-span-2 hidden md:block text-sm text-navy-600 truncate">
                      {job.location ?? "—"}
                    </div>
                    <div className="col-span-2">
                      <span className="font-mono text-sm font-semibold text-navy-800 tabular-nums">{count}</span>
                      {hired > 0 && (
                        <span className="ml-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">
                          {hired} hired
                        </span>
                      )}
                    </div>
                    <div className="col-span-4 sm:col-span-2">
                      <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full ${sv.pill}`}>
                        <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${sv.dot}`} />
                        {job.status.replace("_", " ")}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <p className="text-sm font-semibold text-navy-700 mb-1">
              {search ? "No roles match your search" : "No roles in this filter"}
            </p>
            <p className="text-xs text-navy-400">
              {search ? "Try a different search term" : "Switch the filter above to see other roles"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
