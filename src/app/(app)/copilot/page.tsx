"use client";

import { Suspense, useState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { AtlasAiMark } from "@/components/atlas-ai-mark";
import { MarkdownContent } from "@/components/ai/markdown-content";
import { cn } from "@/lib/utils";
import { buildWorkflowCopilotPrompt, getWorkflowBundle } from "@/lib/public-resource-data";

// ─── Types ────────────────────────────────────────────────────────────────────

type Mode = "chat" | "draft" | "research" | "analyse";

interface Source {
  title: string;
  kind?: "article" | "document";
  slug?: string;
  category?: string;
  docId?: string;
}

interface Attachment {
  id: string;
  name: string;
  mediaType: string;
  size: number;
  kind: "image" | "pdf" | "text";
  data?: string;
  text?: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isThinking?: boolean;
  sources?: Source[];
  attachments?: Attachment[];
}

// ─── Mode config ──────────────────────────────────────────────────────────────

const MODES: { id: Mode; label: string; desc: string; color: string; icon: React.ReactNode }[] = [
  {
    id: "chat",
    label: "Chat",
    desc: "Ask anything — advice, guidance, policies, people situations",
    color: "blue",
    icon: (
      <AtlasAiMark className="h-4 w-4" />
    ),
  },
  {
    id: "draft",
    label: "Draft",
    desc: "Generate complete HR documents ready to use",
    color: "blue",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    id: "research",
    label: "Research",
    desc: "Employment law, salary benchmarks, compliance, HR trends",
    color: "violet",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    id: "analyse",
    label: "Analyse",
    desc: "Paste any HR document for structured review and feedback",
    color: "amber",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
];

const MODE_CONTEXT: Record<Mode, string> = {
  chat: "",
  draft: "The user is in Document Drafting mode. When asked to draft a document, produce the FULL, COMPLETE document ready to copy and use immediately — not an outline, not a summary. Use clear section headers, numbered clauses where appropriate, and professional language. Always end with a brief disclaimer: 'Review this document with your HR/legal team before use.'",
  research: "The user is in Research mode. They want thorough, accurate research on HR topics, employment law, salary data, and compliance. Structure all responses with clear headers. Cite specific laws, figures, and regulations where known. Always note that key compliance decisions should be verified with local legal counsel.",
  analyse: "The user is in Analysis mode. They will paste HR documents or text for structured review. Always respond with: (1) Executive Summary, (2) Strengths, (3) Risks & Gaps, (4) Specific Recommendations with line-level detail. Be direct and specific — name exact issues and suggest exact fixes.",
};

const MODE_SUGGESTIONS: Record<Mode, string[]> = {
  chat: [
    "How do I handle an employee who is consistently underperforming?",
    "What's best practice for a return-to-work interview after long-term sick leave?",
    "Help me prepare talking points for a difficult performance conversation",
    "When should I involve a lawyer in an employee relations matter?",
    "How do I build a fair, transparent salary banding structure?",
    "What makes an effective and legally safe offboarding process?",
  ],
  draft: [
    "Job description for a Senior Product Manager in Lagos, Nigeria",
    "Offer letter for a Software Engineer, £85,000/year, hybrid, London",
    "First written warning for repeated unauthorised absence",
    "30/60/90 day onboarding plan for a new Head of Sales",
    "Remote work policy for a 60-person tech company",
    "Redundancy letter for a UK-based employee (restructuring)",
  ],
  research: [
    "What is the National Minimum Wage in Nigeria in 2026?",
    "Explain UK statutory redundancy pay calculation with examples",
    "What does GDPR require for employee personal data storage?",
    "Competitive salary range for a CHRO / HR Director in Nairobi",
    "Minimum notice period requirements under Nigeria Labour Act 2004",
    "Compare maternity leave entitlements: UK, US, Nigeria, Kenya, India",
  ],
  analyse: [
    "Review this job description for gender bias and exclusionary language [paste below]",
    "Check this employment contract for missing standard clauses [paste below]",
    "Score this candidate CV against the following job requirements [paste below]",
    "Identify legal risks and missing elements in this disciplinary letter [paste below]",
    "Review this performance review form for potential bias [paste below]",
    "Identify compliance gaps in this data privacy policy [paste below]",
  ],
};

const MODE_ACTIVE_STYLES: Record<Mode, string> = {
  chat: "border-blue-500 text-blue-600",
  draft: "border-blue-600 text-blue-700",
  research: "border-violet-500 text-violet-700",
  analyse: "border-amber-500 text-amber-700",
};

const MODE_BG: Record<Mode, string> = {
  chat: "bg-blue-50",
  draft: "bg-blue-50",
  research: "bg-violet-50",
  analyse: "bg-amber-50",
};

const MODE_ICON_BG: Record<Mode, string> = {
  chat: "bg-blue-600",
  draft: "bg-blue-600",
  research: "bg-violet-600",
  analyse: "bg-amber-500",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SUPPORTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);
const SUPPORTED_TEXT_TYPES = new Set([
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/json",
  "application/xml",
  "text/xml",
]);
const MAX_ATTACHMENTS = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function readAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

function dataUrlToBase64(dataUrl: string): string {
  return dataUrl.split(",")[1] ?? "";
}

function attachmentLabel(file: Attachment): string {
  if (file.kind === "image") return "Image";
  if (file.kind === "pdf") return "PDF";
  return "Document";
}

function extractTasks(content: string): string[] {
  return content
    .split("\n")
    .filter((line) => line.match(/^[-*+] /) || line.match(/^\d+[.)]\s/))
    .map((line) => line.replace(/^[-*+] /, "").replace(/^\d+[.)]\s/, "").trim())
    .filter((t) => t.length > 5 && t.length < 300)
    .slice(0, 15);
}

function saveDocumentToStorage(title: string, content: string) {
  try {
    const existing = JSON.parse(localStorage.getItem("atlas_copilot_docs") ?? "[]");
    existing.unshift({ id: crypto.randomUUID(), title: title || "Untitled", content, savedAt: new Date().toISOString() });
    localStorage.setItem("atlas_copilot_docs", JSON.stringify(existing.slice(0, 50)));
  } catch { /* localStorage may be unavailable */ }
}

function downloadText(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename.replace(/[^a-z0-9]/gi, "-").toLowerCase() || "document"}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function inlineHtml(text: string): string {
  return text.split(/(\*\*[^*\n]+\*\*|\*[^*\n]+\*|`[^`\n]+`)/).map((part) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) return `<strong>${escapeHtml(part.slice(2, -2))}</strong>`;
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2 && !part.startsWith("**")) return `<em>${escapeHtml(part.slice(1, -1))}</em>`;
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) return `<code style="font-family:Courier New,monospace;background:#f0f0f0;padding:1pt 3pt;">${escapeHtml(part.slice(1, -1))}</code>`;
    return escapeHtml(part);
  }).join("");
}

function markdownToDocHtml(markdown: string): string {
  const lines = markdown.split("\n");
  const parts: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith("⚠️")) {
      parts.push(`<p style="color:#d97706;border-left:3px solid #fbbf24;padding-left:8pt;font-style:italic;">${escapeHtml(line)}</p>`);
      i++; continue;
    }
    if (line.trimStart().startsWith("```")) {
      const codeLines: string[] = []; i++;
      while (i < lines.length && !lines[i].trimStart().startsWith("```")) { codeLines.push(escapeHtml(lines[i])); i++; }
      parts.push(`<pre style="background:#f0f0f0;padding:8pt;font-family:Courier New,monospace;font-size:10pt;">${codeLines.join("\n")}</pre>`);
      i++; continue;
    }
    if (line.startsWith("# ")) { parts.push(`<h1>${inlineHtml(line.slice(2))}</h1>`); i++; continue; }
    if (line.startsWith("## ")) { parts.push(`<h2>${inlineHtml(line.slice(3))}</h2>`); i++; continue; }
    if (line.startsWith("### ")) { parts.push(`<h3>${inlineHtml(line.slice(4))}</h3>`); i++; continue; }
    if (line.match(/^[-*_]{3,}$/)) { parts.push(`<hr style="border:none;border-top:1pt solid #ccc;">`); i++; continue; }
    if (line.match(/^[-*+] /)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^[-*+] /)) { items.push(`<li>${inlineHtml(lines[i].replace(/^[-*+] /, ""))}</li>`); i++; }
      parts.push(`<ul style="margin:6pt 0;padding-left:18pt;">${items.join("")}</ul>`); continue;
    }
    if (line.match(/^\d+[.)]\s/)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^\d+[.)]\s/)) { items.push(`<li>${inlineHtml(lines[i].replace(/^\d+[.)]\s/, ""))}</li>`); i++; }
      parts.push(`<ol style="margin:6pt 0;padding-left:18pt;">${items.join("")}</ol>`); continue;
    }
    if (line.startsWith("> ")) {
      const qLines: string[] = [];
      while (i < lines.length && lines[i].startsWith("> ")) { qLines.push(inlineHtml(lines[i].slice(2))); i++; }
      parts.push(`<blockquote style="border-left:3px solid #ccc;padding-left:8pt;color:#555;margin:6pt 0;">${qLines.map((l) => `<p>${l}</p>`).join("")}</blockquote>`); continue;
    }
    if (line.trim() === "") { i++; continue; }
    const paraLines: string[] = [];
    while (i < lines.length && lines[i].trim() !== "" && !lines[i].startsWith("#") && !lines[i].match(/^[-*+] /) && !lines[i].match(/^\d+[.)]\s/) && !lines[i].trimStart().startsWith("```") && !lines[i].startsWith("> ") && !lines[i].match(/^[-*_]{3,}$/) && !lines[i].startsWith("⚠️")) {
      paraLines.push(lines[i]); i++;
    }
    if (paraLines.length > 0) parts.push(`<p style="margin-bottom:6pt;">${inlineHtml(paraLines.join(" "))}</p>`);
  }
  return parts.join("\n");
}

function downloadAsWord(title: string, content: string) {
  const bodyHtml = markdownToDocHtml(content);
  const safeTitle = escapeHtml(title);
  const docContent = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><title>${safeTitle}</title>
<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:DoNotOptimizeForBrowser/></w:WordDocument></xml><![endif]-->
<style>body{font-family:Calibri,sans-serif;font-size:11pt;line-height:1.5;margin:2cm;}h1{font-size:16pt;font-weight:bold;margin-top:18pt;}h2{font-size:13pt;font-weight:bold;margin-top:14pt;}h3{font-size:12pt;font-weight:bold;margin-top:10pt;}p{margin-bottom:6pt;}li{margin-bottom:3pt;}</style>
</head><body>${bodyHtml}</body></html>`;
  const blob = new Blob(["﻿", docContent], { type: "application/msword" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${(title || "atlas-document").replace(/[^a-z0-9]/gi, "-").toLowerCase()}.doc`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function CopilotPage() {
  return (
    <Suspense fallback={<div className="h-full bg-[#f8fafc]" />}>
      <CopilotChat />
    </Suspense>
  );
}

function CopilotChat() {
  const searchParams = useSearchParams();
  const workflowSlug = searchParams.get("workflow") ?? "";
  const workflow = getWorkflowBundle(workflowSlug);
  const workflowPrompt = buildWorkflowCopilotPrompt(workflowSlug);
  const initialMode: Mode = workflow ? "draft" : "chat";

  const [mode, setMode] = useState<Mode>(initialMode);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState(workflowPrompt);
  const [loading, setLoading] = useState(false);
  const [thinkingEnabled, setThinkingEnabled] = useState(false);
  const [isThinkingActive, setIsThinkingActive] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [wordDownloaded, setWordDownloaded] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);

  // Conversation history
  const [historyOpen, setHistoryOpen] = useState(false);
  const [conversations, setConversations] = useState<{ id: string; title: string; updated_at: string }[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Save modal
  const [saveModal, setSaveModal] = useState<{ id: string; content: string } | null>(null);
  const [saveTitle, setSaveTitle] = useState("");
  const [savedConfirm, setSavedConfirm] = useState<string | null>(null);

  // Tasks panel
  const [tasksPanel, setTasksPanel] = useState<{ id: string; tasks: string[] } | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const saveTitleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (workflowPrompt) textareaRef.current?.focus();
  }, [workflowPrompt]);

  useEffect(() => {
    if (saveModal) setTimeout(() => saveTitleRef.current?.focus(), 50);
  }, [saveModal]);

  function switchMode(m: Mode) {
    if (m === mode) return;
    setMode(m);
    setMessages([]);
    setConversationId(null);
    setInput("");
    setAttachments([]);
    setFileError(null);
    setTasksPanel(null);
  }

  function newChat() {
    setMessages([]);
    setConversationId(null);
    setInput("");
    setAttachments([]);
    setFileError(null);
    setTasksPanel(null);
    setHistoryOpen(false);
    textareaRef.current?.focus();
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
      setMode("chat");
      setMessages(
        (data.messages ?? []).map((m: { role: "user" | "assistant"; content: string }) => ({
          id: crypto.randomUUID(),
          role: m.role,
          content: m.content,
        }))
      );
      setConversationId(id);
      setInput("");
      setAttachments([]);
      setFileError(null);
      setTasksPanel(null);
      setHistoryOpen(false);
    } catch {
      /* ignore */
    }
  }

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setFileError(null);

    const remaining = MAX_ATTACHMENTS - attachments.length;
    const selected = Array.from(files).slice(0, Math.max(remaining, 0));
    if (files.length > remaining) {
      setFileError(`You can attach up to ${MAX_ATTACHMENTS} files at a time.`);
    }

    const next: Attachment[] = [];

    for (const file of selected) {
      if (file.size > MAX_FILE_SIZE) {
        setFileError(`${file.name} is too large. Keep each file under ${formatBytes(MAX_FILE_SIZE)}.`);
        continue;
      }

      if (SUPPORTED_IMAGE_TYPES.has(file.type)) {
        const dataUrl = await readAsDataUrl(file);
        next.push({
          id: crypto.randomUUID(),
          name: file.name,
          mediaType: file.type,
          size: file.size,
          kind: "image",
          data: dataUrlToBase64(dataUrl),
        });
      } else if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
        const dataUrl = await readAsDataUrl(file);
        next.push({
          id: crypto.randomUUID(),
          name: file.name,
          mediaType: "application/pdf",
          size: file.size,
          kind: "pdf",
          data: dataUrlToBase64(dataUrl),
        });
      } else if (SUPPORTED_TEXT_TYPES.has(file.type) || /\.(txt|md|csv|json|xml)$/i.test(file.name)) {
        const text = await readAsText(file);
        next.push({
          id: crypto.randomUUID(),
          name: file.name,
          mediaType: file.type || "text/plain",
          size: file.size,
          kind: "text",
          text,
        });
      } else {
        setFileError(`${file.name} is not supported yet. Use images, PDF, TXT, MD, CSV, JSON, or XML.`);
      }
    }

    if (next.length) setAttachments((prev) => [...prev, ...next].slice(0, MAX_ATTACHMENTS));
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeAttachment(id: string) {
    setAttachments((prev) => prev.filter((file) => file.id !== id));
  }

  async function send(text?: string) {
    const filesToSend = text ? [] : attachments;
    const content = (text ?? input).trim() || (filesToSend.length ? "Please analyse the attached file(s)." : "");
    if (!content || loading) return;

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content, attachments: filesToSend };
    const nextMessages = [...messages, userMsg];
    const apiMessages = nextMessages.map((m) => ({ role: m.role, content: m.content, attachments: m.attachments }));

    setMessages(nextMessages);
    setInput("");
    setAttachments([]);
    setFileError(null);
    setLoading(true);
    setTasksPanel(null);
    if (thinkingEnabled) setIsThinkingActive(true);

    const assistantId = crypto.randomUUID();
    setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "", isThinking: thinkingEnabled }]);

    try {
      const res = await fetch("/api/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: apiMessages,
          conversationId,
          context: MODE_CONTEXT[mode] || undefined,
          thinking: thinkingEnabled,
        }),
      });

      if (!res.ok || !res.body) {
        const errData = await res.json().catch(() => ({}));
        if (errData.error === "limit_reached") {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: `⚠️ ${errData.reason ?? "Message limit reached."}`, isThinking: false }
                : m
            )
          );
          return;
        }
        throw new Error("Failed");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6));
            if (event.type === "sources") {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, sources: event.sources } : m
                )
              );
            } else if (event.type === "thinking_start") {
              setIsThinkingActive(true);
            } else if (event.type === "chunk") {
              setIsThinkingActive(false);
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, content: m.content + event.text, isThinking: false }
                    : m
                )
              );
            } else if (event.type === "done" && event.conversationId) {
              setConversationId(event.conversationId);
            }
          } catch { /* skip malformed */ }
        }
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: "Something went wrong. Please try again.", isThinking: false }
            : m
        )
      );
    } finally {
      setLoading(false);
      setIsThinkingActive(false);
      // If the stream ended without producing any text (e.g. the serverless
      // function timed out, or the model returned nothing), replace the
      // perpetual typing indicator with a recoverable message.
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId && m.role === "assistant" && !m.content.trim()
            ? { ...m, content: "I couldn't generate a response just now. Please try again.", isThinking: false }
            : m
        )
      );
    }
  }

  async function copyMessage(content: string, id: string) {
    await navigator.clipboard.writeText(content);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  function handleSave() {
    if (!saveModal) return;
    saveDocumentToStorage(saveTitle, saveModal.content);
    downloadText(saveTitle || "atlas-copilot-document", saveModal.content);
    setSavedConfirm(saveModal.id);
    setSaveModal(null);
    setSaveTitle("");
    setTimeout(() => setSavedConfirm(null), 3000);
  }

  const currentMode = MODES.find((m) => m.id === mode)!;

  return (
    <div className="flex flex-col h-full bg-[#f8fafc]">
      {/* ── Header ── */}
      <div className="relative overflow-hidden shrink-0 bg-linear-to-br from-navy-950 via-navy-900 to-navy-800 px-6 pt-4 pb-0 shadow-md">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.15),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(139,92,246,0.1),transparent_60%)]" />
        <div className="relative flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <div className="absolute inset-0 rounded-2xl bg-blue-500/40 blur-md" />
              <div className="relative h-10 w-10 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-cyan-400 flex items-center justify-center text-white shadow-lg ring-2 ring-white/20">
                <AtlasAiMark className="h-[22px] w-[22px]" />
              </div>
            </div>
            <div>
              <h1 className="font-bold text-white text-sm leading-tight tracking-tight">Atlas AI</h1>
              <p className="text-[11px] text-blue-300/80 leading-tight">{currentMode.desc}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Extended thinking toggle */}
            <label className="flex items-center gap-2 cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={thinkingEnabled}
                  onChange={(e) => setThinkingEnabled(e.target.checked)}
                />
                <div className={cn(
                  "w-9 h-5 rounded-full transition-colors",
                  thinkingEnabled ? "bg-violet-500" : "bg-white/20"
                )} />
                <div className={cn(
                  "absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform",
                  thinkingEnabled ? "translate-x-4" : "translate-x-0"
                )} />
              </div>
              <span className={cn("text-xs font-medium", thinkingEnabled ? "text-violet-300" : "text-blue-300/70")}>
                {thinkingEnabled ? "Deep thinking on" : "Deep thinking"}
              </span>
            </label>

            {/* History */}
            <div className="relative">
              <button
                type="button"
                onClick={() => (historyOpen ? setHistoryOpen(false) : void openHistory())}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-white/10 hover:bg-white/20 ring-1 ring-white/20 transition-colors"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                History
              </button>

              {historyOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setHistoryOpen(false)} />
                  <div className="absolute right-0 top-[calc(100%+8px)] z-40 w-80 max-h-[70vh] overflow-y-auto rounded-2xl border border-navy-200 bg-white shadow-2xl">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-navy-100 sticky top-0 bg-white">
                      <p className="text-sm font-bold text-navy-900">Conversations</p>
                      <button type="button" onClick={newChat} className="flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        New
                      </button>
                    </div>
                    {historyLoading ? (
                      <div className="flex items-center justify-center gap-2 py-8 text-sm text-navy-400">
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
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
                              "w-full text-left px-4 py-2.5 hover:bg-blue-50 transition-colors",
                              c.id === conversationId && "bg-blue-50"
                            )}
                          >
                            <p className="text-sm font-medium text-navy-800 truncate">{c.title || "Untitled chat"}</p>
                            <p className="text-[11px] text-navy-400">
                              {new Date(c.updated_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                            </p>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="px-4 py-8 text-center text-sm text-navy-400">No saved conversations yet.</p>
                    )}
                  </div>
                </>
              )}
            </div>

            {messages.length > 0 && (
              <button
                type="button"
                onClick={newChat}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-white/10 hover:bg-white/20 ring-1 ring-white/20 transition-colors"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New chat
              </button>
            )}
          </div>
        </div>

        {/* Mode tabs — pill style, flush to bottom */}
        <div className="relative flex items-center gap-1">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => switchMode(m.id)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all",
                mode === m.id
                  ? "bg-[#f8fafc] text-navy-900 shadow-sm"
                  : "text-blue-300/70 hover:text-white hover:bg-white/10"
              )}
            >
              <span className={mode === m.id ? "opacity-70" : "opacity-60"}>{m.icon}</span>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <Landing mode={mode} onSend={send} workflowTitle={workflow?.title} />
        ) : (
          <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
            {messages.map((m) => (
              <div key={m.id} className={cn("flex gap-3", m.role === "user" ? "flex-row-reverse" : "flex-row")}>
                {/* Avatar */}
                <div
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold mt-0.5",
                    m.role === "user" ? "bg-navy-800 text-white" : "bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-500 text-white shadow-sm shadow-blue-600/20"
                  )}
                >
                  {m.role === "user" ? "YOU" : <AtlasAiMark className="h-4 w-4" />}
                </div>

                {/* Bubble + actions */}
                <div className={cn("flex flex-col gap-1.5 max-w-[85%]", m.role === "user" ? "items-end" : "items-start")}>
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-3",
                      m.role === "user"
                        ? "bg-navy-900 text-white rounded-tr-sm text-sm leading-relaxed"
                        : "bg-white border border-navy-200 rounded-tl-sm"
                    )}
                  >
                    {m.role === "user" ? (
                      <div className="space-y-2">
                        <span className="whitespace-pre-wrap">{m.content}</span>
                        {m.attachments && m.attachments.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {m.attachments.map((file) => (
                              <span
                                key={file.id}
                                className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-2 py-1 text-[10px] font-medium text-white/90 ring-1 ring-white/15"
                              >
                                {attachmentLabel(file)}
                                <span className="max-w-[150px] truncate">{file.name}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : m.isThinking || (isThinkingActive && !m.content) ? (
                      <div className="flex items-center gap-2 py-1">
                        <div className="flex gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-bounce [animation-delay:0ms]" />
                          <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-bounce [animation-delay:150ms]" />
                          <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-bounce [animation-delay:300ms]" />
                        </div>
                        <span className="text-xs text-violet-500 font-medium">Thinking deeply…</span>
                      </div>
                    ) : !m.content ? (
                      <div className="flex gap-1 py-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-navy-300 animate-bounce [animation-delay:0ms]" />
                        <span className="h-1.5 w-1.5 rounded-full bg-navy-300 animate-bounce [animation-delay:150ms]" />
                        <span className="h-1.5 w-1.5 rounded-full bg-navy-300 animate-bounce [animation-delay:300ms]" />
                      </div>
                    ) : (
                      <MarkdownContent text={m.content} />
                    )}
                  </div>

                  {/* Source pills */}
                  {m.role === "assistant" && m.sources && m.sources.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 px-1">
                      <span className="text-[10px] text-navy-400 font-medium">Sources:</span>
                      {m.sources.map((s) =>
                        s.kind === "document" ? (
                          <a
                            key={`doc-${s.docId}`}
                            href="/org/library"
                            title="From your organisation's documents"
                            className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                          >
                            <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            {s.title}
                          </a>
                        ) : (
                          <a
                            key={`art-${s.slug}`}
                            href={`/knowledge-hub/${s.slug}`}
                            className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 transition-colors"
                          >
                            {s.title}
                          </a>
                        )
                      )}
                    </div>
                  )}

                  {/* Actions below assistant message */}
                  {m.role === "assistant" && m.content && !m.isThinking && (
                    <div className="flex items-center gap-3 px-1">
                      {/* Copy */}
                      <button
                        type="button"
                        onClick={() => copyMessage(m.content, m.id)}
                        className="flex items-center gap-1 text-[10px] text-navy-400 hover:text-navy-600 transition-colors"
                      >
                        {copied === m.id ? (
                          <>
                            <svg className="h-3 w-3 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-blue-600">Copied</span>
                          </>
                        ) : (
                          <>
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Copy
                          </>
                        )}
                      </button>

                      {/* Save as document */}
                      <button
                        type="button"
                        onClick={() => setSaveModal({ id: m.id, content: m.content })}
                        className="flex items-center gap-1 text-[10px] text-navy-400 hover:text-navy-600 transition-colors"
                      >
                        {savedConfirm === m.id ? (
                          <>
                            <svg className="h-3 w-3 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-blue-600">Saved</span>
                          </>
                        ) : (
                          <>
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                            </svg>
                            Save
                          </>
                        )}
                      </button>

                      {/* Word download */}
                      <button
                        type="button"
                        onClick={() => {
                          const title = m.content.split("\n")[0].replace(/^#+\s*/, "").slice(0, 60) || "atlas-document";
                          downloadAsWord(title, m.content);
                          setWordDownloaded(m.id);
                          setTimeout(() => setWordDownloaded(null), 2000);
                        }}
                        className="flex items-center gap-1 text-[10px] text-navy-400 hover:text-navy-600 transition-colors"
                      >
                        {wordDownloaded === m.id ? (
                          <>
                            <svg className="h-3 w-3 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-blue-600">Downloaded</span>
                          </>
                        ) : (
                          <>
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Word
                          </>
                        )}
                      </button>

                      {/* Create tasks */}
                      {extractTasks(m.content).length > 0 && (
                        <button
                          type="button"
                          onClick={() => setTasksPanel(
                            tasksPanel?.id === m.id ? null : { id: m.id, tasks: extractTasks(m.content) }
                          )}
                          className={cn(
                            "flex items-center gap-1 text-[10px] transition-colors",
                            tasksPanel?.id === m.id
                              ? "text-blue-600 font-medium"
                              : "text-navy-400 hover:text-navy-600"
                          )}
                        >
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                          </svg>
                          Create tasks
                        </button>
                      )}
                    </div>
                  )}

                  {/* Tasks panel */}
                  {tasksPanel?.id === m.id && (
                    <TasksPanel tasks={tasksPanel.tasks} onClose={() => setTasksPanel(null)} />
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* ── Input bar ── */}
      <div className="border-t border-navy-100 bg-white/95 backdrop-blur-sm px-4 py-4 shrink-0 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.06)]">
        <div className="max-w-3xl mx-auto">
          {thinkingEnabled && (
            <div className="flex items-center gap-1.5 mb-2 px-1">
              <div className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-pulse" />
              <span className="text-[10px] font-medium text-violet-600">Deep Thinking enabled — responses will be slower but more thorough</span>
            </div>
          )}
          {attachments.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2 px-1">
              {attachments.map((file) => (
                <div key={file.id} className="inline-flex max-w-full items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-2.5 py-1.5 text-xs text-navy-700">
                  <span className="font-semibold text-blue-700">{attachmentLabel(file)}</span>
                  <span className="max-w-[220px] truncate">{file.name}</span>
                  <span className="font-mono text-[10px] text-navy-400">{formatBytes(file.size)}</span>
                  <button
                    type="button"
                    onClick={() => removeAttachment(file.id)}
                    className="rounded-md p-0.5 text-navy-400 hover:bg-blue-100 hover:text-navy-700"
                    aria-label={`Remove ${file.name}`}
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
          {fileError && <p className="mb-2 px-1 text-[11px] font-medium text-red-600">{fileError}</p>}
          <div className="flex gap-2 items-end">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/png,image/jpeg,image/gif,image/webp,application/pdf,text/plain,text/markdown,text/csv,application/json,application/xml,.txt,.md,.csv,.json,.xml,.pdf"
              className="hidden"
              onChange={(e) => void handleFiles(e.target.files)}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading || attachments.length >= MAX_ATTACHMENTS}
              className="shrink-0 h-11 w-11 rounded-xl border border-navy-200 bg-white text-navy-500 flex items-center justify-center transition-colors hover:bg-navy-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Attach image or document"
              title="Attach image or document"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.9} d="M16.5 6.75 8.06 15.19a3 3 0 1 0 4.24 4.24l8.49-8.49a5 5 0 0 0-7.07-7.07L5.64 11.95a7 7 0 1 0 9.9 9.9l6.36-6.36" />
              </svg>
            </button>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.currentTarget.style.height = "auto";
                e.currentTarget.style.height = `${Math.min(e.currentTarget.scrollHeight, 200)}px`;
              }}
              onKeyDown={handleKeyDown}
              placeholder={
                mode === "chat" ? "Ask anything about HR, employment law, or people management…" :
                mode === "draft" ? "Describe the document you need — role, country, key details…" :
                mode === "research" ? "What do you want to research? Topic, country, or question…" :
                "Paste the HR document or text you'd like me to analyse…"
              }
              rows={1}
              disabled={loading}
              className="flex-1 resize-none rounded-xl border border-navy-200 bg-navy-50 px-4 py-3 text-sm text-navy-900 placeholder:text-navy-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px] disabled:opacity-50 transition-all"
            />
            <button
              type="button"
              onClick={() => send()}
              disabled={(!input.trim() && attachments.length === 0) || loading}
              className={cn(
                "shrink-0 h-11 w-11 rounded-xl flex items-center justify-center transition-all",
                (!input.trim() && attachments.length === 0) || loading
                  ? "bg-navy-100 text-navy-300 cursor-not-allowed"
                  : `${MODE_ICON_BG[mode]} text-white hover:opacity-90 shadow-sm`
              )}
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
          <p className="text-[10px] text-navy-400 mt-2 text-center">
            AI responses may not always be accurate. Verify important HR and legal advice with a qualified professional.
            <span className="ml-2 text-navy-300">Images, PDFs, and text documents supported · Enter to send</span>
          </p>
        </div>
      </div>

      {/* ── Save modal ── */}
      {saveModal && (
        <div
          className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setSaveModal(null); }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="font-semibold text-navy-900 mb-1">Save as document</h3>
            <p className="text-xs text-navy-500 mb-4">Name this document and download it as a text file.</p>
            <input
              ref={saveTitleRef}
              type="text"
              value={saveTitle}
              onChange={(e) => setSaveTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") setSaveModal(null); }}
              placeholder="e.g. Performance Review Policy Draft"
              className="flex h-10 w-full rounded-xl border border-navy-200 bg-white px-3 py-2 text-sm text-navy-900 placeholder:text-navy-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent mb-4"
            />
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => { setSaveModal(null); setSaveTitle(""); }}
                className="px-4 py-2 text-sm text-navy-600 hover:bg-navy-50 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
              >
                Save & Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tasks panel ──────────────────────────────────────────────────────────────

function TasksPanel({ tasks, onClose }: { tasks: string[]; onClose: () => void }) {
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [saved, setSaved] = useState(false);

  function toggle(i: number) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(i)) {
        next.delete(i);
      } else {
        next.add(i);
      }
      return next;
    });
  }

  function saveAllTasks() {
    try {
      const existing = JSON.parse(localStorage.getItem("atlas_copilot_tasks") ?? "[]");
      const newTasks = tasks.map((t) => ({
        id: crypto.randomUUID(),
        text: t,
        done: false,
        createdAt: new Date().toISOString(),
      }));
      localStorage.setItem("atlas_copilot_tasks", JSON.stringify([...newTasks, ...existing].slice(0, 100)));
      setSaved(true);
      setTimeout(onClose, 1200);
    } catch { /* localStorage unavailable */ }
  }

  return (
    <div className="w-full rounded-xl border border-blue-200 bg-blue-50 p-4 mt-1">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-blue-800">Action items from this response</p>
        <button type="button" onClick={onClose} aria-label="Close tasks panel" className="text-navy-400 hover:text-navy-600">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="space-y-2 mb-3">
        {tasks.map((t, i) => (
          <label key={i} className="flex items-start gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={checked.has(i)}
              onChange={() => toggle(i)}
              className="mt-0.5 h-3.5 w-3.5 rounded accent-blue-600"
            />
            <span className={cn("text-xs leading-relaxed", checked.has(i) ? "line-through text-navy-400" : "text-navy-700")}>
              {t}
            </span>
          </label>
        ))}
      </div>
      <button
        type="button"
        onClick={saveAllTasks}
        disabled={saved}
        className="text-[10px] font-semibold text-blue-600 hover:text-blue-800 transition-colors disabled:opacity-50"
      >
        {saved ? "✓ Tasks saved" : "Save all tasks to my list"}
      </button>
    </div>
  );
}

// ─── Landing state ─────────────────────────────────────────────────────────────

const MODE_GREETING: Record<Mode, string> = {
  chat: "What can I help you with?",
  draft: "What document do you need?",
  research: "What do you want to research?",
  analyse: "What would you like me to analyse?",
};

const MODE_TAB_COLORS: Record<Mode, string> = {
  chat: "bg-blue-600 text-white shadow-sm shadow-blue-600/30",
  draft: "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30",
  research: "bg-violet-600 text-white shadow-sm shadow-violet-600/30",
  analyse: "bg-amber-500 text-white shadow-sm shadow-amber-500/30",
};

function Landing({
  mode,
  onSend,
  workflowTitle,
}: {
  mode: Mode;
  onSend: (text: string) => void;
  workflowTitle?: string;
}) {
  const currentMode = MODES.find((m) => m.id === mode)!;
  const suggestions = MODE_SUGGESTIONS[mode];

  return (
    <div className="flex flex-col min-h-full">
      {/* ── Dark hero section ── */}
      <div className="relative overflow-hidden bg-linear-to-br from-navy-950 via-navy-900 to-navy-800 px-6 py-12 flex flex-col items-center text-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.18),transparent_65%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(139,92,246,0.12),transparent_60%)]" />

        {/* Glowing orb */}
        <div className="relative mb-7">
          <div className="absolute inset-0 rounded-3xl bg-blue-500/30 blur-2xl scale-[2]" />
          <div className="relative h-[76px] w-[76px] rounded-3xl bg-gradient-to-br from-blue-500 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-2xl shadow-blue-500/30 ring-4 ring-white/15">
            <AtlasAiMark className="h-[42px] w-[42px] text-white" />
          </div>
        </div>

        <h2 className="relative text-3xl sm:text-4xl font-bold text-white tracking-tight mb-3">
          {MODE_GREETING[mode]}
        </h2>
        <p className="relative text-blue-300 text-sm max-w-md leading-relaxed mb-6">
          {currentMode.desc}.
        </p>

        {/* Mode pills */}
        <div className="relative flex flex-wrap justify-center gap-2">
          {MODES.map((m) => (
            <span
              key={m.id}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold",
                mode === m.id ? MODE_TAB_COLORS[m.id] : "bg-white/10 text-blue-200/70"
              )}
            >
              {m.icon}
              {m.label}
            </span>
          ))}
        </div>

        {workflowTitle && (
          <div className="relative mt-6 w-full max-w-xl rounded-2xl border border-blue-400/30 bg-white/10 px-4 py-3 text-left">
            <p className="text-xs font-semibold text-blue-200">Workflow loaded: {workflowTitle}</p>
            <p className="mt-1 text-xs leading-5 text-blue-300/70">
              Review the prefilled prompt below, add context details, then send.
            </p>
          </div>
        )}
      </div>

      {/* ── Light section: suggestions + capabilities ── */}
      <div className="flex-1 bg-[#f8fafc] px-6 py-8">
        <div className="max-w-2xl mx-auto">
          <p className="text-[10px] font-bold uppercase tracking-widest text-navy-400 mb-3">Try asking…</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-10">
            {suggestions.map((s, i) => (
              <button
                key={s}
                type="button"
                onClick={() => onSend(s)}
                className="group text-left px-4 py-3.5 rounded-2xl border border-navy-150 bg-white text-sm text-navy-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-800 hover:shadow-md transition-all leading-snug flex items-start gap-3"
              >
                <span className="mt-0.5 shrink-0 h-5 w-5 rounded-lg bg-navy-50 border border-navy-200 flex items-center justify-center text-[10px] font-bold text-navy-400 group-hover:bg-blue-100 group-hover:border-blue-200 group-hover:text-blue-600 transition-colors">
                  {i + 1}
                </span>
                <span className="flex-1">{s}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
