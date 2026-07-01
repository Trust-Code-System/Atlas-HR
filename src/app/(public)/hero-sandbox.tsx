"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { AtlasAiMark } from "@/components/atlas-ai-mark";
import { AiMarkdown } from "@/components/ai/ai-markdown";

// A real, anonymous mini version of Atlas AI embedded in the marketing hero.
// It streams a genuine answer from /api/copilot (which allows unauthenticated
// visitors, IP-rate-limited to a handful of questions per day, then prompts
// sign-up). This makes the page's "feel the value before the demo" promise
// literally true instead of a static mockup.

const SAMPLE_QUESTION = "What is the standard probation period in India?";

// Shown before the visitor asks anything — a realistic preview of the kind of
// answer Atlas gives. Replaced by the live streamed answer on first ask.
const SAMPLE_ANSWER_LINES = [
  "Probation is usually contract and state-rule driven in India.",
  "Atlas checks the state, role type, notice language, PF/ESI exposure, and confirmation workflow.",
  "Next action: generate the India offer pack and onboarding checklist.",
];

// Keep public-preview answers short and focused.
const PREVIEW_CONTEXT =
  "The user is trying Atlas AI from the public marketing homepage as a quick preview. " +
  "Answer the HR/compliance question directly in 3–5 short sentences. Be concrete and practical. " +
  "Do not ask clarifying questions; make reasonable assumptions and state them briefly.";

type Phase = "idle" | "streaming" | "done" | "limit" | "error";

export function HeroSandbox() {
  const [question, setQuestion] = useState("");
  const [asked, setAsked] = useState<string | null>(null);
  const [answer, setAnswer] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [limitReason, setLimitReason] = useState<string | null>(null);
  const inFlight = useRef(false);

  async function ask(text: string) {
    const q = text.trim();
    if (!q || inFlight.current) return;
    inFlight.current = true;
    setAsked(q);
    setAnswer("");
    setLimitReason(null);
    setPhase("streaming");

    try {
      const res = await fetch("/api/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: q }],
          context: PREVIEW_CONTEXT,
        }),
      });

      if (res.status === 429) {
        const err = await res.json().catch(() => ({}));
        setLimitReason(err?.reason ?? "Sign up for free to keep chatting with Atlas.");
        setPhase("limit");
        return;
      }

      if (!res.ok || !res.body) {
        setPhase("error");
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let got = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n");
        buffer = parts.pop() ?? "";
        for (const line of parts) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6));
            if (event.type === "chunk") {
              got += event.text;
              setAnswer(got);
            }
          } catch {
            /* skip malformed */
          }
        }
      }
      setPhase(got ? "done" : "error");
    } catch {
      setPhase("error");
    } finally {
      inFlight.current = false;
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    void ask(question);
  }

  const busy = phase === "streaming";
  const contractHref = asked
    ? `/sign-up?intent=generate-india-contract&q=${encodeURIComponent(asked).slice(0, 200)}`
    : "/sign-up?intent=generate-india-contract";

  return (
    <div className="relative">
      {/* Glow layer */}
      <div className="absolute -inset-6 rounded-[40px] bg-linear-to-br from-blue-400/20 via-blue-500/15 to-blue-600/10 blur-3xl" />
      {/* Floating top-right accent */}
      <div className="absolute -top-6 -right-6 h-24 w-24 rounded-3xl bg-linear-to-br from-blue-400 to-blue-600 opacity-20 rotate-12 blur-sm" />

      <div className="relative rounded-[28px] border border-slate-200/80 bg-white/80 p-6 shadow-2xl shadow-blue-900/10 backdrop-blur-xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="relative h-11 w-11 rounded-2xl bg-linear-to-br from-blue-500 via-blue-600 to-navy-800 flex items-center justify-center shadow-lg shadow-blue-600/30">
            <div className="absolute inset-0 rounded-2xl bg-white/10" />
            <AtlasAiMark className="h-[22px] w-[22px] text-white relative z-10" />
          </div>
          <div>
            <p className="text-sm font-bold text-navy-900">AI Compliance Sandbox</p>
            <p className="text-xs text-slate-400">Ask a real HR question — free, no sign-up</p>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <span className={`h-2 w-2 rounded-full bg-emerald-400 ${busy ? "animate-pulse" : ""}`} />
            <span className="text-[11px] font-semibold text-emerald-600">{busy ? "Thinking" : "Live"}</span>
          </div>
        </div>

        {/* Ask box */}
        <form onSubmit={onSubmit} className="mb-4">
          <div className="rounded-2xl bg-linear-to-br from-slate-50 to-blue-50/50 border border-blue-100/60 p-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-blue-500 mb-2 px-1">Ask Atlas</p>
            <div className="flex items-end gap-2">
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void ask(question);
                  }
                }}
                rows={2}
                maxLength={2000}
                placeholder={SAMPLE_QUESTION}
                className="min-h-[44px] flex-1 resize-none bg-transparent px-1 text-sm font-medium text-navy-800 placeholder:text-slate-400 focus:outline-none"
              />
              <button
                type="submit"
                disabled={busy || !question.trim()}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-blue-500 to-blue-700 text-white shadow-md shadow-blue-500/25 transition-opacity disabled:opacity-40"
                aria-label="Ask Atlas"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          </div>
          {phase === "idle" && (
            <button
              type="button"
              onClick={() => {
                setQuestion(SAMPLE_QUESTION);
                void ask(SAMPLE_QUESTION);
              }}
              className="mt-2 text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              Try: “{SAMPLE_QUESTION}”
            </button>
          )}
        </form>

        {/* Answer area */}
        <div className="mb-5 max-h-64 overflow-y-auto">
          {phase === "idle" ? (
            <div className="space-y-2.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1">Preview answer</p>
              {SAMPLE_ANSWER_LINES.map((line, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50/80 px-3.5 py-3 text-sm leading-relaxed text-slate-700"
                >
                  <span className="shrink-0 mt-0.5 h-4 w-4 rounded-full bg-linear-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                    <svg className="h-2.5 w-2.5 text-white" fill="currentColor" viewBox="0 0 8 8">
                      <circle cx="4" cy="4" r="3" />
                    </svg>
                  </span>
                  {line}
                </div>
              ))}
            </div>
          ) : phase === "limit" ? (
            <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-4 text-sm text-navy-800">
              <p className="font-semibold">{limitReason}</p>
              <p className="mt-1 text-slate-600">You&apos;ve used your free public questions for today.</p>
            </div>
          ) : phase === "error" ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-800">
              Something went wrong reaching Atlas AI. Please try again in a moment.
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-sm leading-relaxed text-slate-700">
              {answer ? (
                <AiMarkdown text={answer} />
              ) : (
                <span className="inline-flex items-center gap-1 text-slate-400">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-400 [animation-delay:-0.2s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-400 [animation-delay:-0.1s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-400" />
                </span>
              )}
            </div>
          )}
        </div>

        {/* CTA */}
        <Link
          href={phase === "limit" ? "/sign-up" : contractHref}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-navy-950 px-4 py-3.5 text-sm font-bold text-white hover:bg-navy-800 transition-colors"
        >
          <svg className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {phase === "limit" ? "Sign up free to keep going" : "Continue this in Atlas"}
        </Link>
      </div>
    </div>
  );
}
