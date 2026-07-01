import type { Metadata } from "next";
import "./globals.css";

// Read the public app URL directly (not via the validated `env` object) so the
// root layout — which wraps every page — never depends on full server-env
// validation. Missing an unrelated server var must not 500 the whole site.
const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

const SITE_DESCRIPTION =
  "Atlas HR helps global teams hire, onboard, pay, manage, and stay compliant across Nigeria, India, the UK, and the US — with Atlas AI that turns HR questions into completed work.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Atlas HR — Global HR, Compliance & Payroll for cross-border teams",
    template: "%s | Atlas HR",
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "global HR software",
    "cross-border hiring",
    "international payroll",
    "HR compliance",
    "hire in Nigeria",
    "hire in India",
    "UK employment compliance",
    "US HR platform",
  ],
  openGraph: {
    type: "website",
    siteName: "Atlas HR",
    title: "Atlas HR — Global HR, Compliance & Payroll for cross-border teams",
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "Atlas HR — Global HR, Compliance & Payroll for cross-border teams",
    description: SITE_DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
