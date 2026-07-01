import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { SiteAnalytics } from "@/components/analytics/site-analytics";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-navy-950">
      <PublicHeader />
      <main className="flex-1 bg-public-content">{children}</main>
      <PublicFooter />
      <SiteAnalytics />
    </div>
  );
}
