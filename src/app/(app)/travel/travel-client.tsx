"use client";

import { useState, useTransition, useActionState, useEffect } from "react";
import { Select } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import type { TravelRequest, Employee } from "@/types/database";
import { submitTravelRequest, updateTravelStatus, attachBookingDetails, deleteTravelRequest } from "./actions";
import type { TravelActionResult } from "./actions";

type EmployeeRow = Pick<Employee, "id" | "full_name" | "job_title" | "department" | "status">;

interface Props {
  requests: TravelRequest[];
  employees: EmployeeRow[];
  isAdmin: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUSES: Record<string, { label: string; color: string }> = {
  draft:     { label: "Draft",     color: "bg-slate-100 text-slate-600" },
  pending:   { label: "Pending",   color: "bg-amber-100 text-amber-700" },
  approved:  { label: "Approved",  color: "bg-emerald-100 text-emerald-700" },
  rejected:  { label: "Rejected",  color: "bg-red-100 text-red-700" },
  cancelled: { label: "Cancelled", color: "bg-navy-100 text-navy-500" },
  completed: { label: "Completed", color: "bg-blue-100 text-blue-700" },
};

const CURRENCY_OPTIONS = ["USD", "GBP", "EUR", "NGN", "INR", "CAD", "AUD"].map((c) => ({ value: c, label: c }));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStatus(key: string) { return STATUSES[key] ?? STATUSES.pending; }
function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
function fmtAmount(amount: number | null, currency: string) {
  if (!amount) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: 0 }).format(amount);
}
function nightCount(checkIn: string | null, checkOut: string | null) {
  if (!checkIn || !checkOut) return null;
  return Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86_400_000);
}

const labelCls = "text-xs font-semibold text-navy-600 uppercase tracking-wide block mb-1.5";
const textareaCls = "flex w-full rounded-xl border border-navy-200 bg-white px-3 py-2.5 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-none";
const inputCls = "flex h-10 w-full rounded-xl border border-navy-200 bg-white px-3 py-2 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent";

// ─── Request Modal ────────────────────────────────────────────────────────────

function RequestTravelModal({ employees, onClose }: { employees: EmployeeRow[]; onClose: () => void }) {
  const [state, formAction, isPending] = useActionState<TravelActionResult, FormData>(submitTravelRequest, null);

  useEffect(() => { if (state?.success) onClose(); }, [state, onClose]);

  const employeeOptions = employees.map((e) => ({ value: e.id, label: e.full_name ?? e.id }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-navy-900">Request business travel</h2>
          <button type="button" aria-label="Close" onClick={onClose} className="text-navy-400 hover:text-navy-700 transition-colors">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form action={formAction} className="space-y-4">
          {state?.error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{state.error}</div>
          )}

          <div>
            <label className={labelCls}>Employee <span className="text-red-500">*</span></label>
            <Select
              name="employee_id"
              aria-label="Employee"
              placeholder="Select employee…"
              options={employeeOptions}
              required
            />
          </div>

          <div>
            <label className={labelCls}>Purpose <span className="text-red-500">*</span></label>
            <textarea name="purpose" required rows={2} placeholder="Reason for travel (e.g. client meeting, conference…)" aria-label="Purpose" className={textareaCls} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>From <span className="text-red-500">*</span></label>
              <input type="text" name="origin" required placeholder="Lagos, NG" aria-label="Origin city" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>To <span className="text-red-500">*</span></label>
              <input type="text" name="destination" required placeholder="London, UK" aria-label="Destination city" className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Departure <span className="text-red-500">*</span></label>
              <DatePicker name="departure_date" placeholder="Departure date" required />
            </div>
            <div>
              <label className={labelCls}>Return <span className="text-red-500">*</span></label>
              <DatePicker name="return_date" placeholder="Return date" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Estimated budget</label>
              <input type="number" name="estimated_budget" min="0" step="0.01" placeholder="0.00" aria-label="Estimated budget" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Currency</label>
              <Select
                name="currency"
                aria-label="Currency"
                options={CURRENCY_OPTIONS}
                defaultValue="USD"
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Additional notes</label>
            <textarea name="notes" rows={2} placeholder="Visa requirements, preferences, other context…" aria-label="Additional notes" className={textareaCls} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-navy-200 px-4 py-2.5 text-sm font-semibold text-navy-700 hover:bg-navy-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isPending} className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition-colors">
              {isPending ? "Submitting…" : "Submit request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Detail / Booking Modal ────────────────────────────────────────────────────

function TravelDetailModal({
  request,
  employees,
  isAdmin,
  onClose,
}: {
  request: TravelRequest;
  employees: EmployeeRow[];
  isAdmin: boolean;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"overview" | "booking">("overview");
  const [bookingState, bookingAction, isBookingPending] = useActionState<TravelActionResult, FormData>(attachBookingDetails, null);
  const [isPending, startTransition] = useTransition();

  const employee = employees.find((e) => e.id === request.employee_id);
  const st = getStatus(request.status);
  const nights = nightCount(request.check_in, request.check_out);
  const hasBooking = request.airline || request.hotel_name;

  useEffect(() => { if (bookingState?.success) onClose(); }, [bookingState, onClose]);

  function act(status: "approved" | "rejected" | "cancelled" | "completed") {
    startTransition(async () => {
      await updateTravelStatus(request.id, status);
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-navy-900">{request.destination}</h2>
            <p className="text-sm text-navy-500">{request.origin} → {request.destination}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${st.color}`}>{st.label}</span>
            <button type="button" aria-label="Close" onClick={onClose} className="text-navy-400 hover:text-navy-700 transition-colors">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 bg-navy-100 p-1 rounded-xl mb-4">
          {(["overview", "booking"] as const).map((t) => (
            <button key={t} type="button" onClick={() => setTab(t)}
              className={`flex-1 rounded-lg py-1.5 text-xs font-semibold capitalize transition-all ${
                tab === t ? "bg-white text-navy-900 shadow-sm" : "text-navy-500 hover:text-navy-800"
              }`}
            >
              {t === "booking" && hasBooking ? "Booking details ✓" : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {tab === "overview" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-3">
              <DetailRow label="Employee"   value={employee?.full_name ?? "—"} />
              <DetailRow label="Purpose"    value={request.purpose} />
              <DetailRow label="Departure"  value={fmtDate(request.departure_date)} />
              <DetailRow label="Return"     value={fmtDate(request.return_date)} />
              {request.estimated_budget != null && (
                <DetailRow label="Est. budget" value={fmtAmount(request.estimated_budget, request.currency)} />
              )}
              {request.actual_cost != null && (
                <DetailRow label="Actual cost" value={fmtAmount(request.actual_cost, request.currency)} bold />
              )}
              {request.notes && <DetailRow label="Notes" value={request.notes} />}
            </div>

            {request.approved_at && (
              <DetailRow
                label={request.status === "rejected" ? "Rejected on" : "Approved on"}
                value={fmtDate(request.approved_at)}
              />
            )}

            {/* Itinerary summary */}
            {hasBooking && (
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 space-y-2">
                <p className="text-xs font-bold uppercase tracking-wide text-emerald-700 mb-2">Itinerary confirmed</p>
                {request.airline && (
                  <p className="text-sm text-navy-700">
                    <span className="font-semibold">Flight:</span> {request.airline}
                    {request.flight_number && ` · ${request.flight_number}`}
                  </p>
                )}
                {request.hotel_name && (
                  <p className="text-sm text-navy-700">
                    <span className="font-semibold">Hotel:</span> {request.hotel_name}
                    {request.hotel_confirmation && ` · ${request.hotel_confirmation}`}
                    {nights !== null && ` · ${nights} night${nights !== 1 ? "s" : ""}`}
                  </p>
                )}
                {request.per_diem_rate != null && (
                  <p className="text-sm text-navy-700">
                    <span className="font-semibold">Per diem:</span> {fmtAmount(request.per_diem_rate, request.currency)}/day
                  </p>
                )}
              </div>
            )}

            {isAdmin && (
              <div className="flex gap-2 flex-wrap pt-1">
                {request.status === "pending" && (
                  <>
                    <button type="button" onClick={() => act("approved")} disabled={isPending}
                      className="flex-1 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 transition-colors">
                      Approve
                    </button>
                    <button type="button" onClick={() => act("rejected")} disabled={isPending}
                      className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60 transition-colors">
                      Reject
                    </button>
                  </>
                )}
                {request.status === "approved" && (
                  <>
                    <button type="button" onClick={() => setTab("booking")}
                      className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors">
                      {hasBooking ? "Edit itinerary" : "Add booking details"}
                    </button>
                    <button type="button" onClick={() => act("completed")} disabled={isPending}
                      className="flex-1 rounded-xl border border-navy-200 px-4 py-2.5 text-sm font-semibold text-navy-700 hover:bg-navy-50 disabled:opacity-60 transition-colors">
                      Mark completed
                    </button>
                  </>
                )}
                {(request.status === "pending" || request.status === "approved") && (
                  <button type="button" onClick={() => act("cancelled")} disabled={isPending}
                    className="rounded-xl border border-navy-200 px-4 py-2.5 text-sm font-semibold text-navy-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 disabled:opacity-60 transition-colors">
                    Cancel trip
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {tab === "booking" && (
          <form action={bookingAction} className="space-y-4">
            <input type="hidden" name="request_id" value={request.id} />
            {bookingState?.error && (
              <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{bookingState.error}</div>
            )}

            <p className="text-xs text-navy-500 font-medium">
              Enter flight and hotel details after booking. The employee will see this as their travel itinerary.
            </p>

            <fieldset className="space-y-3 rounded-xl border border-navy-100 p-4">
              <legend className="text-xs font-bold uppercase tracking-wide text-navy-500 px-1">Flight</legend>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Airline</label>
                  <input type="text" name="airline" defaultValue={request.airline ?? ""} placeholder="British Airways" aria-label="Airline" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Flight number</label>
                  <input type="text" name="flight_number" defaultValue={request.flight_number ?? ""} placeholder="BA0001" aria-label="Flight number" className={inputCls} />
                </div>
              </div>
            </fieldset>

            <fieldset className="space-y-3 rounded-xl border border-navy-100 p-4">
              <legend className="text-xs font-bold uppercase tracking-wide text-navy-500 px-1">Hotel</legend>
              <div>
                <label className={labelCls}>Hotel name</label>
                <input type="text" name="hotel_name" defaultValue={request.hotel_name ?? ""} placeholder="Hilton London Bankside" aria-label="Hotel name" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Confirmation code</label>
                <input type="text" name="hotel_confirmation" defaultValue={request.hotel_confirmation ?? ""} placeholder="HTL-ABC123" aria-label="Confirmation code" className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Check-in</label>
                  <DatePicker name="check_in" defaultValue={request.check_in ?? ""} placeholder="Check-in date" />
                </div>
                <div>
                  <label className={labelCls}>Check-out</label>
                  <DatePicker name="check_out" defaultValue={request.check_out ?? ""} placeholder="Check-out date" />
                </div>
              </div>
            </fieldset>

            <fieldset className="space-y-3 rounded-xl border border-navy-100 p-4">
              <legend className="text-xs font-bold uppercase tracking-wide text-navy-500 px-1">Costs</legend>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Per diem / day</label>
                  <input type="number" name="per_diem_rate" defaultValue={request.per_diem_rate ?? ""} min="0" step="0.01" placeholder="0.00" aria-label="Per diem rate" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Total actual cost</label>
                  <input type="number" name="actual_cost" defaultValue={request.actual_cost ?? ""} min="0" step="0.01" placeholder="0.00" aria-label="Total actual cost" className={inputCls} />
                </div>
              </div>
            </fieldset>

            <div>
              <label className={labelCls}>Booking notes</label>
              <textarea name="booking_notes" defaultValue={request.booking_notes ?? ""} rows={2}
                placeholder="Seat preferences, dietary requirements, visa arranged…"
                aria-label="Booking notes" className={textareaCls} />
            </div>

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => setTab("overview")} className="flex-1 rounded-xl border border-navy-200 px-4 py-2.5 text-sm font-semibold text-navy-700 hover:bg-navy-50 transition-colors">
                Back
              </button>
              <button type="submit" disabled={isBookingPending} className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition-colors">
                {isBookingPending ? "Saving…" : "Save itinerary"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function DetailRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`text-sm mt-0.5 ${bold ? "font-bold text-navy-900" : "text-navy-700"}`}>{value}</p>
    </div>
  );
}

// ─── Main Client ──────────────────────────────────────────────────────────────

export function TravelClient({ requests, employees, isAdmin }: Props) {
  const [showNew, setShowNew]   = useState(false);
  const [selected, setSelected] = useState<TravelRequest | null>(null);
  const [filter, setFilter]     = useState<string>("all");
  const [isPending, startTransition] = useTransition();

  const tabs = [
    { key: "all",       label: "All",       count: requests.length },
    { key: "pending",   label: "Pending",   count: requests.filter((r) => r.status === "pending").length },
    { key: "approved",  label: "Approved",  count: requests.filter((r) => r.status === "approved").length },
    { key: "completed", label: "Completed", count: requests.filter((r) => r.status === "completed").length },
    { key: "rejected",  label: "Rejected",  count: requests.filter((r) => r.status === "rejected").length },
  ];

  const filtered = filter === "all" ? requests : requests.filter((r) => r.status === filter);
  const today = new Date().toISOString().split("T")[0];

  function isCurrentlyTravelling(r: TravelRequest) {
    return r.status === "approved" && r.departure_date <= today && r.return_date >= today;
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this travel request?")) return;
    startTransition(() => { void deleteTravelRequest(id); });
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div className="flex gap-1 bg-navy-100 p-1 rounded-xl flex-wrap">
          {tabs.map((t) => (
            <button key={t.key} type="button" onClick={() => setFilter(t.key)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                filter === t.key ? "bg-white text-navy-900 shadow-sm" : "text-navy-500 hover:text-navy-800"
              }`}
            >
              {t.label}
              {t.count > 0 && (
                <span className={`rounded-full px-1.5 text-[10px] font-bold ${filter === t.key ? "bg-blue-100 text-blue-700" : "bg-navy-200 text-navy-600"}`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
        <button type="button" onClick={() => setShowNew(true)}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          New request
        </button>
      </div>

      {/* Cards grid */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-navy-200 py-16 text-center">
          <svg className="mx-auto h-10 w-10 text-navy-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
          <p className="text-sm font-semibold text-navy-400">No travel requests yet</p>
          <p className="mt-1 text-xs text-navy-300">Create one to get started</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((req) => {
            const employee = employees.find((e) => e.id === req.employee_id);
            const st = getStatus(req.status);
            const travelling = isCurrentlyTravelling(req);
            const hasBooking = req.airline || req.hotel_name;

            return (
              <div
                key={req.id}
                className="relative rounded-2xl border border-navy-100 bg-white p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                onClick={() => setSelected(req)}
              >
                {travelling && (
                  <div className="absolute inset-x-0 top-0 h-[3px] rounded-t-2xl bg-linear-to-r from-emerald-400 to-teal-500" />
                )}

                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                      <svg className="h-[18px] w-[18px] text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-navy-400">{employee?.full_name ?? "—"}</p>
                      <p className="text-sm font-bold text-navy-900 leading-tight">{req.destination}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${st.color}`}>{st.label}</span>
                    {travelling && (
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold bg-emerald-100 text-emerald-700">
                        In transit
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-xs text-navy-500 leading-relaxed mb-3 line-clamp-2">{req.purpose}</p>

                <div className="flex items-center gap-3 text-xs text-navy-400 mb-3">
                  <span>
                    <span className="font-semibold text-navy-600">{fmtDate(req.departure_date)}</span>
                    {" → "}
                    {fmtDate(req.return_date)}
                  </span>
                </div>

                {req.estimated_budget != null && (
                  <p className="text-xs text-navy-400">
                    Budget: <span className="font-semibold text-navy-700">{fmtAmount(req.estimated_budget, req.currency)}</span>
                  </p>
                )}

                {hasBooking && (
                  <div className="mt-3 pt-3 border-t border-navy-50 flex items-center gap-1.5">
                    <svg className="h-3.5 w-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-[11px] font-semibold text-emerald-600">Itinerary ready</span>
                  </div>
                )}

                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleDelete(req.id); }}
                      disabled={isPending}
                      className="rounded-lg p-1.5 text-navy-300 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                      title="Delete"
                      aria-label="Delete travel request"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showNew && <RequestTravelModal employees={employees} onClose={() => setShowNew(false)} />}
      {selected && (
        <TravelDetailModal
          request={selected}
          employees={employees}
          isAdmin={isAdmin}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}
