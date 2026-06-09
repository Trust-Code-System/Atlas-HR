"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AiMarkdown } from "@/components/ai/ai-markdown";

/** Auto-runs the Manager Assistant brief and streams it inline. */
export function ManagerBriefPanel() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  const run = useCallback(async () => {
    setText("");
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/ai/manager-brief");
      if (!res.ok || !res.body) {
        let msg = "Couldn't generate your team brief.";
        try { const j = await res.json(); if (j?.error) msg = j.error; } catch { /* default */ }
        setError(msg);
        setLoading(false);
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setText(acc);
      }
    } catch {
      setError("Something went wrong generating your team brief.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void run();
  }, [run]);

  return (
    <div className="bg-white rounded-2xl border border-navy-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-navy-100 bg-navy-50/50">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h2 className="text-sm font-bold text-navy-900">What&apos;s pending for my team</h2>
        </div>
        <button type="button" onClick={() => void run()} disabled={loading}
          className="text-xs font-semibold text-navy-600 hover:text-navy-900 px-3 py-1.5 rounded-lg hover:bg-navy-100 transition-colors disabled:opacity-50">
          Refresh
        </button>
      </div>
      <div className="px-6 py-5">
        {error ? (
          <p className="text-sm text-navy-500">{error}</p>
        ) : text ? (
          <AiMarkdown text={text} />
        ) : (
          <div className="flex items-center gap-2 text-sm text-navy-400 py-6 justify-center">
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Reviewing your team…
          </div>
        )}
        {loading && text && <span className="inline-block w-2 h-4 bg-blue-500 animate-pulse align-middle ml-0.5" />}
      </div>
    </div>
  );
}
