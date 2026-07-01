import Link from "next/link";

export default function VerifyEmailPage() {
  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl border border-navy-200 shadow-md p-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 mx-auto mb-6">
          <svg aria-hidden="true" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-navy-900 mb-2">Check your inbox</h1>
        <p className="text-navy-500 text-sm mb-6 leading-relaxed">
          We&apos;ve sent a verification link to your email address. Click the link to
          activate your account and start using Atlas HR.
        </p>

        <div className="bg-navy-50 rounded-xl p-4 mb-6 text-left">
          <p className="text-xs text-navy-500 font-medium mb-1">Didn&apos;t receive it?</p>
          <ul className="text-xs text-navy-400 space-y-1">
            <li>• Check your spam or junk folder</li>
            <li>• Make sure you used the correct email</li>
            <li>• Allow a few minutes for delivery</li>
          </ul>
        </div>

        <Link
          href="/sign-in"
          className="text-sm text-blue-600 font-semibold hover:text-blue-700 transition-colors"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
