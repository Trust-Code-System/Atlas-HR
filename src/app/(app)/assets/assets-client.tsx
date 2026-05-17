"use client";

import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import { DatePicker } from "@/components/ui/date-picker";
import { Select } from "@/components/ui/select";
import type { AssetAssignment, CompanyAsset, Employee } from "@/types/database";
import { assignAsset, createAsset, returnAsset, updateAssetStatus, type AssetsActionResult } from "./actions";

type EmployeeLite = Pick<Employee, "id" | "full_name" | "job_title" | "department" | "status">;

interface Props {
  assets: CompanyAsset[];
  assignments: AssetAssignment[];
  employees: EmployeeLite[];
  isAdmin: boolean;
}

const ASSET_TYPES: Array<{ value: CompanyAsset["asset_type"]; label: string }> = [
  { value: "laptop", label: "Laptop" },
  { value: "desktop", label: "Desktop" },
  { value: "monitor", label: "Monitor" },
  { value: "phone", label: "Phone" },
  { value: "tablet", label: "Tablet" },
  { value: "accessory", label: "Accessory" },
  { value: "vehicle", label: "Vehicle" },
  { value: "license", label: "Software license" },
  { value: "card", label: "Access card" },
  { value: "other", label: "Other" },
];

const CONDITIONS: Array<{ value: CompanyAsset["condition"]; label: string }> = [
  { value: "new", label: "New" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "damaged", label: "Damaged" },
  { value: "repair_needed", label: "Repair needed" },
];

const STATUS_STYLE: Record<CompanyAsset["status"], string> = {
  available: "bg-emerald-50 text-emerald-700 border-emerald-200",
  assigned: "bg-blue-50 text-blue-700 border-blue-200",
  repair: "bg-amber-50 text-amber-700 border-amber-200",
  lost: "bg-red-50 text-red-700 border-red-200",
  retired: "bg-navy-100 text-navy-600 border-navy-200",
};

const STATUS_OPTIONS: Array<{ value: CompanyAsset["status"]; label: string }> = [
  { value: "available", label: "Available" },
  { value: "assigned", label: "Assigned" },
  { value: "repair", label: "Repair" },
  { value: "lost", label: "Lost" },
  { value: "retired", label: "Retired" },
];

const CURRENCIES = ["USD", "GBP", "EUR", "NGN", "INR", "CAD", "AUD"];

function formatDate(value: string | null) {
  return value ? new Date(`${value}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "-";
}

function formatMoney(value: number | null, currency: string) {
  if (!value) return "-";
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
}

function labelFor<T extends string>(options: Array<{ value: T; label: string }>, value: T) {
  return options.find((option) => option.value === value)?.label ?? value.replace(/_/g, " ");
}

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-navy-900">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-navy-400 hover:text-navy-700 transition-colors">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function CreateAssetModal({ onClose }: { onClose: () => void }) {
  const [state, formAction, isPending] = useActionState<AssetsActionResult, FormData>(createAsset, null);
  const inputCls = "flex h-10 w-full rounded-xl border border-navy-200 bg-white px-3 py-2 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent";
  const labelCls = "text-xs font-semibold text-navy-600 uppercase tracking-wide block mb-1.5";

  useEffect(() => {
    if (state?.success) onClose();
  }, [state, onClose]);

  return (
    <ModalShell title="Add asset" onClose={onClose}>
      <form action={formAction} className="space-y-4">
        {state?.error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{state.error}</div>}

        <div>
          <label htmlFor="asset-name" className={labelCls}>Asset name <span className="text-red-500">*</span></label>
          <input id="asset-name" name="name" required className={inputCls} placeholder="e.g. MacBook Pro 14" />
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="asset-type" className={labelCls}>Type</label>
            <Select id="asset-type" name="asset_type" options={ASSET_TYPES} />
          </div>
          <div>
            <label htmlFor="asset-condition" className={labelCls}>Condition</label>
            <Select id="asset-condition" name="condition" options={CONDITIONS} defaultValue="good" />
          </div>
          <div>
            <label htmlFor="asset-status" className={labelCls}>Status</label>
            <Select id="asset-status" name="status" options={STATUS_OPTIONS.filter((option) => option.value !== "assigned")} defaultValue="available" />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="asset-manufacturer" className={labelCls}>Manufacturer</label>
            <input id="asset-manufacturer" name="manufacturer" className={inputCls} placeholder="e.g. Apple, Dell, Lenovo" />
          </div>
          <div>
            <label htmlFor="asset-model" className={labelCls}>Model</label>
            <input id="asset-model" name="model" className={inputCls} placeholder="e.g. M3 Pro, Latitude 7440" />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="asset-tag" className={labelCls}>Asset tag</label>
            <input id="asset-tag" name="asset_tag" className={inputCls} placeholder="e.g. ATLAS-LAP-001" />
          </div>
          <div>
            <label htmlFor="asset-serial" className={labelCls}>Serial number</label>
            <input id="asset-serial" name="serial_number" className={inputCls} placeholder="Device serial number" />
          </div>
        </div>

        <div className="grid sm:grid-cols-4 gap-4">
          <div className="sm:col-span-2">
            <label htmlFor="asset-purchase-date" className={labelCls}>Purchase date</label>
            <DatePicker id="asset-purchase-date" name="purchase_date" placeholder="Select purchase date" />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="asset-warranty" className={labelCls}>Warranty expires</label>
            <DatePicker id="asset-warranty" name="warranty_expires" placeholder="Select warranty date" />
          </div>
          <div>
            <label htmlFor="asset-currency" className={labelCls}>Currency</label>
            <Select id="asset-currency" name="currency" options={CURRENCIES.map((currency) => ({ value: currency, label: currency }))} defaultValue="USD" />
          </div>
          <div>
            <label htmlFor="asset-cost" className={labelCls}>Cost</label>
            <input id="asset-cost" name="purchase_cost" type="number" min="0" step="0.01" className={inputCls} placeholder="0" />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="asset-location" className={labelCls}>Location</label>
            <input id="asset-location" name="location" className={inputCls} placeholder="e.g. Lagos office, remote kit shelf" />
          </div>
        </div>

        <div>
          <label htmlFor="asset-notes" className={labelCls}>Notes</label>
          <textarea id="asset-notes" name="notes" className="flex min-h-[72px] w-full rounded-xl border border-navy-200 bg-white px-3 py-2.5 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-none" placeholder="Warranty, accessories, finance notes, or handover context" />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="text-sm font-medium text-navy-600 hover:text-navy-800 px-4 py-2 rounded-lg hover:bg-navy-50 transition-colors">Cancel</button>
          <button type="submit" disabled={isPending} className="inline-flex items-center gap-2 text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 px-5 py-2 rounded-xl transition-colors disabled:opacity-60">
            {isPending ? "Saving..." : "Create asset"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function AssignAssetModal({ assets, employees, onClose }: { assets: CompanyAsset[]; employees: EmployeeLite[]; onClose: () => void }) {
  const [state, formAction, isPending] = useActionState<AssetsActionResult, FormData>(assignAsset, null);
  const assignableAssets = assets.filter((asset) => asset.status === "available" || asset.status === "repair");
  const labelCls = "text-xs font-semibold text-navy-600 uppercase tracking-wide block mb-1.5";

  useEffect(() => {
    if (state?.success) onClose();
  }, [state, onClose]);

  return (
    <ModalShell title="Assign asset" onClose={onClose}>
      <form action={formAction} className="space-y-4">
        {state?.error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{state.error}</div>}
        {assignableAssets.length === 0 ? (
          <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            No available assets to assign. Add an asset or return an assigned one first.
          </div>
        ) : null}

        <div>
          <label htmlFor="assign-asset" className={labelCls}>Asset <span className="text-red-500">*</span></label>
          <Select
            id="assign-asset"
            name="asset_id"
            options={assignableAssets.map((asset) => ({
              value: asset.id,
              label: `${asset.name}${asset.asset_tag ? ` (${asset.asset_tag})` : ""}`,
            }))}
          />
        </div>

        <div>
          <label htmlFor="assign-employee" className={labelCls}>Employee <span className="text-red-500">*</span></label>
          <Select
            id="assign-employee"
            name="employee_id"
            options={employees.map((employee) => ({
              value: employee.id,
              label: `${employee.full_name}${employee.department ? ` - ${employee.department}` : ""}`,
            }))}
          />
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="assign-date" className={labelCls}>Assigned date</label>
            <DatePicker id="assign-date" name="assigned_at" defaultValue={new Date().toISOString().slice(0, 10)} />
          </div>
          <div>
            <label htmlFor="return-due" className={labelCls}>Return due</label>
            <DatePicker id="return-due" name="return_due_at" placeholder="Optional" />
          </div>
          <div>
            <label htmlFor="condition-out" className={labelCls}>Condition out</label>
            <Select id="condition-out" name="condition_out" options={CONDITIONS} defaultValue="good" />
          </div>
        </div>

        <div>
          <label htmlFor="assign-notes" className={labelCls}>Notes</label>
          <textarea id="assign-notes" name="notes" className="flex min-h-[72px] w-full rounded-xl border border-navy-200 bg-white px-3 py-2.5 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-none" placeholder="Charger, sleeve, agreement, or handover notes" />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="text-sm font-medium text-navy-600 hover:text-navy-800 px-4 py-2 rounded-lg hover:bg-navy-50 transition-colors">Cancel</button>
          <button type="submit" disabled={isPending || assignableAssets.length === 0} className="inline-flex items-center gap-2 text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 px-5 py-2 rounded-xl transition-colors disabled:opacity-60">
            {isPending ? "Assigning..." : "Assign asset"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function ReturnAssetModal({ asset, assignment, onClose }: { asset: CompanyAsset; assignment: AssetAssignment; onClose: () => void }) {
  const [state, formAction, isPending] = useActionState<AssetsActionResult, FormData>(returnAsset, null);
  const labelCls = "text-xs font-semibold text-navy-600 uppercase tracking-wide block mb-1.5";

  useEffect(() => {
    if (state?.success) onClose();
  }, [state, onClose]);

  return (
    <ModalShell title={`Return ${asset.name}`} onClose={onClose}>
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="assignment_id" value={assignment.id} />
        <input type="hidden" name="asset_id" value={asset.id} />
        {state?.error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{state.error}</div>}

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="condition-in" className={labelCls}>Returned condition</label>
            <Select id="condition-in" name="condition_in" options={CONDITIONS} defaultValue="good" />
          </div>
          <div>
            <label htmlFor="status-after-return" className={labelCls}>Asset status</label>
            <Select
              id="status-after-return"
              name="status_after_return"
              options={[
                { value: "available", label: "Available for reassignment" },
                { value: "repair", label: "Needs repair" },
                { value: "retired", label: "Retired" },
                { value: "lost", label: "Lost" },
              ]}
              defaultValue="available"
            />
          </div>
        </div>

        <div>
          <label htmlFor="return-notes" className={labelCls}>Return notes</label>
          <textarea id="return-notes" name="notes" className="flex min-h-[72px] w-full rounded-xl border border-navy-200 bg-white px-3 py-2.5 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-none" placeholder="Accessories returned, damage notes, or follow-up required" />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="text-sm font-medium text-navy-600 hover:text-navy-800 px-4 py-2 rounded-lg hover:bg-navy-50 transition-colors">Cancel</button>
          <button type="submit" disabled={isPending} className="inline-flex items-center gap-2 text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 px-5 py-2 rounded-xl transition-colors disabled:opacity-60">
            {isPending ? "Returning..." : "Return asset"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

export function AssetsClient({ assets, assignments, employees, isAdmin }: Props) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<CompanyAsset["status"] | "all">("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [returnTarget, setReturnTarget] = useState<{ asset: CompanyAsset; assignment: AssetAssignment } | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [todayMs] = useState(() => Date.now());
  const [isPending, startTransition] = useTransition();

  const employeeMap = useMemo(() => Object.fromEntries(employees.map((employee) => [employee.id, employee])), [employees]);
  const activeAssignmentMap = useMemo(() => {
    return Object.fromEntries(
      assignments
        .filter((assignment) => assignment.assignment_status === "assigned")
        .map((assignment) => [assignment.asset_id, assignment]),
    ) as Record<string, AssetAssignment | undefined>;
  }, [assignments]);

  const filteredAssets = assets.filter((asset) => {
    const assignment = activeAssignmentMap[asset.id];
    const employee = assignment ? employeeMap[assignment.employee_id] : null;
    const haystack = [asset.name, asset.asset_tag, asset.serial_number, asset.manufacturer, asset.model, employee?.full_name]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return (filter === "all" || asset.status === filter) && haystack.includes(query.toLowerCase());
  });

  const stats = {
    available: assets.filter((asset) => asset.status === "available").length,
    assigned: assets.filter((asset) => asset.status === "assigned").length,
    repair: assets.filter((asset) => asset.status === "repair").length,
    warrantyRisk: assets.filter((asset) => {
      if (!asset.warranty_expires) return false;
      const days = Math.ceil((new Date(asset.warranty_expires).getTime() - todayMs) / 86400000);
      return days >= 0 && days <= 45;
    }).length,
  };

  function markStatus(assetId: string, status: CompanyAsset["status"]) {
    setMessage(null);
    startTransition(async () => {
      const result = await updateAssetStatus(assetId, status);
      if (result?.error) setMessage(result.error);
    });
  }

  return (
    <div className="space-y-5">
      <div className="grid sm:grid-cols-4 gap-4">
        {[
          { label: "Available", value: stats.available, color: "text-emerald-700", bg: "bg-emerald-50" },
          { label: "Assigned", value: stats.assigned, color: "text-blue-700", bg: "bg-blue-50" },
          { label: "Repair", value: stats.repair, color: "text-amber-700", bg: "bg-amber-50" },
          { label: "Warranty risk", value: stats.warrantyRisk, color: "text-red-700", bg: "bg-red-50" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white border border-navy-200 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-navy-400">{stat.label}</p>
            <p className={`mt-2 font-mono text-3xl font-bold ${stat.color}`}>{stat.value}</p>
            <div className={`mt-4 h-1.5 rounded-full ${stat.bg}`} />
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-navy-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-navy-100 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-navy-900">Equipment inventory</h2>
            <p className="text-sm text-navy-500 mt-0.5">Know exactly which company assets are available, assigned, due back, or damaged.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="h-10 min-w-[240px] rounded-xl border border-navy-200 bg-white px-3 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              placeholder="Search asset, tag, serial, employee"
            />
            <Select
              value={filter}
              onChange={(value) => setFilter(value as CompanyAsset["status"] | "all")}
              options={[{ value: "all", label: "All statuses" }, ...STATUS_OPTIONS]}
              className="sm:w-44"
            />
            {isAdmin && (
              <div className="flex gap-2">
                <button type="button" onClick={() => setAssignOpen(true)} className="inline-flex items-center justify-center rounded-xl border border-navy-200 px-4 py-2 text-sm font-semibold text-navy-700 hover:bg-navy-50 transition-colors">
                  Assign
                </button>
                <button type="button" onClick={() => setCreateOpen(true)} className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors">
                  Add asset
                </button>
              </div>
            )}
          </div>
        </div>

        {message && <div className="mx-5 mt-5 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{message}</div>}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-sm">
            <thead>
              <tr className="bg-navy-50/80 border-b border-navy-100 text-left text-[11px] uppercase tracking-widest text-navy-400">
                <th className="px-5 py-3 font-bold">Asset</th>
                <th className="px-5 py-3 font-bold">Assigned to</th>
                <th className="px-5 py-3 font-bold">Condition</th>
                <th className="px-5 py-3 font-bold">Warranty</th>
                <th className="px-5 py-3 font-bold">Value</th>
                <th className="px-5 py-3 font-bold">Status</th>
                {isAdmin && <th className="px-5 py-3 font-bold text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-100">
              {filteredAssets.length > 0 ? filteredAssets.map((asset) => {
                const assignment = activeAssignmentMap[asset.id];
                const employee = assignment ? employeeMap[assignment.employee_id] : null;
                return (
                  <tr key={asset.id} className="hover:bg-navy-50/40 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-navy-900 truncate">{asset.name}</p>
                          <p className="text-xs text-navy-400 font-mono truncate">
                            {labelFor(ASSET_TYPES, asset.asset_type)}
                            {asset.asset_tag ? ` - ${asset.asset_tag}` : ""}
                            {asset.serial_number ? ` - SN ${asset.serial_number}` : ""}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {employee && assignment ? (
                        <div>
                          <p className="font-semibold text-navy-800">{employee.full_name}</p>
                          <p className="text-xs text-navy-400">
                            Since {formatDate(assignment.assigned_at)}
                            {assignment.return_due_at ? ` - due ${formatDate(assignment.return_due_at)}` : ""}
                          </p>
                        </div>
                      ) : (
                        <span className="text-navy-400">Unassigned</span>
                      )}
                    </td>
                    <td className="px-5 py-4 capitalize text-navy-700">{asset.condition.replace(/_/g, " ")}</td>
                    <td className="px-5 py-4 text-navy-700">{formatDate(asset.warranty_expires)}</td>
                    <td className="px-5 py-4 font-mono text-navy-700">{formatMoney(asset.purchase_cost, asset.currency)}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold capitalize ${STATUS_STYLE[asset.status]}`}>
                        {asset.status}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {assignment ? (
                            <button type="button" onClick={() => setReturnTarget({ asset, assignment })} className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors">
                              Return
                            </button>
                          ) : (
                            <>
                              {asset.status === "repair" || asset.status === "retired" ? (
                                <button type="button" disabled={isPending} onClick={() => markStatus(asset.id, "available")} className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors disabled:opacity-60">
                                  Make available
                                </button>
                              ) : null}
                              {asset.status === "available" ? (
                                <button type="button" disabled={isPending} onClick={() => markStatus(asset.id, "repair")} className="rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 transition-colors disabled:opacity-60">
                                  Repair
                                </button>
                              ) : null}
                            </>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="px-5 py-12 text-center">
                    <p className="text-sm font-semibold text-navy-700">No assets found.</p>
                    <p className="text-sm text-navy-400 mt-1">Add laptops, phones, access cards, or software licenses to start tracking equipment.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {createOpen && <CreateAssetModal onClose={() => setCreateOpen(false)} />}
      {assignOpen && <AssignAssetModal assets={assets} employees={employees} onClose={() => setAssignOpen(false)} />}
      {returnTarget && <ReturnAssetModal asset={returnTarget.asset} assignment={returnTarget.assignment} onClose={() => setReturnTarget(null)} />}
    </div>
  );
}
