import type { TemplateVariant } from "./templates-data";

export type CountryHub = {
  slug: "nigeria" | "india" | "uk" | "us";
  name: string;
  variant: TemplateVariant;
  headline: string;
  summary: string;
  lastUpdated: string;
  legalReviewStatus: string;
  sourceNote: string;
  leave: string[];
  termination: string[];
  contracts: string[];
  payroll: string[];
  probation: string[];
  noticePeriods: string[];
  requiredDocuments: string[];
  templateSlugs: string[];
  articleSlugs: string[];
  toolSlugs: string[];
  whenToCallCounsel: string[];
};

export type IndustryHub = {
  slug: string;
  name: string;
  summary: string;
  pressurePoints: string[];
  templateSlugs: string[];
  toolSlugs: string[];
  articleSlugs: string[];
};

export type WorkflowBundle = {
  slug: string;
  title: string;
  summary: string;
  intent: string;
  countryAware: boolean;
  steps: string[];
  articleSlugs: string[];
  templateSlugs: string[];
  toolSlugs: string[];
  savedActions: string[];
  trustSignals: string[];
  whenToCallCounsel: string[];
};

export type WorkflowLaunchTarget = {
  label: string;
  href: string;
  note: string;
  secondaryHref?: string;
  secondaryLabel?: string;
};

export type ComparisonPage = {
  slug: string;
  title: string;
  summary: string;
  competitorStrengths: string[];
  atlasAdvantages: string[];
  gapsToClose: string[];
  cta: string;
};

export type ComplianceUpdate = {
  id: string;
  country: string;
  title: string;
  date: string;
  status: "Monitoring" | "Action needed" | "Review recommended";
  whatChanged: string;
  whoIsAffected: string;
  whatToDoNext: string[];
};

export const TRUST_SIGNALS = {
  disclaimer:
    "Atlas HR resources are practical HR guidance, not legal advice. Review high-risk decisions with qualified local counsel.",
  legalReviewStatus: "Editorial draft. Legal review recommended before use in a live employment decision.",
  sourceNote:
    "Use official labour, tax, pension, and regulator sources as the source of truth for current statutory figures.",
};

export const COUNTRY_HUBS: CountryHub[] = [
  {
    slug: "nigeria",
    name: "Nigeria",
    variant: "ng",
    headline: "Nigeria HR guidance built for real payroll, contract, leave, and exit work.",
    summary:
      "A practical operating hub for Nigerian HR teams covering contracts, Labour Act basics, PAYE, pension, NSITF, leave, probation, notice, termination, and required records.",
    lastUpdated: "2026-05-16",
    legalReviewStatus: TRUST_SIGNALS.legalReviewStatus,
    sourceNote:
      "Verify Labour Act, PenCom, NSITF, tax, ITF, immigration, and National Industrial Court issues before acting.",
    leave: [
      "Annual leave minimums for covered workers plus common market enhancements.",
      "Sick leave, maternity leave, compassionate leave, study leave, and public holiday planning.",
      "Approval workflows that keep medical details private while preserving absence records.",
    ],
    termination: [
      "Confirm employment category, contract terms, reason, documentation, and protected-risk flags.",
      "Calculate final salary, notice or pay in lieu, accrued leave, pension, deductions, and severance where relevant.",
      "Use written letters and final settlement records for every exit.",
    ],
    contracts: [
      "Issue written terms for all employees, including senior staff and fixed-term hires.",
      "Define allowances, pensionable pay, deductions, confidentiality, IP, probation, and notice.",
      "Review long-term contractors for misclassification risk.",
    ],
    payroll: [
      "Maintain PAYE, pension, NSITF, group life, and applicable ITF evidence.",
      "Show gross pay, allowances, deductions, employer pension, and net pay clearly on payslips.",
      "Separate statutory obligations from discretionary market benefits.",
    ],
    probation: [
      "Set probation length, review date, extension process, and notice in the contract.",
      "Run documented 30/60/90 reviews instead of waiting for a dispute.",
      "Treat pregnancy, whistleblowing, union activity, and discrimination risk carefully.",
    ],
    noticePeriods: [
      "Covered Labour Act workers: one day up to 3 months of service.",
      "More than 3 months but less than 2 years: one week.",
      "2 to 5 years: two weeks. 5 years or more: one month.",
      "Senior staff notice usually follows contract terms.",
    ],
    requiredDocuments: [
      "Signed offer or employment contract",
      "Handbook acknowledgement",
      "Payroll, PAYE, pension, NSITF, and group life records",
      "Leave, performance, disciplinary, investigation, and final settlement records",
      "Asset return and access removal checklist",
    ],
    templateSlugs: [
      "employment-contract-permanent",
      "offer-letter",
      "termination-letter",
      "final-settlement-statement",
      "employee-handbook-template",
    ],
    articleSlugs: [
      "how-to-fire-someone-with-dignity-and-legally",
      "probation-periods-legal-and-practical",
      "international-payroll-getting-started-with-global-teams",
    ],
    toolSlugs: ["salary-benchmark", "turnover-rate", "hr-dashboard"],
    whenToCallCounsel: [
      "Redundancy or collective consultation",
      "Senior executive exits",
      "Union matters, expatriate quota, pension arrears, tax disputes, or misconduct investigations",
    ],
  },
  {
    slug: "india",
    name: "India",
    variant: "in",
    headline: "India HR guidance for state-aware contracts, payroll, leave, and employee records.",
    summary:
      "A practical hub for India HR operations across contracts, shops and establishments rules, payroll deductions, probation, notice, leave, and documentation.",
    lastUpdated: "2026-05-16",
    legalReviewStatus: TRUST_SIGNALS.legalReviewStatus,
    sourceNote:
      "Verify state Shops and Establishments rules, PF, ESI, gratuity, professional tax, and labour code implementation before acting.",
    leave: [
      "Map leave to state rules and company policy: earned leave, sick leave, casual leave, maternity, and public holidays.",
      "Document carry-forward, encashment, approval, and manager escalation rules.",
      "Keep state-specific holiday calendars for distributed teams.",
    ],
    termination: [
      "Review contract, state rules, standing orders if applicable, and misconduct or performance documentation.",
      "Calculate notice, earned leave encashment, gratuity where applicable, salary through last day, and deductions.",
      "Use documented inquiry and response processes for serious misconduct.",
    ],
    contracts: [
      "Define role, location, work arrangement, compensation components, confidentiality, IP, probation, notice, and dispute forum.",
      "Clarify contractor and consultant arrangements to reduce misclassification risk.",
      "Align offer letters with the final employment agreement.",
    ],
    payroll: [
      "Track PF, ESI where applicable, professional tax, TDS, gratuity exposure, bonus rules, and reimbursements.",
      "Separate cost-to-company from fixed salary, variable pay, and reimbursable benefits.",
      "Maintain payslips and statutory remittance evidence.",
    ],
    probation: [
      "Set probation length, extension rules, confirmation process, and notice clearly.",
      "Schedule manager reviews before the probation end date.",
      "Avoid using probation as a substitute for documented performance feedback.",
    ],
    noticePeriods: [
      "Notice is usually contract and state-rule driven.",
      "Common professional roles use 30 to 90 days depending on level and market.",
      "Verify local rules before shortening notice or using pay in lieu.",
    ],
    requiredDocuments: [
      "Offer letter and employment agreement",
      "Identity, tax, bank, PF/ESI, and emergency contact records",
      "Leave register, payroll records, payslips, and statutory remittance evidence",
      "Performance, warning, inquiry, and exit documents",
    ],
    templateSlugs: [
      "employment-contract-permanent",
      "offer-letter",
      "independent-contractor-agreement",
      "termination-letter",
      "final-settlement-statement",
    ],
    articleSlugs: [
      "international-payroll-getting-started-with-global-teams",
      "probation-periods-legal-and-practical",
      "salary-benchmarking-a-practical-guide",
    ],
    toolSlugs: ["salary-benchmark", "pay-equity", "hr-dashboard"],
    whenToCallCounsel: [
      "Retrenchment, plant closure, union issues, or standing-order questions",
      "Misconduct inquiry, harassment complaint, or protected leave issue",
      "PF, ESI, gratuity, bonus, or professional tax disputes",
    ],
  },
  {
    slug: "uk",
    name: "United Kingdom",
    variant: "uk",
    headline: "UK HR guidance for fair process, contracts, leave, notice, and employee relations.",
    summary:
      "A UK operating hub for employment particulars, holiday, sickness, family leave, fair dismissal, redundancy, payroll basics, probation, and employee documents.",
    lastUpdated: "2026-05-16",
    legalReviewStatus: TRUST_SIGNALS.legalReviewStatus,
    sourceNote:
      "Verify GOV.UK, ACAS, HMRC, pension, working time, and equality guidance before acting.",
    leave: [
      "Track statutory holiday, bank holiday treatment, sickness absence, maternity, paternity, adoption, shared parental, and compassionate leave.",
      "Document holiday year, accrual, carry-over, sickness overlap, and approval rules.",
      "Use clear return-to-work and reasonable-adjustment processes.",
    ],
    termination: [
      "Check qualifying service, fair reason, procedure, evidence, consultation, and protected characteristics.",
      "Calculate notice, holiday pay, final salary, deductions, pension, expenses, and statutory redundancy where applicable.",
      "Use ACAS-style process for discipline, grievance, and dismissal risk.",
    ],
    contracts: [
      "Provide written particulars and clear terms on role, place of work, pay, hours, benefits, probation, notice, policies, and confidentiality.",
      "Keep handbook terms clear on which policies are contractual.",
      "Review worker, employee, and contractor status carefully.",
    ],
    payroll: [
      "Track PAYE, National Insurance, pensions auto-enrolment, statutory pay, deductions, and payslips.",
      "Coordinate HR changes with payroll cut-offs and final-pay calculations.",
      "Keep payroll evidence and employee communications together.",
    ],
    probation: [
      "Use probation to structure feedback, not to bypass fairness.",
      "Set objectives, review dates, extension rules, and notice.",
      "Watch discrimination, whistleblowing, pregnancy, union, and health-related risks from day one.",
    ],
    noticePeriods: [
      "Statutory minimum notice starts after one month of service.",
      "One week after one month, then one week per complete year up to 12 weeks.",
      "Contract notice can be longer and must be checked before action.",
    ],
    requiredDocuments: [
      "Written particulars or employment contract",
      "Right-to-work evidence",
      "Payroll, pension, tax, and payslip records",
      "Holiday, sickness, family leave, disciplinary, grievance, and performance records",
    ],
    templateSlugs: [
      "employment-contract-permanent",
      "employment-contract-fixed-term",
      "offer-letter",
      "termination-letter",
      "employee-handbook-template",
    ],
    articleSlugs: [
      "redundancy-legal-requirements-and-humane-execution",
      "handling-harassment-complaints-step-by-step",
      "the-remote-work-policy-with-country-variants",
    ],
    toolSlugs: ["turnover-rate", "pay-equity", "absenteeism-rate"],
    whenToCallCounsel: [
      "Dismissal, redundancy, TUPE, settlement agreement, or discrimination risk",
      "Long-term sickness, disability, pregnancy, whistleblowing, or grievance escalation",
      "Complex contractor or worker-status questions",
    ],
  },
  {
    slug: "us",
    name: "United States",
    variant: "us",
    headline: "US HR guidance for at-will realities, state variation, leave, payroll, and documentation.",
    summary:
      "A US operating hub for offer letters, at-will employment, state-specific leave, final pay, payroll basics, documentation, harassment prevention, and employee records.",
    lastUpdated: "2026-05-16",
    legalReviewStatus: TRUST_SIGNALS.legalReviewStatus,
    sourceNote:
      "Verify federal, state, and local rules including DOL, EEOC, IRS, state labor departments, wage-hour, leave, and final-pay rules.",
    leave: [
      "Map federal FMLA where applicable, state paid leave, sick leave, pregnancy accommodation, military leave, jury duty, and company PTO.",
      "Avoid using one national PTO policy without state addenda.",
      "Document leave requests, approvals, medical certification boundaries, and retaliation controls.",
    ],
    termination: [
      "At-will does not remove discrimination, retaliation, wage-hour, contract, public policy, or protected leave risk.",
      "Check final pay deadlines, PTO payout rules, COBRA, equipment return, and separation documentation.",
      "Use factual documentation for performance, conduct, reductions in force, and complaints.",
    ],
    contracts: [
      "Use offer letters and agreements carefully so they do not undermine at-will language.",
      "Review confidentiality, restrictive covenant, arbitration, IP, and invention assignment rules by state.",
      "Classify exempt/non-exempt employees and contractors carefully.",
    ],
    payroll: [
      "Track federal, state, and local tax withholding, wage statements, overtime, deductions, reimbursements, and final pay.",
      "Review exempt status and overtime eligibility before salary decisions.",
      "Keep payroll and HR records aligned for audits and disputes.",
    ],
    probation: [
      "Avoid language that suggests employment becomes guaranteed after probation.",
      "Use introductory periods for feedback and onboarding milestones.",
      "Document performance consistently and avoid protected-category comments.",
    ],
    noticePeriods: [
      "Many US roles are at-will with no statutory notice, but contracts, policies, WARN, state rules, or collective agreements can change this.",
      "Final pay deadlines vary by state and can be immediate in some exits.",
      "Use counsel for layoffs, executives, and protected-risk exits.",
    ],
    requiredDocuments: [
      "Offer letter and signed acknowledgements",
      "I-9, tax withholding, payroll, benefit, and policy records",
      "Leave, accommodation, disciplinary, performance, investigation, and final-pay records",
      "State-specific notices and wage statements",
    ],
    templateSlugs: [
      "offer-letter",
      "employment-contract-permanent",
      "independent-contractor-agreement",
      "anti-harassment-policy",
      "termination-letter",
    ],
    articleSlugs: [
      "understanding-at-will-employment",
      "data-privacy-and-hr-gdpr-ccpa-and-beyond",
      "how-to-reduce-bias-in-hiring",
    ],
    toolSlugs: ["pay-equity", "salary-benchmark", "cost-per-hire"],
    whenToCallCounsel: [
      "Layoffs, WARN risk, protected leave, retaliation, harassment, or discrimination allegations",
      "Restrictive covenant, arbitration, contractor, exempt status, or multi-state policy questions",
      "Executive exits or high-value severance negotiations",
    ],
  },
];

export const INDUSTRY_HUBS: IndustryHub[] = [
  {
    slug: "technology",
    name: "Technology",
    summary:
      "Hiring speed, leveling, equity, remote work, burnout, visas, performance, compensation, and retention for fast-moving technical teams.",
    pressurePoints: ["Senior technical hiring", "Leveling and pay bands", "Remote and contractor risk", "Burnout and retention"],
    templateSlugs: ["job-description", "interview-scorecard", "offer-letter", "annual-performance-review"],
    toolSlugs: ["salary-benchmark", "job-post-scorecard", "candidate-experience-audit", "employer-brand-checklist"],
    articleSlugs: ["the-complete-guide-to-structured-interviews", "equity-compensation-explained-for-hr"],
  },
  {
    slug: "healthcare",
    name: "Healthcare",
    summary:
      "Credentialing, shift coverage, patient safety, burnout, leave coverage, training, compliance, and incident documentation.",
    pressurePoints: ["Credential tracking", "Shift coverage", "Burnout and absence", "Safety and incident records"],
    templateSlugs: ["employee-handbook-template", "anti-harassment-policy", "written-warning", "new-hire-checklist"],
    toolSlugs: ["absenteeism-rate", "turnover-rate", "hr-dashboard"],
    articleSlugs: ["mental-health-days-the-case-for-them", "documentation-the-hr-habit-that-protects-everyone"],
  },
  {
    slug: "manufacturing",
    name: "Manufacturing",
    summary:
      "Shift work, safety, unions, overtime, attendance, discipline, payroll controls, training, and redundancy planning.",
    pressurePoints: ["Attendance and overtime", "Safety training", "Union and consultation risk", "Discipline documentation"],
    templateSlugs: ["written-warning", "verbal-warning-record", "travel-and-expense-policy", "termination-letter"],
    toolSlugs: ["absenteeism-rate", "turnover-rate", "pay-equity"],
    articleSlugs: ["sick-leave-abuse-handling-without-being-a-jerk", "conducting-workplace-investigations"],
  },
  {
    slug: "retail",
    name: "Retail",
    summary:
      "High-volume hiring, scheduling, absence, store-manager consistency, seasonal onboarding, policy enforcement, and employee relations.",
    pressurePoints: ["Seasonal hiring", "Scheduling and absence", "Manager consistency", "Turnover and onboarding"],
    templateSlugs: ["job-description", "new-hire-checklist", "employee-handbook-template", "written-warning"],
    toolSlugs: ["job-post-scorecard", "candidate-experience-audit", "employer-brand-checklist", "time-to-hire"],
    articleSlugs: ["the-candidate-experience-why-it-matters", "designing-a-leave-policy-that-works-for-everyone"],
  },
];

export const WORKFLOW_BUNDLES: WorkflowBundle[] = [
  {
    slug: "offer-letter",
    title: "Send a compliant offer letter",
    summary: "Move from role approval to a country-aware offer letter, acceptance trail, and onboarding start.",
    intent: "Hiring teams ready to make an offer.",
    countryAware: true,
    steps: ["Confirm role, pay, location, reporting line, and start date.", "Select the right country variant.", "Generate the offer letter and acceptance form.", "Save the document and start onboarding tasks.", "Track acceptance and handover to payroll."],
    articleSlugs: ["how-to-negotiate-salaries-with-candidates", "the-candidate-experience-why-it-matters"],
    templateSlugs: ["offer-letter", "offer-letter-acceptance-form", "employment-contract-permanent"],
    toolSlugs: ["salary-benchmark", "job-description-generator", "job-post-scorecard", "candidate-experience-audit"],
    savedActions: ["Save generated offer", "Attach to candidate or employee", "Create onboarding checklist"],
    trustSignals: ["Country variant available", "Legal review recommended", "Last updated metadata shown"],
    whenToCallCounsel: ["Equity grants, relocation, immigration, restrictive covenants, or executive offers."],
  },
  {
    slug: "termination",
    title: "Terminate employment with documentation",
    summary: "Bundle the legal guide, checklist, termination letter, final settlement, approval trail, and employee archive.",
    intent: "HR teams handling performance, conduct, redundancy, end-of-contract, or probation exits.",
    countryAware: true,
    steps: ["Confirm reason and jurisdiction.", "Review protected-risk flags and prior documentation.", "Calculate notice, final pay, leave, expenses, and deductions.", "Generate termination and settlement documents.", "Route for approval, archive, and remove access."],
    articleSlugs: ["how-to-fire-someone-with-dignity-and-legally", "redundancy-legal-requirements-and-humane-execution"],
    templateSlugs: ["termination-letter", "final-settlement-statement", "exit-interview-form"],
    toolSlugs: ["pay-equity", "hr-dashboard"],
    savedActions: ["Start approval workflow", "Flag legal review", "Attach documents to employee profile", "Log audit trail"],
    trustSignals: ["High-risk decision", "Counsel checkpoint", "Final-pay checklist"],
    whenToCallCounsel: ["Redundancy, discrimination risk, retaliation risk, pregnancy, whistleblowing, union activity, or senior exits."],
  },
  {
    slug: "onboarding",
    title: "Run structured onboarding",
    summary: "Turn a signed offer into preboarding, day-one, week-one, and month-one tasks.",
    intent: "Managers and HR teams preparing for a new hire.",
    countryAware: true,
    steps: ["Collect employee information.", "Assign HR, manager, IT, buddy, and employee tasks.", "Prepare documents and policy acknowledgements.", "Schedule 30/60/90 check-ins.", "Track completion and first-month risks."],
    articleSlugs: ["the-30-60-90-day-onboarding-plan-that-works", "onboarding-starts-before-day-one-pre-boarding"],
    templateSlugs: ["new-hire-checklist", "employee-information-form", "offer-letter-acceptance-form"],
    toolSlugs: ["30-60-90-plan", "onboarding-checklist", "candidate-experience-audit"],
    savedActions: ["Create onboarding run", "Assign tasks", "Attach required documents"],
    trustSignals: ["Employee data privacy note", "Required document list", "Manager checklist"],
    whenToCallCounsel: ["Immigration, contractor conversion, child labor, regulated roles, or cross-border remote work."],
  },
  {
    slug: "performance-improvement-plan",
    title: "Create a fair performance improvement plan",
    summary: "Build a specific PIP with evidence, support, review cadence, and consequences.",
    intent: "Managers addressing sustained performance gaps.",
    countryAware: false,
    steps: ["Define the performance gap with evidence.", "Set measurable expectations.", "List support, resources, and check-in cadence.", "Generate the PIP document.", "Save review notes and outcomes."],
    articleSlugs: ["performance-improvement-plans-the-right-way", "how-to-give-feedback-that-lands"],
    templateSlugs: ["performance-improvement-plan-pip", "quarterly-check-in"],
    toolSlugs: ["pip-builder", "performance-review"],
    savedActions: ["Create PIP document", "Schedule check-ins", "Flag legal review if termination is likely"],
    trustSignals: ["Evidence checklist", "Support-first language", "Review cadence"],
    whenToCallCounsel: ["Protected leave, disability, pregnancy, whistleblowing, retaliation, or immediate termination risk."],
  },
  {
    slug: "leave-policy",
    title: "Build or update a leave policy",
    summary: "Turn statutory leave, company benefits, approval rules, and manager scripts into a usable policy.",
    intent: "Teams formalizing leave rules or expanding across countries.",
    countryAware: true,
    steps: ["Confirm statutory minimums by country.", "Separate legal entitlements from company enhancements.", "Define approval, carry-over, documentation, and payroll handling.", "Generate policy text.", "Publish and collect acknowledgements."],
    articleSlugs: ["designing-a-leave-policy-that-works-for-everyone", "maternity-and-paternity-leave-globally"],
    templateSlugs: ["employee-handbook-template", "remote-work-policy"],
    toolSlugs: ["absenteeism-rate"],
    savedActions: ["Save policy", "Start employee acknowledgement", "Schedule annual review"],
    trustSignals: ["Jurisdiction list", "Last updated date", "Statutory vs company benefit split"],
    whenToCallCounsel: ["Multi-state leave, pregnancy, disability, protected leave, or collective agreement conflicts."],
  },
  {
    slug: "employee-handbook",
    title: "Publish an employee handbook",
    summary: "Create a handbook with conduct, leave, privacy, complaints, remote work, and acknowledgement controls.",
    intent: "Teams that need one policy source employees can understand.",
    countryAware: true,
    steps: ["Choose handbook sections.", "Add country and company policy variants.", "Generate the handbook.", "Route for review.", "Publish, collect acknowledgement, and version-control updates."],
    articleSlugs: ["building-your-first-employee-handbook", "code-of-conduct-making-values-actionable"],
    templateSlugs: ["employee-handbook-template", "code-of-conduct", "anti-harassment-policy"],
    toolSlugs: ["hr-dashboard"],
    savedActions: ["Save policy version", "Collect acknowledgement", "Track review date"],
    trustSignals: ["Version control", "Acknowledgement record", "Legal review status"],
    whenToCallCounsel: ["New jurisdiction launches, unionized workforce, regulated industry, or disciplinary-policy changes."],
  },
  {
    slug: "payroll-run",
    title: "Run payroll with HR controls",
    summary: "Prepare payroll inputs, deductions, approvals, payslips, final pay, and reporting evidence.",
    intent: "HR and finance teams coordinating monthly payroll.",
    countryAware: true,
    steps: ["Lock employee changes and variable pay.", "Validate deductions, leave, expenses, and new hires.", "Run approval and exception checks.", "Publish payslips and payment status.", "Archive payroll evidence."],
    articleSlugs: ["international-payroll-getting-started-with-global-teams", "managing-salary-increases-during-economic-uncertainty"],
    templateSlugs: ["final-settlement-statement"],
    toolSlugs: ["salary-benchmark", "pay-equity", "hr-dashboard"],
    savedActions: ["Create payroll run", "Export report", "Archive approvals"],
    trustSignals: ["Approval trail", "Payroll evidence checklist", "Country obligations"],
    whenToCallCounsel: ["Back pay, unlawful deductions, tax disputes, pension arrears, or cross-border payroll."],
  },
  {
    slug: "performance-review",
    title: "Run performance reviews",
    summary: "Standardize objectives, ratings, calibration, manager notes, employee self-assessment, and outcomes.",
    intent: "HR teams launching annual, quarterly, probation, or 360 reviews.",
    countryAware: false,
    steps: ["Define cycle, scope, and rating scale.", "Collect self, manager, and peer feedback.", "Run calibration.", "Generate review documents.", "Save outcomes and development actions."],
    articleSlugs: ["running-effective-performance-reviews", "calibration-sessions-fair-ratings-across-teams"],
    templateSlugs: ["annual-performance-review", "quarterly-check-in", "360-feedback-form"],
    toolSlugs: ["performance-review", "pay-equity"],
    savedActions: ["Create review cycle", "Generate forms", "Export calibration summary"],
    trustSignals: ["Calibration notes", "Pay equity checkpoint", "Manager guidance"],
    whenToCallCounsel: ["Reviews tied to demotion, pay reduction, termination, discrimination complaint, or protected leave."],
  },
  {
    slug: "disciplinary-warning",
    title: "Issue a disciplinary warning",
    summary: "Document facts, evidence, employee response, expectations, timeline, and follow-up.",
    intent: "Managers and HR teams handling conduct, attendance, or performance issues.",
    countryAware: true,
    steps: ["Record facts and evidence.", "Check policy, prior warnings, and protected-risk flags.", "Hold the meeting and capture response.", "Generate warning record.", "Schedule follow-up and save to employee file."],
    articleSlugs: ["verbal-vs-written-warnings-when-to-use-each", "documentation-the-hr-habit-that-protects-everyone"],
    templateSlugs: ["verbal-warning-record", "written-warning"],
    toolSlugs: ["warning-letter"],
    savedActions: ["Attach to employee file", "Create follow-up task", "Flag escalation"],
    trustSignals: ["Evidence checklist", "Employee response field", "No-retaliation reminder"],
    whenToCallCounsel: ["Harassment, discrimination, whistleblowing, union activity, or dismissal risk."],
  },
  {
    slug: "country-specific-employment-contract",
    title: "Create a country-specific employment contract",
    summary: "Use existing country variants for US, UK, Nigeria, and India so templates localize instead of staying generic.",
    intent: "Teams hiring across jurisdictions.",
    countryAware: true,
    steps: ["Choose country variant.", "Confirm role, pay, benefits, probation, leave, notice, confidentiality, and IP.", "Generate contract.", "Route for review.", "Save signed copy and onboarding records."],
    articleSlugs: ["the-remote-work-policy-with-country-variants", "international-payroll-getting-started-with-global-teams"],
    templateSlugs: ["employment-contract-permanent", "employment-contract-fixed-term", "independent-contractor-agreement"],
    toolSlugs: ["salary-benchmark", "pay-equity"],
    savedActions: ["Generate country variant", "Save signed document", "Set review date"],
    trustSignals: ["US, UK, Nigeria, and India variants", "Contractor risk note", "Counsel checkpoint"],
    whenToCallCounsel: ["Restrictive covenants, worker classification, immigration, IP-heavy roles, or executive terms."],
  },
];

export const COMPARISON_PAGES: ComparisonPage[] = [
  {
    slug: "atlas-hr-vs-shrm-templates",
    title: "Atlas HR vs SHRM templates",
    summary:
      "SHRM is an authority hub. Atlas HR should win when teams want country-aware templates connected to documents, workflows, employee records, and AI drafting.",
    competitorStrengths: ["Brand authority", "Large HR resource library", "Certification ecosystem", "US compliance depth"],
    atlasAdvantages: ["Country variants for templates", "AI drafting and saved documents", "Workflow bundles", "HRIS context and employee files"],
    gapsToClose: ["More legal reviewer proof", "More regulatory citations", "More US state-level depth"],
    cta: "Use Atlas when you need the template, the workflow, and the employee record in one place.",
  },
  {
    slug: "atlas-hr-vs-workable-templates",
    title: "Atlas HR vs Workable templates",
    summary:
      "Workable is strong for recruiting resources. Atlas HR should extend beyond hiring into contracts, onboarding, performance, payroll, discipline, and country-aware HR operations.",
    competitorStrengths: ["Large recruiting template library", "Job descriptions", "Interview kits", "Hiring process guidance"],
    atlasAdvantages: ["Recruiting plus employee lifecycle", "Country-specific HR documents", "Payroll, performance, leave, and discipline workflows", "Copilot for HR follow-through"],
    gapsToClose: ["More role-specific job descriptions", "More interview question banks", "More ATS integrations"],
    cta: "Use Atlas when hiring needs to flow into onboarding, documents, compliance, and employee management.",
  },
  {
    slug: "nigeria-hr-compliance",
    title: "Atlas HR for Nigeria HR compliance",
    summary:
      "Most HR resource sites are US or UK first. Atlas HR can be better for Nigerian teams by combining local guidance, templates, payroll checkpoints, and manager workflows.",
    competitorStrengths: ["International HR content volume", "General compliance explainers", "Large newsletter audiences"],
    atlasAdvantages: ["Nigeria-specific guide", "NG template variants", "Payroll and final settlement workflow", "Local operating realities like pension, NSITF, PAYE, and documentation"],
    gapsToClose: ["More Nigerian legal reviewer proof", "More official-source citations", "More state and sector examples"],
    cta: "Use Atlas when Nigerian HR work needs practical templates and operating checklists, not generic global advice.",
  },
];

export const COMPLIANCE_UPDATES: ComplianceUpdate[] = [
  {
    id: "ng-minimum-wage-payroll-review",
    country: "Nigeria",
    title: "Minimum wage and payroll file review",
    date: "2026-05-16",
    status: "Review recommended",
    whatChanged:
      "Nigeria's recent minimum wage reforms made payroll documentation, pay structure, and statutory remittance review more important for HR teams.",
    whoIsAffected: "Employers with Nigerian employees, especially teams with junior, hourly, clerical, factory, retail, or support roles.",
    whatToDoNext: ["Review pay floors and allowance structure.", "Check PAYE, pension, NSITF, and payslip evidence.", "Update contracts and payroll records where needed."],
  },
  {
    id: "in-state-leave-contract-review",
    country: "India",
    title: "State-aware leave and contract review",
    date: "2026-05-16",
    status: "Monitoring",
    whatChanged:
      "Distributed teams in India need clearer state-aware leave, holiday, payroll, and contract controls as remote hiring expands.",
    whoIsAffected: "Companies hiring employees across multiple Indian states or moving from contractor to employee arrangements.",
    whatToDoNext: ["Map employee location to state rules.", "Check leave, holiday, PF, ESI, gratuity, and professional tax treatment.", "Update contracts and employee handbooks."],
  },
  {
    id: "uk-fair-process-checkpoint",
    country: "United Kingdom",
    title: "Fair process checkpoint for exits and grievances",
    date: "2026-05-16",
    status: "Action needed",
    whatChanged:
      "UK HR teams should keep discipline, grievance, redundancy, and dismissal workflows tightly aligned with evidence and consultation expectations.",
    whoIsAffected: "Employers managing performance exits, misconduct investigations, grievances, long-term sickness, or redundancy.",
    whatToDoNext: ["Audit current warning and investigation templates.", "Add protected-risk checks to exit workflows.", "Review final pay, notice, and holiday pay calculations."],
  },
  {
    id: "us-multistate-policy-review",
    country: "United States",
    title: "Multi-state handbook and final-pay review",
    date: "2026-05-16",
    status: "Review recommended",
    whatChanged:
      "US employers hiring across state lines need policies that handle leave, wage statements, final pay, PTO payout, and restrictive covenant differences.",
    whoIsAffected: "Remote-first or multi-state US employers using one national handbook or offer template.",
    whatToDoNext: ["Add state addenda where needed.", "Review final-pay and PTO payout rules.", "Check restrictive covenant and arbitration language by state."],
  },
];

export function getCountryHub(slug: string) {
  return COUNTRY_HUBS.find((country) => country.slug === slug);
}

export function getIndustryHub(slug: string) {
  return INDUSTRY_HUBS.find((industry) => industry.slug === slug);
}

export function getWorkflowBundle(slug: string) {
  return WORKFLOW_BUNDLES.find((workflow) => workflow.slug === slug);
}

export function getWorkflowLaunchTarget(slug: string): WorkflowLaunchTarget {
  switch (slug) {
    case "onboarding":
      return {
        label: "Start onboarding run",
        href: "/onboarding/new?workflow=onboarding",
        note: "Uses the existing lifecycle run engine to create onboarding tasks from a template.",
        secondaryHref: "/onboarding/templates",
        secondaryLabel: "Review templates",
      };
    case "payroll-run":
      return {
        label: "Create payroll run",
        href: "/payroll/new?workflow=payroll-run",
        note: "Opens payroll creation so HR can validate salary, deductions, approvals, and final records.",
        secondaryHref: "/reports",
        secondaryLabel: "Open reports",
      };
    case "performance-review":
      return {
        label: "Start review cycle",
        href: "/performance/new?workflow=performance-review",
        note: "Creates a performance cycle and review tasks for active employees.",
        secondaryHref: "/performance",
        secondaryLabel: "View cycles",
      };
    case "leave-policy":
    case "employee-handbook":
      return {
        label: "Add policy to library",
        href: `/org/library/new?workflow=${slug}`,
        note: "Publishes the generated policy into the workspace policy library with review and acknowledgement context.",
        secondaryHref: `/copilot?workflow=${slug}`,
        secondaryLabel: "Draft with Copilot",
      };
    case "termination":
    case "disciplinary-warning":
      return {
        label: "Draft with Copilot",
        href: `/copilot?workflow=${slug}`,
        note: "Preloads a high-risk HR prompt with evidence, approval, final document, audit, and legal review checkpoints.",
        secondaryHref: "/org/documents/new",
        secondaryLabel: "Add employee document",
      };
    case "offer-letter":
    case "country-specific-employment-contract":
    case "performance-improvement-plan":
    default:
      return {
        label: "Draft with Copilot",
        href: `/copilot?workflow=${slug}`,
        note: "Preloads a structured prompt so Copilot can draft the document and action checklist from this workflow.",
        secondaryHref: "/templates",
        secondaryLabel: "Browse templates",
      };
  }
}

export function buildWorkflowCopilotPrompt(slug: string) {
  const workflow = getWorkflowBundle(slug);
  if (!workflow) return "";

  return `Help me run the "${workflow.title}" workflow in Atlas HR.

Context:
- Workflow intent: ${workflow.intent}
- Country-aware: ${workflow.countryAware ? "yes" : "no"}
- Summary: ${workflow.summary}

Please produce:
1. A short intake checklist of details you need from me.
2. The recommended step-by-step workflow.
3. The document(s) to draft or generate.
4. Approval, audit trail, employee record, and saved-action checkpoints.
5. Legal review flags and when to call counsel.

Workflow steps to use:
${workflow.steps.map((step, index) => `${index + 1}. ${step}`).join("\n")}

Templates to consider: ${workflow.templateSlugs.join(", ")}
Tools to consider: ${workflow.toolSlugs.join(", ")}
Legal review flags: ${workflow.whenToCallCounsel.join("; ")}`;
}

export function getComparisonPage(slug: string) {
  return COMPARISON_PAGES.find((comparison) => comparison.slug === slug);
}
