import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-green-500 font-semibold text-sm tracking-widest uppercase mb-4">
          404 Error
        </p>
        <h1 className="text-7xl font-bold text-white mb-4">Page not found</h1>
        <p className="text-navy-400 text-lg mb-8 max-w-md mx-auto">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
