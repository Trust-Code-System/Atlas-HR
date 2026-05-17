"use client";

import { useTransition } from "react";
import { approvePayrollRun, markPayrollRunPaid } from "../actions";

export function PayrollActions({
  runId,
  status,
}: {
  runId: string;
  status: "draft" | "processing" | "approved" | "paid";
}) {
  const [approvePending, startApprove] = useTransition();
  const [paidPending, startPaid] = useTransition();

  return (
    <div className="flex items-center gap-3">
      {status === "draft" && (
        <button
          onClick={() => startApprove(async () => { await approvePayrollRun(runId); })}
          disabled={approvePending}
          className="inline-flex items-center gap-1.5 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-colors disabled:opacity-60"
        >
          {approvePending && (
            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          Approve payroll
        </button>
      )}
      {status === "approved" && (
        <button
          onClick={() => startPaid(async () => { await markPayrollRunPaid(runId); })}
          disabled={paidPending}
          className="inline-flex items-center gap-1.5 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-colors disabled:opacity-60"
        >
          {paidPending && (
            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          Mark as paid
        </button>
      )}
      <p className="text-xs text-navy-400">
        {status === "draft" && "Approve to lock entries before disbursement."}
        {status === "approved" && "Mark as paid once funds have been disbursed."}
      </p>
    </div>
  );
}
