"use client";

import { useTransition } from "react";
import { closeSurvey } from "../actions";

export function SurveyActions({ surveyId }: { surveyId: string }) {
  const [pending, startClose] = useTransition();

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => startClose(async () => { await closeSurvey(surveyId); })}
        disabled={pending}
        className="inline-flex items-center gap-1.5 text-sm font-medium bg-navy-700 hover:bg-navy-900 text-white px-4 py-2 rounded-xl transition-colors disabled:opacity-60"
      >
        {pending && (
          <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        Close survey
      </button>
      <p className="text-xs text-navy-400">Closing prevents new responses.</p>
    </div>
  );
}
