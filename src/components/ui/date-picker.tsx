"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAY_HEADERS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

interface DatePickerProps {
  /** YYYY-MM-DD string for controlled usage */
  value?: string;
  onChange?: (value: string) => void;
  /** YYYY-MM-DD string for uncontrolled usage */
  defaultValue?: string;
  /** name attribute passed to the hidden input for form submission */
  name?: string;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
  min?: string;
  max?: string;
  className?: string;
  id?: string;
}

function parseIso(s: string | undefined): Date | null {
  if (!s) return null;
  const parts = s.split("-").map(Number);
  if (parts.length < 3 || parts.some(isNaN)) return null;
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

function toIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDisplay(iso: string): string {
  const d = parseIso(iso);
  if (!d) return "";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function DatePicker({
  value: controlledValue,
  onChange,
  defaultValue = "",
  name,
  required,
  placeholder = "Select date",
  disabled,
  min,
  max,
  className,
  id,
}: DatePickerProps) {
  const isControlled = controlledValue !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue);
  const effectiveValue = isControlled ? (controlledValue ?? "") : internalValue;

  const [todayIso] = useState(() => toIso(new Date()));

  const initDate = parseIso(effectiveValue) ?? parseIso(todayIso)!;
  const [viewYear, setViewYear] = useState(initDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initDate.getMonth());
  const [open, setOpen] = useState(false);
  const [panelPosition, setPanelPosition] = useState<{ top: number; left: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const updatePanelPosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const panelWidth = 288;
    const panelHeight = 344;
    const gap = 6;
    const padding = 8;
    const shouldOpenAbove = rect.bottom + panelHeight + gap > window.innerHeight && rect.top > panelHeight + gap;
    const top = shouldOpenAbove
      ? Math.max(padding, rect.top - panelHeight - gap)
      : Math.min(rect.bottom + gap, window.innerHeight - panelHeight - padding);
    const left = Math.min(
      Math.max(padding, rect.left),
      Math.max(padding, window.innerWidth - panelWidth - padding),
    );
    setPanelPosition({ top, left });
  }, []);

  // Close on outside click; keep viewport positioning updated while open.
  useEffect(() => {
    if (!open) return;
    function close(e: MouseEvent) {
      const target = e.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        panelRef.current &&
        !panelRef.current.contains(target)
      ) {
        setOpen(false);
      }
    }
    function reposition() {
      updatePanelPosition();
    }
    updatePanelPosition();
    document.addEventListener("mousedown", close);
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => {
      document.removeEventListener("mousedown", close);
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [open, updatePanelPosition]);

  function handleOpen() {
    if (disabled) return;
    if (!open) {
      const nextViewDate = parseIso(effectiveValue) ?? parseIso(todayIso)!;
      setViewYear(nextViewDate.getFullYear());
      setViewMonth(nextViewDate.getMonth());
      updatePanelPosition();
    }
    setOpen((isOpen) => !isOpen);
  }

  function select(iso: string) {
    if (!isControlled) setInternalValue(iso);
    onChange?.(iso);
    setOpen(false);
  }

  function clear() {
    if (!isControlled) setInternalValue("");
    onChange?.("");
    setOpen(false);
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  }

  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  function dayIso(day: number) {
    return `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  function isDisabled(day: number) {
    const iso = dayIso(day);
    if (min && iso < min) return true;
    if (max && iso > max) return true;
    return false;
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Hidden input for FormData submission */}
      {name && (
        <input type="hidden" name={name} value={effectiveValue} required={required} />
      )}

      {/* Trigger */}
      <button
        ref={triggerRef}
        type="button"
        id={id}
        disabled={disabled}
        onClick={handleOpen}
        className={cn(
          "flex h-11 w-full items-center justify-between rounded-xl border bg-white px-3.5 text-sm transition-all",
          effectiveValue ? "text-navy-900" : "text-navy-400",
          open
            ? "border-blue-500 ring-2 ring-blue-500/20 shadow-sm"
            : "border-navy-200 hover:border-navy-300",
          disabled && "cursor-not-allowed opacity-50 bg-navy-50 pointer-events-none"
        )}
      >
        <span className="truncate">{effectiveValue ? formatDisplay(effectiveValue) : placeholder}</span>
        <svg
          className={cn("h-4 w-4 shrink-0 ml-2 transition-colors", open ? "text-blue-500" : "text-navy-400")}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </button>

      {/* Calendar panel */}
      {typeof document !== "undefined" && open && panelPosition && createPortal(
        <div
          ref={panelRef}
          className={cn(
            "fixed z-[1000] w-[288px] rounded-2xl border border-navy-200 bg-white shadow-2xl shadow-navy-900/15 overflow-hidden"
          )}
          style={{ top: panelPosition.top, left: panelPosition.left }}
        >
          {/* Month/year nav */}
          <div className="flex items-center justify-between gap-2 px-4 py-3 bg-linear-to-br from-navy-950 to-navy-800">
            <button
              type="button"
              onClick={prevMonth}
              className="h-7 w-7 rounded-lg flex items-center justify-center text-blue-300 hover:bg-white/15 hover:text-white transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <span className="text-sm font-bold text-white tracking-tight">
              {MONTHS[viewMonth]} {viewYear}
            </span>

            <button
              type="button"
              onClick={nextMonth}
              className="h-7 w-7 rounded-lg flex items-center justify-center text-blue-300 hover:bg-white/15 hover:text-white transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-navy-100 bg-navy-50 px-3 py-2">
            {DAY_HEADERS.map((d) => (
              <div key={d} className="text-center text-[10px] font-bold text-navy-400">{d}</div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 px-3 py-3 gap-y-1">
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`pad-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const iso = dayIso(day);
              const isSelected = iso === effectiveValue;
              const isToday = iso === todayIso;
              const disabled = isDisabled(day);
              return (
                <button
                  key={day}
                  type="button"
                  disabled={disabled}
                  onClick={() => !disabled && select(iso)}
                  className={cn(
                    "h-9 w-9 mx-auto flex items-center justify-center rounded-xl text-sm font-medium transition-all",
                    isSelected && "bg-blue-600 text-white font-bold shadow-sm",
                    !isSelected && isToday && "bg-blue-50 text-blue-700 font-bold ring-1 ring-blue-300",
                    !isSelected && !isToday && !disabled && "text-navy-700 hover:bg-navy-100 hover:text-navy-900",
                    disabled && "text-navy-300 cursor-not-allowed opacity-40"
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Footer shortcuts */}
          <div className="flex items-center justify-between border-t border-navy-100 px-4 py-2.5 bg-navy-50">
            <button
              type="button"
              onClick={() => select(todayIso)}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
            >
              Today
            </button>
            {effectiveValue && (
              <button
                type="button"
                onClick={clear}
                className="text-xs font-semibold text-navy-400 hover:text-navy-700 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
