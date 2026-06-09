import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { AtlasAiWidget } from "@/components/ai/atlas-ai-widget";
import { getUser } from "@/lib/auth/get-user";
import { getCurrentOrg } from "@/lib/org/get-current-org";
import { getOrgAiContext } from "@/lib/ai/org-ai-context";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AppLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  const user = await getUser();
  if (!user) redirect("/sign-in");

  // Load workspace context so the global AI widget knows which skills are
  // enabled and the sidebar can gate admin-only items (e.g. Demo Data).
  const orgCtx = await getCurrentOrg();
  let widgetSkills: { id: string; name: string; placeholder: string }[] = [];
  if (orgCtx) {
    try {
      const supabase = await createClient();
      const { enabledSkills } = await getOrgAiContext(supabase, orgCtx.org.id);
      widgetSkills = enabledSkills.map((s) => ({ id: s.id, name: s.name, placeholder: s.placeholder }));
    } catch {
      widgetSkills = [];
    }
  }

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden">
      <AppSidebar userRole={user.role} isOrgAdmin={orgCtx?.isAdmin ?? false} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden w-full lg:w-auto">
        <AppHeader />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
      <AtlasAiWidget enabledSkills={widgetSkills} />
    </div>
  );
}
