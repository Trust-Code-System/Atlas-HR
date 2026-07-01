import Link from "next/link";
import { AtlasLogo } from "@/components/atlas-logo";

const footerLinks = {
  Product: [
    { label: "Features", href: "/features" },
    { label: "Pricing", href: "/pricing" },
    { label: "Atlas AI", href: "/sign-up" },
    { label: "Workflows", href: "/workflows" },
    { label: "Trust Center", href: "/trust" },
  ],
  Resources: [
    { label: "Knowledge", href: "/knowledge" },
    { label: "Templates", href: "/templates" },
    { label: "Tools", href: "/tools" },
    { label: "Glossary", href: "/glossary" },
  ],
  Hubs: [
    { label: "Countries", href: "/countries" },
    { label: "Industries", href: "/industries" },
    { label: "Compliance updates", href: "/compliance-updates" },
    { label: "Nigeria compliance", href: "/compare/nigeria-hr-compliance" },
  ],
  Company: [
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ],
  Legal: [
    { label: "Trust Center", href: "/trust" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "GDPR", href: "/gdpr" },
  ],
};

export function PublicFooter() {
  return (
    <footer className="bg-navy-950 border-t border-white/5">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <AtlasLogo
                markClassName="h-8 w-8"
                textClassName="text-white text-lg [&_span]:text-blue-400"
              />
            </Link>
            <p className="text-navy-400 text-sm leading-relaxed">
              The all-in-one HR platform for modern, growing teams.
            </p>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-white font-semibold text-sm mb-4">
                {category}
              </h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-navy-400 hover:text-white text-sm transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-navy-500 text-sm">
            © {new Date().getFullYear()} Atlas HR. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-navy-500 text-sm">Built for HR teams worldwide</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
