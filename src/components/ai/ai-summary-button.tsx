"use client";

import { useCallback, useRef, useState } from "react";
import { AiMarkdown } from "./ai-markdown";

interface Props {
  /** GET endpoint that streams plain text (e.g. /api/ai/profile-summary?id=…). */
  endpoint: string;
  /** Heading shown in the modal. */
  title: string;
  /** Label on the trigger button. */
  buttonLabel: string;
  /** Optional className override for the trigger button. */
  className?: string;
  /** Optional sub-heading inside the modal. */
  subtitle?: string;
}

const SPARKLE = "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z";

export function AiSummaryButton({ endpoint, title, buttonLabel, className, subtitle }: Props) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const run = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setText("");
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(endpoint, { signal: controller.signal });
      if (!res.ok || !res.body) {
        let msg = "Couldn't generate this summary.";
        try {
          const j = await res.json();
          if (j?.error) msg = j.error;
        } catch { /* keep default */ }
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
    } catch (err) {
      if ((err as Error)?.name !== "AbortError") setError("Something went wrong generating the summary.");
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  function openModal() {
    setOpen(true);
    void run();
  }

  function close() {
    abortRef.current?.abort();
    setOpen(false);
  }

  function copy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className={
          className ??
          "inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors ring-1 ring-white/15 shrink-0"
        }
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d={SPARKLE} />
        </svg>
        {buttonLabel}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-navy-950/40 backdrop-blur-sm" onClick={close} />
          <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-navy-200 overflow-hidden">
            <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-navy-100 bg-navy-50/50">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-8 w-8 rounded-xl bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white shrink-0">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={SPARKLE} />
                  </svg>
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm font-bold text-navy-900 truncate">{title}</h2>
                  {subtitle && <p className="text-xs text-navy-500 truncate">{subtitle}</p>}
                </div>
              </div>
              <button type="button" onClick={close} className="text-navy-400 hover:text-navy-700 transition-colors" aria-label="Close">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              {error ? (
                <div className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  <svg className="h-4 w-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              ) : text ? (
                <AiMarkdown text={text} />
              ) : (
                <div className="flex items-center gap-2 text-sm text-navy-400 py-8 justify-center">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Generating with Atlas AI…
                </div>
              )}
              {loading && text && (
                <span className="inline-block w-2 h-4 bg-blue-500 animate-pulse align-middle ml-0.5" />
              )}
            </div>

            <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-navy-100 bg-navy-50/40">
              <p className="text-[11px] text-navy-400">AI-generated · verify before acting on it.</p>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => void run()} disabled={loading}
                  className="text-xs font-semibold text-navy-600 hover:text-navy-900 px-3 py-1.5 rounded-lg hover:bg-navy-100 transition-colors disabled:opacity-50">
                  Regenerate
                </button>
                <button type="button" onClick={copy} disabled={!text || loading}
                  className="text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
