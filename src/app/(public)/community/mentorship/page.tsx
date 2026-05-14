import type { Metadata } from "next";
import { ArrowRight, CheckCircle2, Users } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { joinMentorshipWaitlist } from "./actions";

export const metadata: Metadata = {
  title: "HR Mentorship | Atlas HR",
  description: "Connect with experienced HR professionals through the Atlas HR mentorship program.",
};

export default async function MentorshipPage({
  searchParams,
}: {
  searchParams: Promise<{ joined?: string; error?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="bg-[--bg-app] py-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <header className="mx-auto max-w-3xl text-center">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[--accent-soft] text-[--accent]">
            <Users size={22} />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-[--text-primary]">HR Mentorship</h1>
          <p className="mt-4 text-lg leading-8 text-[--text-secondary]">
            Connect with experienced HR professionals who have handled the questions you are facing now.
          </p>
        </header>

        <section className="mt-12 grid gap-5 md:grid-cols-2">
          {[
            {
              title: "Become a mentee",
              body: "Get matched with a senior HR practitioner for practical guidance on policies, employee relations, payroll questions, and growing into broader people leadership.",
              role: "mentee",
            },
            {
              title: "Become a mentor",
              body: "Share your experience with emerging HR professionals and help build a stronger regional people-ops community.",
              role: "mentor",
            },
          ].map((item) => (
            <div key={item.role} className="rounded-xl border border-[--border] bg-[--bg-card] p-6">
              <h2 className="text-xl font-semibold text-[--text-primary]">{item.title}</h2>
              <p className="mt-3 text-sm leading-6 text-[--text-secondary]">{item.body}</p>
              <a href="#waitlist" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[--accent] hover:underline">
                Join the waitlist <ArrowRight size={14} />
              </a>
            </div>
          ))}
        </section>

        <section className="mt-8 rounded-xl bg-[--accent-soft] p-6">
          <h2 className="text-2xl font-semibold text-[--text-primary]">How it works</h2>
          <div className="mt-5 grid gap-5 md:grid-cols-3">
            {[
              ["Apply", "Tell us your background and what you want to learn or share."],
              ["Match", "We match by experience level, market, industry, and goals."],
              ["Meet", "Monthly 1:1 calls for 3 months with practical topics and follow-up."],
            ].map(([title, body], index) => (
              <div key={title}>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[--accent] text-sm font-semibold text-[--primary-foreground]">
                  {index + 1}
                </div>
                <h3 className="mt-3 font-semibold text-[--text-primary]">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[--text-secondary]">{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="waitlist" className="mx-auto mt-10 max-w-2xl rounded-xl border border-[--border] bg-[--bg-card] p-6">
          <h2 className="text-xl font-semibold text-[--text-primary]">Join the early access waitlist</h2>
          <p className="mt-2 text-sm leading-6 text-[--text-secondary]">
            Mentorship is opening in batches. Leave your details and we will contact you when matching starts.
          </p>

          {params.joined === "1" && (
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-[--success]/30 bg-[--success]/10 px-3 py-2 text-sm text-[--text-secondary]">
              <CheckCircle2 size={16} className="text-[--success]" />
              You are on the mentorship waitlist.
            </div>
          )}

          {params.error && (
            <div className="mt-4 rounded-lg border border-[--danger]/30 bg-[--danger]/10 px-3 py-2 text-sm text-[--danger]">
              Please check the form and try again.
            </div>
          )}

          <form action={joinMentorshipWaitlist} className="mt-5 grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1.5 text-sm">
                <span className="font-medium text-[--text-primary]">Full name</span>
                <input name="full_name" className="h-10 rounded-lg border border-[--border] bg-[--bg-input] px-3 text-[--text-primary] outline-none focus:border-[--accent]" />
              </label>
              <label className="grid gap-1.5 text-sm">
                <span className="font-medium text-[--text-primary]">Work email</span>
                <input required name="email" type="email" className="h-10 rounded-lg border border-[--border] bg-[--bg-input] px-3 text-[--text-primary] outline-none focus:border-[--accent]" />
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1.5 text-sm">
                <span className="font-medium text-[--text-primary]">I want to</span>
                <Select
                  required
                  name="role"
                  defaultValue="mentee"
                  items={[
                    { value: "mentee", label: "Find a mentor" },
                    { value: "mentor", label: "Become a mentor" },
                  ]}
                >
                  <SelectTrigger id="mentorship-role">
                    <SelectValue placeholder="Choose role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mentee">Find a mentor</SelectItem>
                    <SelectItem value="mentor">Become a mentor</SelectItem>
                  </SelectContent>
                </Select>
              </label>
              <label className="grid gap-1.5 text-sm">
                <span className="font-medium text-[--text-primary]">Company</span>
                <input name="company" className="h-10 rounded-lg border border-[--border] bg-[--bg-input] px-3 text-[--text-primary] outline-none focus:border-[--accent]" />
              </label>
            </div>
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-[--text-primary]">What would make this useful?</span>
              <textarea name="goals" rows={4} className="rounded-lg border border-[--border] bg-[--bg-input] px-3 py-2 text-[--text-primary] outline-none focus:border-[--accent]" />
            </label>
            <button type="submit" className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[--accent] px-5 text-sm font-semibold text-[--primary-foreground] hover:bg-[--accent-hover]">
              Join the waitlist
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
