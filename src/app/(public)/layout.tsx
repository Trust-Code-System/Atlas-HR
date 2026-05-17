import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";

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
    </div>
  );
}
