export interface CategoryDescription {
  intro: string;
  featured: string[];
  relatedTools: string[];
  relatedTemplates: string[];
}

export const CATEGORY_DESCRIPTIONS: Record<string, CategoryDescription> = {
  "recruitment-and-talent-acquisition": {
    intro: "Recruitment is where Atlas HR turns strategy into team capacity. This category covers job descriptions, structured interviews, sourcing, salary conversations, candidate experience, references, and bias reduction. The focus is practical: better hiring decisions, fewer vague interviews, cleaner documentation, and a process candidates can respect even when they do not get the job.",
    featured: ["how-to-write-a-job-description", "the-complete-guide-to-structured-interviews", "how-to-reduce-bias-in-hiring"],
    relatedTools: ["job-description-generator", "interview-questions", "rejection-email", "cost-per-hire", "time-to-hire"],
    relatedTemplates: ["job-description", "interview-scorecard", "reference-check-form", "offer-letter"],
  },
  "onboarding-and-induction": {
    intro: "Onboarding is the first real proof that the company knows how to operate. These guides cover preboarding, remote onboarding, 30-60-90 plans, buddy systems, mentorship, and probation reviews. The goal is to reduce confusion, shorten ramp time, and give managers a repeatable structure for turning a signed offer into a productive employee.",
    featured: ["the-30-60-90-day-onboarding-plan-that-works", "onboarding-remote-employees-whats-different", "probation-periods-legal-and-practical"],
    relatedTools: ["30-60-90-plan", "onboarding-checklist"],
    relatedTemplates: ["new-hire-checklist", "offer-letter-acceptance-form", "employee-information-form"],
  },
  "employee-records-and-documentation": {
    intro: "Employee records are the quiet infrastructure behind payroll, compliance, performance, benefits, investigations, and exits. This category covers what to collect, how to store it, what to document, and how to keep records useful without creating unnecessary privacy or legal risk. Strong records make HR faster, fairer, and easier to defend.",
    featured: [],
    relatedTools: ["hr-dashboard"],
    relatedTemplates: ["employee-information-form", "new-hire-checklist"],
  },
  "leave-and-attendance": {
    intro: "Leave and attendance policies need to balance rest, fairness, coverage, and statutory obligations. These guides cover annual leave, parental leave, sick leave patterns, mental health days, carryover, approval workflows, and global variants. The aim is simple rules that managers can apply consistently without making employees feel policed.",
    featured: ["designing-a-leave-policy-that-works-for-everyone", "maternity-and-paternity-leave-globally", "sick-leave-abuse-handling-without-being-a-jerk"],
    relatedTools: ["absenteeism-rate"],
    relatedTemplates: ["employee-handbook-template", "remote-work-policy"],
  },
  "payroll-administration": {
    intro: "Payroll administration turns employment promises into accurate, timely pay. This category covers global payroll, final settlement, deductions, pay cadence, employer-of-record choices, contractor risk, and cross-border complexity. It is written for HR teams that need to understand payroll enough to spot risk before employees or regulators do.",
    featured: ["international-payroll-getting-started-with-global-teams", "managing-salary-increases-during-economic-uncertainty"],
    relatedTools: ["salary-benchmark", "pay-equity"],
    relatedTemplates: ["final-settlement-statement"],
  },
  "compensation-reward-and-benefits": {
    intro: "Compensation decisions shape trust, retention, and hiring speed. These guides cover salary structures, benchmarking, bonuses, equity, total rewards, pay equity, and increase planning. The category helps HR move beyond one-off negotiation toward transparent ranges, defensible decisions, and communication employees can understand.",
    featured: ["how-to-design-a-salary-structure-from-scratch", "pay-equity-audits-how-to-run-one", "salary-benchmarking-a-practical-guide"],
    relatedTools: ["salary-benchmark", "pay-equity"],
    relatedTemplates: ["final-settlement-statement"],
  },
  "performance-management": {
    intro: "Performance management works when expectations, feedback, evidence, and development all connect. These guides cover KPIs, OKRs, reviews, 360 feedback, calibration, burnout, ratings, and pay links. The emphasis is on conversations managers can actually run, not annual rituals that create paperwork and resentment.",
    featured: ["setting-kpis-that-drive-performance", "running-effective-performance-reviews", "how-to-give-feedback-that-lands"],
    relatedTools: ["performance-review", "pip-builder"],
    relatedTemplates: ["annual-performance-review", "quarterly-check-in", "360-feedback-form", "performance-improvement-plan-pip"],
  },
  "learning-and-development": {
    intro: "Learning and development is how organizations convert potential into capability. This category covers skill gaps, career paths, manager training, mentoring, reskilling, learning systems, and evaluation. The practical standard is whether training changes behaviour and helps the business, not whether people enjoyed the workshop.",
    featured: [],
    relatedTools: ["30-60-90-plan"],
    relatedTemplates: ["quarterly-check-in", "360-feedback-form"],
  },
  "employee-relations": {
    intro: "Employee relations is the craft of resolving problems before they become legal, cultural, or operational failures. This category covers grievances, conflict, accommodations, investigations, manager conduct, speak-up channels, and documentation. It treats fairness and evidence as practical operating habits, not legal theatre.",
    featured: ["conducting-workplace-investigations", "handling-harassment-complaints-step-by-step", "documentation-the-hr-habit-that-protects-everyone"],
    relatedTools: ["warning-letter", "termination-letter"],
    relatedTemplates: ["verbal-warning-record", "written-warning", "anti-harassment-policy"],
  },
  "discipline-and-grievance": {
    intro: "Discipline and grievance work is high-stakes because it affects trust, livelihood, and legal exposure. These guides cover warnings, investigations, PIPs, harassment complaints, redundancies, documentation, exits, and humane termination. The through-line is clear process, factual evidence, and dignity for everyone involved.",
    featured: ["how-to-fire-someone-with-dignity-and-legally", "conducting-workplace-investigations", "handling-harassment-complaints-step-by-step"],
    relatedTools: ["warning-letter", "termination-letter", "pip-builder"],
    relatedTemplates: ["verbal-warning-record", "written-warning", "termination-letter", "performance-improvement-plan-pip"],
  },
  "hr-policies-and-employee-handbook": {
    intro: "Policies are useful only when people can understand and apply them. This category covers handbooks, remote work, anti-harassment, privacy, social media, conduct, whistleblowing, travel, and expenses. The goal is policy language that protects the company while still sounding like a place humans work.",
    featured: ["building-your-first-employee-handbook", "anti-harassment-policy-what-every-company-needs", "data-privacy-and-hr-gdpr-ccpa-and-beyond"],
    relatedTools: ["warning-letter"],
    relatedTemplates: ["employee-handbook-template", "remote-work-policy", "anti-harassment-policy", "code-of-conduct"],
  },
  "compliance-and-labour-law": {
    intro: "Compliance is where HR needs humility and precision. This category explains labour-law concepts, statutory obligations, data protection, classification, working time, discrimination, and country variation. It is built to help HR teams ask better questions and know when local counsel must review the decision.",
    featured: ["understanding-at-will-employment"],
    relatedTools: ["termination-letter", "pay-equity"],
    relatedTemplates: ["employment-contract-permanent", "independent-contractor-agreement", "termination-letter"],
  },
  "employee-engagement-and-culture": {
    intro: "Engagement and culture show up in whether people trust leaders, understand priorities, and feel their work matters. This category covers listening, recognition, belonging, values, manager behaviour, and culture signals. It keeps the focus on observable habits and systems rather than slogans.",
    featured: ["building-an-employer-brand-from-scratch", "the-candidate-experience-why-it-matters"],
    relatedTools: ["hr-dashboard"],
    relatedTemplates: ["code-of-conduct", "employee-handbook-template"],
  },
  "health-safety-and-wellbeing": {
    intro: "Health, safety, and wellbeing sit at the intersection of legal duty and human responsibility. This category covers burnout, mental health days, workplace safety, return-to-work planning, remote ergonomics, and incident response. It helps HR move from reactive care to prevention and manager capability.",
    featured: ["how-to-handle-a-high-performer-burning-out", "mental-health-days-the-case-for-them"],
    relatedTools: ["absenteeism-rate"],
    relatedTemplates: ["remote-work-policy", "employee-handbook-template"],
  },
  "hr-analytics-and-reporting": {
    intro: "HR analytics should help leaders make better decisions, not bury them in dashboards. This category covers headcount, attrition, absence, hiring metrics, pay equity, demographics, and workforce trends. The focus is on simple calculations, clean definitions, and action when a metric moves.",
    featured: ["setting-kpis-that-drive-performance", "pay-equity-audits-how-to-run-one"],
    relatedTools: ["hr-dashboard", "turnover-rate", "headcount-planner", "time-to-hire"],
    relatedTemplates: [],
  },
  "offboarding-and-exit-management": {
    intro: "Offboarding protects continuity, security, and dignity when employment ends. This category covers resignations, final pay, handover, exit interviews, redundancy support, access removal, and termination documents. Good offboarding lowers risk and leaves a cleaner story for everyone who remains.",
    featured: ["the-exit-interview-getting-truth-and-using-it", "how-to-fire-someone-with-dignity-and-legally", "redundancy-legal-requirements-and-humane-execution"],
    relatedTools: ["termination-letter"],
    relatedTemplates: ["resignation-acceptance-letter", "termination-letter", "exit-interview-form", "final-settlement-statement"],
  },
  "remote-and-hybrid-work": {
    intro: "Remote and hybrid work need more than a location preference. This category covers eligibility, tax and jurisdiction risk, time zones, communication norms, equipment, expenses, security, onboarding, and manager cadence. The practical goal is flexibility with enough structure to avoid chaos.",
    featured: ["the-remote-work-policy-with-country-variants", "onboarding-remote-employees-whats-different", "international-payroll-getting-started-with-global-teams"],
    relatedTools: ["headcount-planner"],
    relatedTemplates: ["remote-work-policy", "data-privacy-policy-employee"],
  },
  "diversity-equity-and-inclusion": {
    intro: "Diversity, equity, and inclusion become real when hiring, pay, promotion, policy, and daily manager decisions are examined for fairness. This category covers bias reduction, pay equity, harassment prevention, inclusive language, representation, and measurement. It favours concrete systems over performative statements.",
    featured: ["how-to-reduce-bias-in-hiring", "pay-equity-audits-how-to-run-one", "anti-harassment-policy-what-every-company-needs"],
    relatedTools: ["pay-equity", "hr-dashboard"],
    relatedTemplates: ["anti-harassment-policy", "code-of-conduct"],
  },
  "manager-support": {
    intro: "Managers are where HR strategy becomes employee experience. This category gives managers practical support for feedback, performance conversations, 1:1s, burnout, discipline, onboarding, and team clarity. It is written for the moment before a manager sends the message, runs the meeting, or makes the call.",
    featured: ["how-to-give-feedback-that-lands", "how-to-handle-a-high-performer-burning-out", "running-effective-performance-reviews"],
    relatedTools: ["performance-review", "pip-builder", "30-60-90-plan"],
    relatedTemplates: ["quarterly-check-in", "annual-performance-review", "performance-improvement-plan-pip"],
  },
  "workforce-planning-and-org-design": {
    intro: "Workforce planning connects business goals to roles, skills, timing, and cost. This category covers headcount planning, spans of control, job architecture, leveling, scenario planning, succession, and organizational design. It helps HR move from reactive hiring requests to a forward-looking workforce plan.",
    featured: ["how-to-design-a-salary-structure-from-scratch", "setting-kpis-that-drive-performance", "salary-benchmarking-a-practical-guide"],
    relatedTools: ["headcount-planner", "turnover-rate", "hr-dashboard"],
    relatedTemplates: ["job-description", "annual-performance-review"],
  },
};
