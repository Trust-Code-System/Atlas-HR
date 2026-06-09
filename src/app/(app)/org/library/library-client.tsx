"use client";

import { useTransition, useState } from "react";
import { togglePublished, deletePolicyDocument, toggleAiEnabled } from "./actions";
import type { PolicyLibraryItem } from "@/types/database";

interface KbInfo {
  status: string;
  chunkCount: number;
  aiEnabled: boolean;
}

interface Props {
  item: PolicyLibraryItem;
  isAdmin: boolean;
  kb?: KbInfo | null;
}

export function LibraryClient({ item, isAdmin, kb }: Props) {
  const [isPending, startTransition] = useTransition();
  const [deleted, setDeleted] = useState(false);
  const [published, setPublished] = useState(item.is_published);
  const [aiEnabled, setAiEnabled] = useState(kb?.aiEnabled ?? true);

  if (deleted) return null;

  const indexed = kb?.status === "ready" && kb.chunkCount > 0;

  function handleToggle() {
    startTransition(async () => {
      await togglePublished(item.id, !published);
      setPublished((p) => !p);
    });
  }

  function handleAiToggle() {
    startTransition(async () => {
      const next = !aiEnabled;
      await toggleAiEnabled(item.id, next);
      setAiEnabled(next);
    });
  }

  function handleDelete() {
    if (!confirm("Delete this policy document?")) return;
    startTransition(async () => {
      await deletePolicyDocument(item.id);
      setDeleted(true);
    });
  }

  return (
    <div className={`flex items-center justify-between px-5 py-4 ${isPending ? "opacity-60" : ""}`}>
      <div className="flex items-start gap-3 min-w-0">
        <div className="h-9 w-9 rounded-xl bg-navy-100 flex items-center justify-center shrink-0 mt-0.5">
          <svg className="h-4 w-4 text-navy-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-navy-800">{item.title}</p>
            {!published && (
              <span className="text-xs font-semibold bg-navy-100 text-navy-500 rounded-full px-2 py-0.5">Draft</span>
            )}
            {indexed && aiEnabled && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold bg-blue-50 text-blue-700 rounded-full px-2 py-0.5 ring-1 ring-blue-200" title={`Searchable by Atlas AI · ${kb?.chunkCount} chunks`}>
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                AI-indexed
              </span>
            )}
            {indexed && !aiEnabled && (
              <span className="text-xs font-semibold bg-navy-100 text-navy-500 rounded-full px-2 py-0.5" title="Indexed but excluded from AI answers">AI off</span>
            )}
          </div>
          {item.description && (
            <p className="text-xs text-navy-500 mt-0.5 line-clamp-1">{item.description}</p>
          )}
          <p className="text-xs text-navy-400 mt-0.5">
            {new Date(item.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0 ml-4">
        {item.file_url && (
          <a
            href={item.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline"
          >
            View
          </a>
        )}
        {isAdmin && indexed && (
          <button
            type="button"
            onClick={handleAiToggle}
            disabled={isPending}
            title={aiEnabled ? "Stop using this document in AI answers" : "Allow this document in AI answers"}
            className={`text-xs font-medium px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50 ${
              aiEnabled
                ? "text-blue-700 bg-blue-50 hover:bg-blue-100"
                : "text-navy-600 bg-navy-50 hover:bg-navy-100"
            }`}
          >
            {aiEnabled ? "AI: on" : "AI: off"}
          </button>
        )}
        {isAdmin && (
          <>
            <button
              type="button"
              onClick={handleToggle}
              disabled={isPending}
              className={`text-xs font-medium px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50 ${
                published
                  ? "text-navy-600 hover:text-navy-800 bg-navy-50 hover:bg-navy-100"
                  : "text-blue-700 hover:text-green-900 bg-blue-50 hover:bg-blue-100"
              }`}
            >
              {published ? "Unpublish" : "Publish"}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending}
              className="text-navy-400 hover:text-red-600 transition-colors disabled:opacity-50"
              aria-label="Delete policy"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
