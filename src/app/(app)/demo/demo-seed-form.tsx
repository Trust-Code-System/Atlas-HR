"use client";

import { useActionState } from "react";
import { seedDemoWorkspace, clearDemoWorkspace, type DemoSeedResult } from "./actions";

const initialState: DemoSeedResult = null;

export function DemoSeedForm() {
  const [seedState, seedAction, seedPending] = useActionState(seedDemoWorkspace, initialState);
  const [clearState, clearAction, clearPending] = useActionState(clearDemoWorkspace, initialState);

  const state = seedState ?? clearState;

  return (
    <div>
      <div className="mt-6 flex flex-wrap gap-3">
        <form action={seedAction}>
          <button
            type="submit"
            disabled={seedPending || clearPending}
            className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {seedPending ? "Loading demo data..." : "Load demo data"}
          </button>
        </form>

        <form action={clearAction}>
          <button
            type="submit"
            disabled={seedPending || clearPending}
            className="inline-flex items-center justify-center rounded-xl border border-navy-200 bg-white px-4 py-2.5 text-sm font-semibold text-navy-700 shadow-xs transition-colors hover:bg-navy-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {clearPending ? "Removing demo data..." : "Turn off demo data"}
          </button>
        </form>
      </div>

      <p className="mt-2 text-xs text-navy-400">
        Turning off demo data removes only the Atlas demo records — your real employees and data are left untouched.
      </p>

      {state?.error ? (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {state.error}
        </div>
      ) : null}

      {seedState?.success ? (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <p className="text-sm font-semibold text-emerald-800">Demo data loaded.</p>
          {seedState.summary ? (
            <p className="mt-1 text-sm text-emerald-700">{seedState.summary.join(" • ")}</p>
          ) : null}
        </div>
      ) : null}

      {clearState?.success ? (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <p className="text-sm font-semibold text-emerald-800">Demo data turned off.</p>
          {clearState.summary ? (
            <p className="mt-1 text-sm text-emerald-700">{clearState.summary.join(" • ")}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
