import Link from "next/link";
import { AtlasLogo } from "@/components/atlas-logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden bg-linear-to-b from-white via-blue-50/40 to-navy-100">
      {/* Decorative background */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        {/* Subtle grid, faded toward the edges */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-size-[36px_36px] opacity-40 mask-[radial-gradient(ellipse_at_center,black,transparent_75%)]" />
        {/* Gradient blobs */}
        <div className="absolute -top-32 -left-24 h-96 w-96 rounded-full bg-blue-400/25 blur-3xl" />
        <div className="absolute top-1/3 -right-24 h-112 w-md rounded-full bg-indigo-400/20 blur-3xl" />
        <div className="absolute -bottom-40 left-1/4 h-96 w-96 rounded-full bg-sky-300/20 blur-3xl" />
        {/* Soft glow behind the card */}
        <div className="absolute left-1/2 top-1/2 h-128 w-lg -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-200/30 blur-3xl" />
      </div>

      <header className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto w-full">
        <Link href="/" className="flex items-center gap-2 group">
          <AtlasLogo
            markClassName="h-8 w-8 transition-transform group-hover:scale-105"
            textClassName="text-lg"
          />
        </Link>
        <Link
          href="/"
          className="text-sm text-navy-500 hover:text-navy-700 transition-colors"
        >
          &larr; Back to home
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        {children}
      </main>

      <footer className="text-center pb-8 text-xs text-navy-400">
        &copy; {new Date().getFullYear()} Atlas HR &middot;{" "}
        <Link href="/privacy" className="hover:text-navy-600 transition-colors">
          Privacy
        </Link>{" "}
        &middot;{" "}
        <Link href="/terms" className="hover:text-navy-600 transition-colors">
          Terms
        </Link>
      </footer>
    </div>
  );
}
