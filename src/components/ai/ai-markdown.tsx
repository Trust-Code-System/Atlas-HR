"use client";

import type React from "react";

/**
 * Lightweight markdown renderer for AI output panels (profile summaries,
 * analytics summaries, attendance insights, etc). Mirrors the copilot's inline
 * renderer so AI text looks consistent across the app, without pulling in a
 * markdown dependency. Handles headings, lists, blockquotes, code, the
 * ⚠️ LEGAL REVIEW callout, and inline bold/italic/code.
 */
export function AiMarkdown({ text }: { text: string }) {
  let keyCounter = 0;
  const nextKey = () => keyCounter++;
  const inline = (value: string) => inlineFormat(value, nextKey);
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("⚠️ LEGAL REVIEW:") || line.startsWith("⚠️ Legal review:")) {
      const msg = line.replace(/^⚠️ (LEGAL REVIEW|Legal review):?\s*/i, "").trim();
      elements.push(
        <div key={nextKey()} className="flex items-start gap-2.5 mt-4 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
          <svg className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="text-xs font-semibold text-amber-800">Legal Review Recommended</p>
            {msg && <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">{msg}</p>}
          </div>
        </div>
      );
      i++; continue;
    }

    if (line.trimStart().startsWith("```")) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trimStart().startsWith("```")) { codeLines.push(lines[i]); i++; }
      elements.push(
        <pre key={nextKey()} className="bg-navy-950 text-blue-300 rounded-xl p-4 text-xs font-mono overflow-x-auto my-3 leading-relaxed">
          {codeLines.join("\n")}
        </pre>
      );
      i++; continue;
    }

    if (line.startsWith("# ")) {
      elements.push(<h1 key={nextKey()} className="font-bold text-base text-navy-900 mt-5 mb-2 pb-1.5 border-b border-navy-100">{inline(line.slice(2))}</h1>);
      i++; continue;
    }
    if (line.startsWith("## ")) {
      elements.push(<h2 key={nextKey()} className="font-semibold text-sm text-navy-900 mt-4 mb-1.5">{inline(line.slice(3))}</h2>);
      i++; continue;
    }
    if (line.startsWith("### ")) {
      elements.push(<h3 key={nextKey()} className="font-semibold text-sm text-navy-800 mt-3 mb-1">{inline(line.slice(4))}</h3>);
      i++; continue;
    }

    // GitHub-style tables: a header row followed by a |---|---| separator row.
    // Checked before the hr / paragraph rules so pipe rows aren't swallowed into
    // a run-on paragraph.
    if (line.includes("|") && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
      const header = splitTableRow(line);
      i += 2; // consume header + separator
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim() !== "" && lines[i].includes("|")) {
        rows.push(splitTableRow(lines[i]));
        i++;
      }
      elements.push(
        <div key={nextKey()} className="my-3 overflow-x-auto rounded-xl border border-navy-100">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-navy-200 bg-navy-50/60">
                {header.map((cell) => (
                  <th key={nextKey()} className="px-3 py-2 font-semibold text-navy-800 align-top">{inline(cell)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={nextKey()} className="border-b border-navy-100 last:border-0 align-top">
                  {header.map((_, c) => (
                    <td key={nextKey()} className="px-3 py-2 text-navy-700">{inline(row[c] ?? "")}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    if (line.match(/^[-*_]{3,}$/)) { elements.push(<hr key={nextKey()} className="border-navy-200 my-4" />); i++; continue; }

    if (line.match(/^[-*+] /)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^[-*+] /)) { items.push(lines[i].replace(/^[-*+] /, "")); i++; }
      elements.push(
        <ul key={nextKey()} className="my-2 space-y-1 pl-5 list-disc marker:text-navy-400">
          {items.map((item) => <li key={nextKey()} className="text-sm text-navy-700 leading-relaxed">{inline(item)}</li>)}
        </ul>
      );
      continue;
    }

    if (line.match(/^\d+[.)]\s/)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^\d+[.)]\s/)) { items.push(lines[i].replace(/^\d+[.)]\s/, "")); i++; }
      elements.push(
        <ol key={nextKey()} className="my-2 space-y-1.5 pl-5 list-decimal marker:text-navy-500 marker:font-semibold">
          {items.map((item) => <li key={nextKey()} className="text-sm text-navy-700 leading-relaxed">{inline(item)}</li>)}
        </ol>
      );
      continue;
    }

    if (line.startsWith("> ")) {
      const qLines: string[] = [];
      while (i < lines.length && lines[i].startsWith("> ")) { qLines.push(lines[i].slice(2)); i++; }
      elements.push(
        <blockquote key={nextKey()} className="border-l-4 border-blue-300 bg-blue-50 pl-4 py-2 my-3 rounded-r-lg">
          {qLines.map((l) => <p key={nextKey()} className="text-sm text-navy-600 italic">{inline(l)}</p>)}
        </blockquote>
      );
      continue;
    }

    if (line.trim() === "") { i++; continue; }

    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !lines[i].startsWith("#") &&
      !lines[i].match(/^[-*+] /) &&
      !lines[i].match(/^\d+[.)]\s/) &&
      !lines[i].trimStart().startsWith("```") &&
      !lines[i].startsWith("> ") &&
      !lines[i].match(/^[-*_]{3,}$/) &&
      !lines[i].startsWith("⚠️") &&
      !(lines[i].includes("|") && i + 1 < lines.length && isTableSeparator(lines[i + 1]))
    ) {
      paraLines.push(lines[i]); i++;
    }
    if (paraLines.length > 0) {
      elements.push(<p key={nextKey()} className="text-sm text-navy-700 leading-relaxed mb-2">{inline(paraLines.join(" "))}</p>);
    } else {
      // Safety net: line starts with a marker we don't render as a block
      // (e.g. H4 "#### ", "#tag", or a non-LEGAL-REVIEW "⚠️ …" line) so the
      // paragraph collector consumed nothing. Render as text and advance —
      // otherwise `i` never moves and the loop hangs the tab.
      elements.push(<p key={nextKey()} className="text-sm text-navy-700 leading-relaxed mb-2">{inline(line)}</p>);
      i++;
    }
  }

  return <>{elements}</>;
}

// A markdown table separator row, e.g. "|---|---|" or "--- | :--: | ---".
function isTableSeparator(line: string): boolean {
  const t = line.trim();
  return t.includes("|") && t.includes("-") && /^[\s|:-]+$/.test(t);
}

// Split a table row into trimmed cells, dropping the empty edges produced by
// leading/trailing pipes.
function splitTableRow(line: string): string[] {
  let t = line.trim();
  if (t.startsWith("|")) t = t.slice(1);
  if (t.endsWith("|")) t = t.slice(0, -1);
  return t.split("|").map((c) => c.trim());
}

function inlineFormat(text: string, nextKey: () => number): React.ReactNode {
  const parts = text.split(/(\*\*[^*\n]+\*\*|\*[^*\n]+\*|`[^`\n]+`)/);
  return (
    <>
      {parts.map((part) => {
        const k = nextKey();
        if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
          return <strong key={k} className="font-semibold text-navy-900">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith("*") && part.endsWith("*") && part.length > 2 && !part.startsWith("**")) {
          return <em key={k} className="italic text-navy-600">{part.slice(1, -1)}</em>;
        }
        if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
          return <code key={k} className="bg-navy-100 text-navy-800 px-1.5 py-0.5 rounded text-[11px] font-mono">{part.slice(1, -1)}</code>;
        }
        return <span key={k}>{part}</span>;
      })}
    </>
  );
}
