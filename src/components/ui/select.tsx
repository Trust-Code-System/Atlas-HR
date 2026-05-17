"use client";

import { cn } from "@/lib/utils";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  id?: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  "aria-label"?: string;
  error?: string;
  className?: string;
  triggerClassName?: string;
  menuClassName?: string;
}

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg
      className={cn("h-4 w-4 shrink-0 text-navy-400", className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 20 20"
      aria-hidden
    >
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M6 8l4 4 4-4"
      />
    </svg>
  );
}

function Select({
  id,
  name,
  value,
  defaultValue,
  onChange,
  options,
  placeholder = "Select...",
  disabled = false,
  required = false,
  "aria-label": ariaLabel,
  error,
  className,
  triggerClassName,
  menuClassName,
}: SelectProps) {
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const isControlled = value !== undefined;
  const firstEnabledValue = options.find((option) => !option.disabled)?.value ?? "";
  const [internalValue, setInternalValue] = useState(defaultValue ?? value ?? firstEnabledValue);
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number; width: number; maxHeight: number } | null>(null);

  const currentValue = isControlled ? (value ?? "") : internalValue;
  const selected = options.find((o) => o.value === currentValue);
  const displayLabel = selected?.label ?? placeholder;
  const isPlaceholder = !selected;

  const updateMenuPosition = useCallback(() => {
    const trigger = rootRef.current?.querySelector("button");
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const padding = 8;
    const gap = 4;
    const idealHeight = Math.min(240, Math.max(44, options.length * 40 + 8));
    const spaceBelow = window.innerHeight - rect.bottom - padding;
    const spaceAbove = rect.top - padding;
    const openAbove = spaceBelow < idealHeight && spaceAbove > spaceBelow;
    const maxHeight = Math.max(44, Math.min(240, openAbove ? spaceAbove - gap : spaceBelow - gap));
    const top = openAbove ? Math.max(padding, rect.top - maxHeight - gap) : rect.bottom + gap;
    const width = Math.max(rect.width, 160);
    const left = Math.min(
      Math.max(padding, rect.left),
      Math.max(padding, window.innerWidth - width - padding),
    );
    setMenuPosition({ top, left, width, maxHeight });
  }, [options.length]);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node;
      if (
        rootRef.current &&
        !rootRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setOpen(false);
      }
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function reposition() {
      updateMenuPosition();
    }

    updateMenuPosition();
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [open, updateMenuPosition]);

  function getInitialHighlightIndex() {
    const idx = options.findIndex((o) => o.value === currentValue && !o.disabled);
    if (idx >= 0) return idx;
    return Math.max(options.findIndex((o) => !o.disabled), 0);
  }

  function openSelect() {
    updateMenuPosition();
    setHighlightIndex(getInitialHighlightIndex());
    setOpen(true);
  }

  function selectOption(option: SelectOption) {
    if (option.disabled) return;
    if (!isControlled) setInternalValue(option.value);
    onChange?.(option.value);
    setOpen(false);
  }

  function moveHighlight(direction: 1 | -1) {
    setHighlightIndex((index) => {
      let next = index;
      for (let i = 0; i < options.length; i++) {
        next = Math.min(Math.max(next + direction, 0), options.length - 1);
        if (!options[next]?.disabled) return next;
      }
      return index;
    });
  }

  function onTriggerKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;

    if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
      e.preventDefault();
      openSelect();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      openSelect();
    }
  }

  function onListKeyDown(e: React.KeyboardEvent<HTMLUListElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      moveHighlight(1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      moveHighlight(-1);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const option = options[highlightIndex];
      if (option) selectOption(option);
    } else if (e.key === "Home") {
      e.preventDefault();
      setHighlightIndex(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setHighlightIndex(options.length - 1);
    }
  }

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      {name && (
        <input
          aria-hidden="true"
          tabIndex={-1}
          className="sr-only"
          name={name}
          value={currentValue}
          required={required}
          onChange={() => {}}
        />
      )}
      <button
        id={id}
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => {
          if (disabled) return;
          if (open) setOpen(false);
          else openSelect();
        }}
        onKeyDown={onTriggerKeyDown}
        className={cn(
          "flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-navy-200 bg-white px-3 py-2 text-left text-sm transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent",
          "disabled:cursor-not-allowed disabled:bg-navy-50 disabled:opacity-60",
          open && "ring-2 ring-blue-600 border-transparent",
          isPlaceholder ? "text-navy-400" : "text-navy-900",
          error && "border-error focus:ring-error",
          !error && open && "ring-blue-600",
          triggerClassName
        )}
      >
        <span className="truncate">{displayLabel}</span>
        <ChevronDown className={cn("transition-transform", open && "rotate-180")} />
      </button>

      {typeof document !== "undefined" && open && menuPosition && createPortal(
        <ul
          ref={menuRef}
          id={listboxId}
          role="listbox"
          tabIndex={-1}
          onKeyDown={onListKeyDown}
          className={cn(
            "fixed z-[1000] overflow-auto rounded-xl border border-blue-100 bg-white py-1 shadow-2xl shadow-navy-900/12",
            menuClassName
          )}
          style={{
            top: menuPosition.top,
            left: menuPosition.left,
            width: menuPosition.width,
            maxHeight: menuPosition.maxHeight,
          }}
        >
          {options.map((option, index) => {
            const isSelected = option.value === currentValue;
            const isHighlighted = index === highlightIndex;

            return (
              <li key={option.value} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  disabled={option.disabled}
                  onMouseEnter={() => !option.disabled && setHighlightIndex(index)}
                  onClick={() => selectOption(option)}
                  className={cn(
                    "flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors",
                    isSelected && "bg-blue-600 text-white font-semibold",
                    !isSelected && isHighlighted && "bg-blue-50 text-blue-700",
                    !isSelected && !isHighlighted && "text-navy-700 hover:bg-blue-50 hover:text-blue-700",
                    option.disabled && "cursor-not-allowed text-navy-300 hover:bg-white"
                  )}
                >
                  <span className="truncate">{option.label}</span>
                  {isSelected && (
                    <svg
                      className="h-4 w-4 shrink-0 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </button>
              </li>
            );
          })}
        </ul>,
        document.body
      )}
    </div>
  );
}

export { Select };
