import Link from "next/link";
import { AtlasLogo } from "@/components/atlas-logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-navy-50 flex flex-col">
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
        <Link href="/" className="hover:text-navy-600 transition-colors">
          Privacy
        </Link>{" "}
        &middot;{" "}
        <Link href="/" className="hover:text-navy-600 transition-colors">
          Terms
        </Link>
      </footer>
    </div>
  );
}
