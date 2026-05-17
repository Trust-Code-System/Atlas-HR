"use client";

import { useActionState } from "react";
import { seedDemoWorkspace, type DemoSeedResult } from "./actions";

const initialState: DemoSeedResult = null;

export function DemoSeedForm() {
  const [state, formAction, isPending] = useActionState(seedDemoWorkspace, initialState);

  return (
    <div>
      <form action={formAction} className="mt-6">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Loading demo data..." : "Load demo data"}
        </button>
      </form>

      {state?.error ? (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {state.error}
        </div>
      ) : null}

      {state?.success ? (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <p className="text-sm font-semibold text-emerald-800">Demo data loaded.</p>
          {state.summary ? (
            <p className="mt-1 text-sm text-emerald-700">{state.summary.join(" • ")}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
