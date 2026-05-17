import { getUser } from "@/lib/auth/get-user";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Library" };

export default async function LibraryPage() {
  const user = await getUser();
  const supabase = await createClient();

  const { data: savedItems } = await supabase
    .from("saved_items")
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  const grouped = {
    article:  savedItems?.filter((i) => i.item_type === "article")  ?? [],
    template: savedItems?.filter((i) => i.item_type === "template") ?? [],
    tool:     savedItems?.filter((i) => i.item_type === "tool")     ?? [],
  };

  const tabs = [
    { key: "article"  as const, label: "Articles",  count: grouped.article.length  },
    { key: "template" as const, label: "Templates", count: grouped.template.length },
    { key: "tool"     as const, label: "Tools",     count: grouped.tool.length     },
  ];

  const totalSaved = savedItems?.length ?? 0;

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto w-full">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-[24px] bg-linear-to-br from-navy-950 via-navy-900 to-navy-800 px-7 py-6 mb-8 shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.12),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(139,92,246,0.08),transparent_60%)]" />
        <div className="relative flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-white/10 ring-1 ring-white/10 flex items-center justify-center text-white shrink-0">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Library</h1>
            <p className="text-blue-300 text-sm mt-0.5">
              {totalSaved > 0
                ? `${totalSaved} saved item${totalSaved !== 1 ? "s" : ""} · articles, templates & tools`
                : "Your saved articles, templates, and tools"}
            </p>
          </div>
        </div>
      </div>

      {totalSaved === 0 ? (
        <div className="bg-white rounded-2xl border border-navy-200 text-center py-20 shadow-sm">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-linear-to-br from-navy-100 to-navy-200 flex items-center justify-center mb-4 shadow-sm">
            <svg className="h-8 w-8 text-navy-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-navy-900 mb-1">Nothing saved yet</h3>
          <p className="text-sm text-navy-500 max-w-xs mx-auto">
            Bookmark articles, templates, and tools to find them here.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {tabs.map((tab) =>
            grouped[tab.key].length > 0 ? (
              <div key={tab.key}>
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="font-bold text-navy-900">{tab.label}</h2>
                  <span className="bg-navy-100 border border-navy-200 text-navy-500 text-xs font-bold px-2.5 py-1 rounded-full">
                    {tab.count}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {grouped[tab.key].map((item) => (
                    <div
                      key={item.id}
                      className="bg-white rounded-2xl border border-navy-200 p-5 hover:shadow-md hover:border-navy-300 transition-all shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-semibold text-navy-800 text-sm leading-snug">
                          {item.item_slug.replace(/-/g, " ")}
                        </h3>
                        <span className="shrink-0 text-[10px] font-bold bg-navy-100 text-navy-500 border border-navy-200 px-2 py-0.5 rounded-full">
                          {tab.label.slice(0, -1)}
                        </span>
                      </div>
                      <p className="text-xs text-navy-400 mt-auto">
                        Saved {new Date(item.saved_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null
          )}
        </div>
      )}
    </div>
  );
}
