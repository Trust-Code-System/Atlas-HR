import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Atlas HR — Modern HR Platform",
    template: "%s | Atlas HR",
  },
  description:
    "Atlas HR is the all-in-one HR platform for growing teams. Manage people, leave, documents, and compliance in one place.",
  keywords: ["HR software", "human resources", "people management", "leave management", "HR platform"],
  openGraph: {
    type: "website",
    siteName: "Atlas HR",
    title: "Atlas HR — Modern HR Platform",
    description: "The all-in-one HR platform for growing teams.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Atlas HR — Modern HR Platform",
    description: "The all-in-one HR platform for growing teams.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
