"use client";

import { useTransition, useState } from "react";
import { togglePublished, deletePolicyDocument } from "./actions";
import type { PolicyLibraryItem } from "@/types/database";

interface Props {
  item: PolicyLibraryItem;
  isAdmin: boolean;
}

export function LibraryClient({ item, isAdmin }: Props) {
  const [isPending, startTransition] = useTransition();
  const [deleted, setDeleted] = useState(false);
  const [published, setPublished] = useState(item.is_published);

  if (deleted) return null;

  function handleToggle() {
    startTransition(async () => {
      await togglePublished(item.id, !published);
      setPublished((p) => !p);
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
