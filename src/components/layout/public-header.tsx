"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AtlasLogo } from "@/components/atlas-logo";
import { cn } from "@/lib/utils";

// Top-level links map to how an HR buyer shops: the product, the interactive
// proof, security, and price. The content library sits under one "Resources"
// menu instead of a flat dump.
const primaryLinks = [
  { href: "/", label: "Product" },
  { href: "/#global-hiring-calculator", label: "Calculator" },
  { href: "/trust", label: "Trust" },
  { href: "/pricing", label: "Pricing" },
];

const resourceLinks = [
  { href: "/knowledge", label: "Knowledge" },
  { href: "/templates", label: "Templates" },
  { href: "/tools", label: "Tools" },
  { href: "/countries", label: "Countries" },
  { href: "/workflows", label: "Workflows" },
];

export function PublicHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeHash, setActiveHash] = useState("");

  useEffect(() => {
    const syncHash = () => setActiveHash(window.location.hash);

    syncHash();
    window.addEventListener("hashchange", syncHash);
    window.addEventListener("popstate", syncHash);

    return () => {
      window.removeEventListener("hashchange", syncHash);
      window.removeEventListener("popstate", syncHash);
    };
  }, [pathname]);

  function isActive(linkHref: string) {
    const [linkPath, linkHash] = linkHref.split("#");

    if (linkHash) {
      return pathname === linkPath && activeHash === `#${linkHash}`;
    }

    if (linkHref === "/") {
      return pathname === "/" && activeHash === "";
    }

    return pathname === linkHref;
  }

  function handleNavClick(linkHref: string) {
    const [, linkHash] = linkHref.split("#");
    setActiveHash(linkHash ? `#${linkHash}` : "");
  }

  const resourcesActive = resourceLinks.some((link) => isActive(link.href));

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-navy-900/95 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <AtlasLogo
              markClassName="h-8 w-8 transition-transform group-hover:scale-105"
              textClassName="text-white text-lg [&_span]:text-blue-400"
            />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {primaryLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => handleNavClick(link.href)}
                className={cn(
                  "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive(link.href)
                    ? "text-white bg-white/10"
                    : "text-navy-300 hover:text-white hover:bg-white/5"
                )}
              >
                {link.label}
              </Link>
            ))}

            {/* Resources dropdown (hover + keyboard focus) */}
            <div className="relative group">
              <button
                type="button"
                aria-haspopup="true"
                className={cn(
                  "flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  resourcesActive
                    ? "text-white bg-white/10"
                    : "text-navy-300 hover:text-white hover:bg-white/5"
                )}
              >
                Resources
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className="invisible absolute left-0 top-full z-50 pt-2 opacity-0 transition-all duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                <div className="w-48 rounded-xl border border-white/10 bg-navy-900 p-1.5 shadow-2xl shadow-black/40">
                  {resourceLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => handleNavClick(link.href)}
                      className={cn(
                        "block rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        isActive(link.href)
                          ? "text-white bg-white/10"
                          : "text-navy-300 hover:text-white hover:bg-white/5"
                      )}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </nav>

          {/* CTA */}
          <div className="hidden lg:flex items-center gap-3">
            <Link
              href="/sign-in"
              className="text-sm font-medium text-navy-300 hover:text-white transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="inline-flex items-center justify-center h-8 px-3 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors"
            >
              Get started free
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden p-2 rounded-lg text-navy-400 hover:text-white hover:bg-white/5 transition-colors"
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="lg:hidden border-t border-white/10 py-4 space-y-1">
            {primaryLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => {
                  handleNavClick(link.href);
                  setMenuOpen(false);
                }}
                className={cn(
                  "block px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive(link.href)
                    ? "text-white bg-white/10"
                    : "text-navy-300 hover:text-white hover:bg-white/5"
                )}
              >
                {link.label}
              </Link>
            ))}

            <p className="px-3 pt-4 pb-1 text-xs font-semibold uppercase tracking-wide text-navy-500">
              Resources
            </p>
            {resourceLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => {
                  handleNavClick(link.href);
                  setMenuOpen(false);
                }}
                className={cn(
                  "block px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive(link.href)
                    ? "text-white bg-white/10"
                    : "text-navy-300 hover:text-white hover:bg-white/5"
                )}
              >
                {link.label}
              </Link>
            ))}

            <div className="pt-3 flex flex-col gap-2">
              <Link
                href="/sign-in"
                className="block px-3 py-2 text-sm font-medium text-navy-300 hover:text-white transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className="block px-3 py-2 text-sm font-semibold text-center bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors"
              >
                Get started free
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
