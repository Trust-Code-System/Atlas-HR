"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AtlasAiMark } from "@/components/atlas-ai-mark";
import { MarkdownContent } from "@/components/ai/markdown-content";
import { ActionsPanel, type ProposedAction } from "@/components/ai/actions-panel";
import { cn } from "@/lib/utils";

interface WidgetSkill {
  id: string;
  name: string;
  placeholder: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  actions?: ProposedAction[];
}

interface Props {
  enabledSkills: WidgetSkill[];
}

export function AtlasAiWidget({ enabledSkills }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeSkill, setActiveSkill] = useState<WidgetSkill | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);

  // Conversation history — shares the same backend as the full /copilot page.
  const [historyOpen, setHistoryOpen] = useState(false);
  const [conversations, setConversations] = useState<{ id: string; title: string; updated_at: string }[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  // Inline action proposals the user has dismissed (keyed by assistant msg id).
  const [dismissedActions, setDismissedActions] = useState<Set<string>>(new Set());

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  // The full-page assistant already lives at /copilot — don't double up there.
  if (pathname?.startsWith("/copilot")) return null;

  function reset() {
    setMessages([]);
    setConversationId(null);
    setActiveSkill(null);
    setInput("");
    setHistoryOpen(false);
  }

  async function openHistory() {
    setHistoryOpen(true);
    setHistoryLoading(true);
    try {
      const res = await fetch("/api/copilot/conversations");
      const data = await res.json();
      if (res.ok) setConversations(data.conversations ?? []);
    } catch {
      /* ignore — panel shows empty state */
    } finally {
      setHistoryLoading(false);
    }
  }

  async function loadConversation(id: string) {
    try {
      const res = await fetch(`/api/copilot/conversations/${id}`);
      const data = await res.json();
      if (!res.ok) return;
      setMessages(
        (data.messages ?? []).map((m: { role: "user" | "assistant"; content: string }) => ({
          id: crypto.randomUUID(),
          role: m.role,
          content: m.content,
        })),
      );
      setConversationId(id);
      setActiveSkill(null);
      setInput("");
      setHistoryOpen(false);
    } catch {
      /* ignore */
    }
  }

  function pickSkill(skill: WidgetSkill) {
    setActiveSkill((prev) => (prev?.id === skill.id ? null : skill));
    setTimeout(() => textareaRef.current?.focus(), 30);
  }

  async function sendViaCopilot(history: Message[], assistantId: string) {
    const res = await fetch("/api/copilot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: history.map((m) => ({ role: m.role, content: m.content })),
        conversationId,
        context: "The user is chatting from the compact in-app Atlas AI panel. Keep answers focused and practical.",
      }),
    });

    if (!res.ok || !res.body) {
      const err = await res.json().catch(() => ({}));
      const reason = err?.reason ?? "Something went wrong. Please try again.";
      setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: `⚠️ ${reason}` } : m)));
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
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
            setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + event.text } : m)));
          } else if (event.type === "actions") {
            setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, actions: event.actions } : m)));
          } else if (event.type === "done" && event.conversationId) {
            setConversationId(event.conversationId);
          }
        } catch {
          /* skip malformed */
        }
      }
    }
  }

  async function sendViaSkill(skill: WidgetSkill, prompt: string, assistantId: string) {
    const res = await fetch("/api/skills/invoke", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skillId: skill.id, prompt }),
    });
    if (!res.ok || !res.body) {
      const err = await res.json().catch(() => ({}));
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantId ? { ...m, content: `⚠️ ${err?.error ?? "Skill failed."}` } : m)),
      );
      return;
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const text = decoder.decode(value, { stream: true });
      setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + text } : m)));
    }
  }

  async function send() {
    const content = input.trim();
    if (!content || loading) return;

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content };
    const assistantId = crypto.randomUUID();
    const skillForThisSend = activeSkill;
    const nextHistory = [...messages, userMsg];

    setMessages([...nextHistory, { id: assistantId, role: "assistant", content: "" }]);
    setInput("");
    setLoading(true);

    try {
      if (skillForThisSend) {
        await sendViaSkill(skillForThisSend, content, assistantId);
      } else {
        await sendViaCopilot(nextHistory, assistantId);
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantId ? { ...m, content: "Something went wrong. Please try again." } : m)),
      );
    } finally {
      setLoading(false);
      // If nothing streamed back (timeout / empty response), replace the
      // perpetual typing indicator with a recoverable message.
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId && m.role === "assistant" && !m.content.trim()
            ? { ...m, content: "I couldn't generate a response just now. Please try again." }
            : m,
        ),
      );
    }
  }

  return (
    <>
      {/* Floating launcher */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open Atlas AI"
          className="group fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-500 pl-3 pr-4 py-3 text-white shadow-lg shadow-blue-600/30 ring-1 ring-white/20 transition-all hover:shadow-xl hover:shadow-blue-600/40 hover:-translate-y-0.5"
        >
          <span className="flex h-6 w-6 items-center justify-center">
            <AtlasAiMark className="h-5 w-5" />
          </span>
          <span className="text-sm font-semibold">Ask Atlas AI</span>
        </button>
      )}

      {/* Slide-over panel */}
      {open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" onClick={() => setOpen(false)} />
          <div className="relative flex h-full w-full max-w-md flex-col bg-[#f8fafc] shadow-2xl">
            {/* Header */}
            <div className="relative shrink-0 overflow-hidden bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 px-4 py-3">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.18),transparent_60%)]" />
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-cyan-400 text-white ring-2 ring-white/20">
                    <AtlasAiMark className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold leading-tight text-white">Atlas AI</h2>
                    <p className="text-[11px] leading-tight text-blue-300/80">Your HR assistant, on every page</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => (historyOpen ? setHistoryOpen(false) : void openHistory())}
                    title="Conversation history"
                    className={cn(
                      "rounded-lg p-1.5 transition-colors hover:bg-white/10 hover:text-white",
                      historyOpen ? "bg-white/10 text-white" : "text-blue-200/80",
                    )}
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                  {messages.length > 0 && (
                    <button
                      type="button"
                      onClick={reset}
                      title="New chat"
                      className="rounded-lg p-1.5 text-blue-200/80 transition-colors hover:bg-white/10 hover:text-white"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  )}
                  <Link
                    href="/copilot"
                    title="Open full Atlas AI"
                    className="rounded-lg p-1.5 text-blue-200/80 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                  </Link>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label="Close Atlas AI"
                    className="rounded-lg p-1.5 text-blue-200/80 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* History panel — overlays the message list within the slide-over */}
            {historyOpen && (
              <div className="flex-1 overflow-y-auto bg-white">
                <div className="sticky top-0 flex items-center justify-between border-b border-navy-100 bg-white px-4 py-3">
                  <p className="text-sm font-bold text-navy-900">Conversations</p>
                  <button
                    type="button"
                    onClick={reset}
                    className="flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    New chat
                  </button>
                </div>
                {historyLoading ? (
                  <div className="flex items-center justify-center gap-2 py-10 text-sm text-navy-400">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Loading…
                  </div>
                ) : conversations.length > 0 ? (
                  <div className="divide-y divide-navy-50">
                    {conversations.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => void loadConversation(c.id)}
                        className={cn(
                          "w-full px-4 py-3 text-left transition-colors hover:bg-blue-50",
                          c.id === conversationId && "bg-blue-50",
                        )}
                      >
                        <p className="truncate text-sm font-medium text-navy-800">{c.title || "Untitled chat"}</p>
                        <p className="text-[11px] text-navy-400">
                          {new Date(c.updated_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="px-4 py-10 text-center text-sm text-navy-400">No saved conversations yet.</p>
                )}
              </div>
            )}

            {/* Messages */}
            <div className={cn("flex-1 overflow-y-auto px-4 py-4", historyOpen && "hidden")}>
              {messages.length === 0 ? (
                <div className="flex h-full flex-col">
                  <p className="text-sm text-navy-600">
                    Hi! I&apos;m <span className="font-semibold text-navy-900">Atlas</span>. Ask me anything about HR — drafting
                    documents, employment law, payroll, performance, or your people.
                  </p>
                  <div className="mt-4 space-y-2">
                    {[
                      "Draft a warm welcome email for a new hire",
                      "What should a UK redundancy process include?",
                      "Summarise best practice for performance reviews",
                    ].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => {
                          setInput(s);
                          setTimeout(() => textareaRef.current?.focus(), 20);
                        }}
                        className="w-full rounded-xl border border-navy-150 bg-white px-3 py-2.5 text-left text-[13px] text-navy-600 transition-all hover:border-blue-300 hover:bg-blue-50 hover:text-blue-800"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((m) => (
                    <div key={m.id}>
                      <div className={cn("flex gap-2", m.role === "user" ? "flex-row-reverse" : "flex-row")}>
                        <div
                          className={cn(
                            "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-bold",
                            m.role === "user"
                              ? "bg-navy-800 text-white"
                              : "bg-gradient-to-br from-blue-600 to-cyan-500 text-white",
                          )}
                        >
                          {m.role === "user" ? "YOU" : <AtlasAiMark className="h-3.5 w-3.5" />}
                        </div>
                        <div
                          className={cn(
                            "max-w-[85%] rounded-2xl px-3 py-2 text-[13px] leading-relaxed",
                            m.role === "user"
                              ? "rounded-tr-sm bg-navy-900 text-white"
                              : "rounded-tl-sm border border-navy-200 bg-white text-navy-700",
                          )}
                        >
                          {m.role === "assistant" && !m.content ? (
                            <div className="flex gap-1 py-1">
                              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-navy-300 [animation-delay:0ms]" />
                              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-navy-300 [animation-delay:150ms]" />
                              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-navy-300 [animation-delay:300ms]" />
                            </div>
                          ) : m.role === "user" ? (
                            <span className="whitespace-pre-wrap">{m.content}</span>
                          ) : (
                            <MarkdownContent text={m.content} />
                          )}
                        </div>
                      </div>

                      {/* Inline action proposals pushed by Atlas — shown automatically. */}
                      {m.role === "assistant" && m.actions && m.actions.length > 0 && !dismissedActions.has(m.id) && (
                        <div className="mt-1.5 pl-8">
                          <ActionsPanel
                            initialActions={m.actions}
                            onClose={() => setDismissedActions((prev) => new Set(prev).add(m.id))}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>
              )}
            </div>

            {/* Enabled skills quick-launch */}
            {enabledSkills.length > 0 && (
              <div className="shrink-0 border-t border-navy-100 bg-white px-4 pt-2.5">
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-navy-400">Run a skill</p>
                <div className="flex flex-wrap gap-1.5 pb-2.5">
                  {enabledSkills.map((skill) => (
                    <button
                      key={skill.id}
                      type="button"
                      onClick={() => pickSkill(skill)}
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all",
                        activeSkill?.id === skill.id
                          ? "border-blue-600 bg-blue-600 text-white"
                          : "border-navy-200 bg-white text-navy-600 hover:border-blue-300 hover:text-blue-700",
                      )}
                    >
                      {skill.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Composer */}
            <div
              className={cn(
                "shrink-0 bg-white px-4 py-3",
                enabledSkills.length > 0 ? "border-t-0" : "border-t border-navy-100",
              )}
            >
              {activeSkill && (
                <div className="mb-2 flex items-center justify-between rounded-lg bg-blue-50 px-2.5 py-1.5">
                  <span className="text-[11px] font-medium text-blue-700">Skill: {activeSkill.name}</span>
                  <button
                    type="button"
                    onClick={() => setActiveSkill(null)}
                    className="text-[11px] text-blue-500 hover:text-blue-700"
                  >
                    Clear
                  </button>
                </div>
              )}
              <div className="flex items-end gap-2">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    e.currentTarget.style.height = "auto";
                    e.currentTarget.style.height = `${Math.min(e.currentTarget.scrollHeight, 120)}px`;
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  rows={1}
                  disabled={loading}
                  placeholder={activeSkill ? activeSkill.placeholder : "Ask Atlas anything…"}
                  className="min-h-[40px] flex-1 resize-none rounded-xl border border-navy-200 bg-navy-50 px-3 py-2.5 text-[13px] text-navy-900 placeholder:text-navy-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={send}
                  disabled={!input.trim() || loading}
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all",
                    !input.trim() || loading
                      ? "cursor-not-allowed bg-navy-100 text-navy-300"
                      : "bg-blue-600 text-white hover:bg-blue-700",
                  )}
                  aria-label="Send"
                >
                  {loading ? (
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  )}
                </button>
              </div>
              <p className="mt-1.5 text-center text-[10px] text-navy-400">
                AI can make mistakes — verify important HR & legal advice.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
