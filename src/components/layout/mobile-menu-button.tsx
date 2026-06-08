"use client";

export function MobileMenuButton() {
  return (
    <button
      type="button"
      className="lg:hidden flex items-center justify-center h-9 w-9 rounded-lg text-navy-600 hover:bg-navy-100 transition-colors"
      aria-label="Open navigation"
      onClick={() => window.dispatchEvent(new CustomEvent("sidebar-open"))}
    >
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>
  );
}
