export type TemplateFormat = "docx" | "pdf" | "gdoc";
export type TemplateVariant = "global" | "us" | "uk" | "ng" | "in";

export interface TemplateVariable {
  name: string;
  label: string;
  type?: "text" | "date" | "textarea";
  placeholder?: string;
}

export interface Template {
  slug: string;
  name: string;
  category: string;
  description: string;
  formats: TemplateFormat[];
  isPremium?: boolean;
  relatedTool?: string;
  aliases?: string[];
  variants?: TemplateVariant[];
  defaultVariant?: TemplateVariant;
  previewImageUrl?: string;
  variables?: string[];
}

export const VARIANT_LABELS: Record<TemplateVariant, string> = {
  global: "Global",
  us: "United States",
  uk: "United Kingdom",
  ng: "Nigeria",
  in: "India",
};

const commonVariables = [
  "COMPANY_NAME",
  "COMPANY_ADDRESS",
  "HR_CONTACT",
  "COUNTRY",
  "EFFECTIVE_DATE",
  "TODAY",
];

export const TEMPLATE_VARIABLES: Record<string, TemplateVariable> = {
  COMPANY_NAME: { name: "COMPANY_NAME", label: "Company name", placeholder: "Atlas HR Ltd" },
  COMPANY_ADDRESS: { name: "COMPANY_ADDRESS", label: "Company address", placeholder: "123 Example Street, City" },
  EMPLOYEE_NAME: { name: "EMPLOYEE_NAME", label: "Employee name", placeholder: "Amina Okafor" },
  EMPLOYEE_TITLE: { name: "EMPLOYEE_TITLE", label: "Employee title", placeholder: "People Operations Manager" },
  EMPLOYEE_START_DATE: { name: "EMPLOYEE_START_DATE", label: "Start date", type: "date" },
  EMPLOYEE_END_DATE: { name: "EMPLOYEE_END_DATE", label: "End date", type: "date" },
  MANAGER_NAME: { name: "MANAGER_NAME", label: "Manager name", placeholder: "Jordan Lee" },
  HR_CONTACT: { name: "HR_CONTACT", label: "HR contact", placeholder: "people@example.com" },
  SALARY: { name: "SALARY", label: "Salary", placeholder: "75000" },
  CURRENCY: { name: "CURRENCY", label: "Currency", placeholder: "USD" },
  COUNTRY: { name: "COUNTRY", label: "Country", placeholder: "United States" },
  EFFECTIVE_DATE: { name: "EFFECTIVE_DATE", label: "Effective date", type: "date" },
  NOTICE_PERIOD: { name: "NOTICE_PERIOD", label: "Notice period", placeholder: "30 days" },
  TODAY: { name: "TODAY", label: "Today", type: "date" },
};

export const TEMPLATES: Template[] = [
  {
    slug: "employment-contract-permanent",
    name: "Employment Contract - Permanent",
    category: "Contracts",
    description: "Permanent employment agreement with country variants for core terms, notice, confidentiality, IP, probation, leave, benefits, and signatures.",
    formats: ["docx"],
    relatedTool: "offer-letter",
    aliases: ["employment-contract-us", "employment-contract-uk", "employment-contract-ng"],
    variants: ["us", "uk", "ng", "in"],
    defaultVariant: "us",
    previewImageUrl: "/templates/previews/employment-contract-permanent.png",
    variables: [...commonVariables, "EMPLOYEE_NAME", "EMPLOYEE_TITLE", "EMPLOYEE_START_DATE", "SALARY", "CURRENCY", "MANAGER_NAME", "NOTICE_PERIOD"],
  },
  {
    slug: "employment-contract-fixed-term",
    name: "Employment Contract - Fixed Term",
    category: "Contracts",
    description: "Fixed-term employment agreement with end date, renewal language, conversion notes, confidentiality, benefits, notice, and signatures.",
    formats: ["docx"],
    aliases: ["fixed-term-contract"],
    variants: ["us", "uk", "ng", "in"],
    defaultVariant: "uk",
    previewImageUrl: "/templates/previews/employment-contract-fixed-term.png",
    variables: [...commonVariables, "EMPLOYEE_NAME", "EMPLOYEE_TITLE", "EMPLOYEE_START_DATE", "EMPLOYEE_END_DATE", "SALARY", "CURRENCY", "NOTICE_PERIOD"],
  },
  {
    slug: "independent-contractor-agreement",
    name: "Independent Contractor Agreement",
    category: "Contracts",
    description: "Contractor agreement focused on scope, deliverables, payment, independence, IP, confidentiality, tax responsibility, and misclassification controls.",
    formats: ["docx"],
    variants: ["us", "uk", "ng", "in"],
    defaultVariant: "us",
    previewImageUrl: "/templates/previews/independent-contractor-agreement.png",
    variables: [...commonVariables, "EMPLOYEE_NAME", "EMPLOYEE_TITLE", "SALARY", "CURRENCY"],
  },
  {
    slug: "nda-confidentiality",
    name: "NDA and Confidentiality Agreement",
    category: "Contracts",
    description: "Mutual or one-way confidentiality agreement covering confidential information, exclusions, permitted use, return of materials, term, and remedies.",
    formats: ["docx"],
    aliases: ["nda-template"],
    previewImageUrl: "/templates/previews/nda-confidentiality.png",
    variables: [...commonVariables, "EMPLOYEE_NAME"],
  },
  {
    slug: "offer-letter",
    name: "Offer Letter",
    category: "Contracts",
    description: "Offer letter with role, compensation, start date, reporting line, contingencies, work authorization, benefits, and acceptance block.",
    formats: ["docx"],
    relatedTool: "offer-letter",
    variants: ["us", "uk", "ng", "in"],
    defaultVariant: "us",
    previewImageUrl: "/templates/previews/offer-letter.png",
    variables: [...commonVariables, "EMPLOYEE_NAME", "EMPLOYEE_TITLE", "EMPLOYEE_START_DATE", "SALARY", "CURRENCY", "MANAGER_NAME"],
  },
  {
    slug: "employee-handbook-template",
    name: "Employee Handbook Template",
    category: "Policies",
    description: "Full 25-section employee handbook structure with legal review notes, acknowledgments, workplace policies, conduct standards, leave, benefits, and complaints process.",
    formats: ["docx"],
    aliases: ["handbook-template"],
    previewImageUrl: "/templates/previews/employee-handbook-template.png",
    variables: commonVariables,
  },
  {
    slug: "remote-work-policy",
    name: "Remote Work Policy",
    category: "Policies",
    description: "Remote and hybrid work policy with eligibility, hours, equipment, expenses, security, tax and jurisdiction disclaimers, and ending remote arrangements.",
    formats: ["docx"],
    variants: ["global", "us", "uk", "ng", "in"],
    defaultVariant: "global",
    previewImageUrl: "/templates/previews/remote-work-policy.png",
    variables: commonVariables,
  },
  {
    slug: "anti-harassment-policy",
    name: "Anti-Harassment Policy",
    category: "Policies",
    description: "Anti-harassment, anti-discrimination, and no-retaliation policy with reporting channels, investigation commitment, manager duties, and training notes.",
    formats: ["docx"],
    previewImageUrl: "/templates/previews/anti-harassment-policy.png",
    variables: commonVariables,
  },
  {
    slug: "code-of-conduct",
    name: "Code of Conduct",
    category: "Policies",
    description: "Practical code of conduct translating values into behavior, conflicts, gifts, confidentiality, vendor conduct, escalation, and consequences.",
    formats: ["docx"],
    previewImageUrl: "/templates/previews/code-of-conduct.png",
    variables: commonVariables,
  },
  {
    slug: "data-privacy-policy-employee",
    name: "Employee Data Privacy Policy",
    category: "Policies",
    description: "Employee privacy policy covering HR data collection, purposes, retention, rights, vendors, cross-border transfers, breach response, and DPO contact.",
    formats: ["docx"],
    aliases: ["data-privacy-policy"],
    previewImageUrl: "/templates/previews/data-privacy-policy-employee.png",
    variables: commonVariables,
  },
  {
    slug: "social-media-policy",
    name: "Social Media Policy",
    category: "Policies",
    description: "Social media policy balancing personal speech, confidentiality, harassment, trade secrets, advocacy, crisis posts, and protected employee activity.",
    formats: ["docx"],
    previewImageUrl: "/templates/previews/social-media-policy.png",
    variables: commonVariables,
  },
  {
    slug: "travel-and-expense-policy",
    name: "Travel and Expense Policy",
    category: "Policies",
    description: "Travel and expense rules covering approvals, limits, receipts, cards, reimbursement, foreign exchange, alcohol, gifts, and audit controls.",
    formats: ["docx"],
    aliases: ["expense-policy"],
    previewImageUrl: "/templates/previews/travel-and-expense-policy.png",
    variables: commonVariables,
  },
  {
    slug: "whistleblower-policy",
    name: "Whistleblower Policy",
    category: "Policies",
    description: "Whistleblower policy with covered concerns, reporting routes, confidentiality, anonymity, no retaliation, investigation steps, and board escalation.",
    formats: ["docx"],
    previewImageUrl: "/templates/previews/whistleblower-policy.png",
    variables: commonVariables,
  },
  {
    slug: "annual-performance-review",
    name: "Annual Performance Review",
    category: "Performance",
    description: "Annual review form with self-assessment, manager assessment, ratings, objective review, development plan, calibration notes, and signatures.",
    formats: ["docx"],
    aliases: ["performance-review-form"],
    relatedTool: "performance-review",
    previewImageUrl: "/templates/previews/annual-performance-review.png",
    variables: [...commonVariables, "EMPLOYEE_NAME", "EMPLOYEE_TITLE", "MANAGER_NAME"],
  },
  {
    slug: "quarterly-check-in",
    name: "Quarterly Check-In",
    category: "Performance",
    description: "Lightweight quarterly check-in for goals, blockers, feedback, wellbeing, manager support, next-quarter priorities, and follow-up actions.",
    formats: ["docx"],
    previewImageUrl: "/templates/previews/quarterly-check-in.png",
    variables: [...commonVariables, "EMPLOYEE_NAME", "EMPLOYEE_TITLE", "MANAGER_NAME"],
  },
  {
    slug: "probation-review",
    name: "Probation Review",
    category: "Performance",
    description: "30/60/90 probation review form with pass, extend, or fail recommendation, evidence, support provided, and signature blocks.",
    formats: ["docx"],
    aliases: ["probation-review-form"],
    previewImageUrl: "/templates/previews/probation-review.png",
    variables: [...commonVariables, "EMPLOYEE_NAME", "EMPLOYEE_TITLE", "MANAGER_NAME"],
  },
  {
    slug: "performance-improvement-plan-pip",
    name: "Performance Improvement Plan",
    category: "Performance",
    description: "Structured PIP with specific gaps, goals, support, check-in cadence, success criteria, consequences, and review signatures.",
    formats: ["docx"],
    aliases: ["pip-template", "performance-improvement-plan"],
    relatedTool: "pip-builder",
    previewImageUrl: "/templates/previews/performance-improvement-plan-pip.png",
    variables: [...commonVariables, "EMPLOYEE_NAME", "EMPLOYEE_TITLE", "MANAGER_NAME"],
  },
  {
    slug: "360-feedback-form",
    name: "360 Feedback Form",
    category: "Performance",
    description: "Multi-rater 360 feedback form with competency ratings, open comments, anonymity guidance, and development summary.",
    formats: ["docx"],
    aliases: ["360-feedback-template"],
    previewImageUrl: "/templates/previews/360-feedback-form.png",
    variables: [...commonVariables, "EMPLOYEE_NAME", "EMPLOYEE_TITLE"],
  },
  {
    slug: "job-description",
    name: "Job Description Template",
    category: "Recruitment",
    description: "Structured job description template covering role purpose, responsibilities, requirements, benefits, salary range, inclusion language, and approval.",
    formats: ["docx"],
    aliases: ["job-description-template"],
    relatedTool: "job-description-generator",
    previewImageUrl: "/templates/previews/job-description.png",
    variables: [...commonVariables, "EMPLOYEE_TITLE", "SALARY", "CURRENCY"],
  },
  {
    slug: "interview-scorecard",
    name: "Interview Scorecard",
    category: "Recruitment",
    description: "Competency-based interview scorecard with rating scale, evidence column, recommendation, and interviewer calibration prompts.",
    formats: ["docx"],
    previewImageUrl: "/templates/previews/interview-scorecard.png",
    variables: [...commonVariables, "EMPLOYEE_TITLE"],
  },
  {
    slug: "reference-check-form",
    name: "Reference Check Form",
    category: "Recruitment",
    description: "Reference check form with legal-safe prompts, documentation fields, rehire question, performance evidence, and escalation notes.",
    formats: ["docx"],
    previewImageUrl: "/templates/previews/reference-check-form.png",
    variables: [...commonVariables, "EMPLOYEE_NAME", "EMPLOYEE_TITLE"],
  },
  {
    slug: "offer-letter-acceptance-form",
    name: "Offer Letter Acceptance Form",
    category: "Onboarding",
    description: "Candidate countersign form confirming offer acceptance, start date, contingencies, personal details, and next onboarding steps.",
    formats: ["docx"],
    previewImageUrl: "/templates/previews/offer-letter-acceptance-form.png",
    variables: [...commonVariables, "EMPLOYEE_NAME", "EMPLOYEE_TITLE", "EMPLOYEE_START_DATE"],
  },
  {
    slug: "new-hire-checklist",
    name: "New Hire Checklist",
    category: "Onboarding",
    description: "Pre-day-1, day-1, week-1, and month-1 onboarding checklist for HR, manager, IT, buddy, and employee actions.",
    formats: ["docx"],
    aliases: ["onboarding-checklist"],
    relatedTool: "onboarding-checklist",
    previewImageUrl: "/templates/previews/new-hire-checklist.png",
    variables: [...commonVariables, "EMPLOYEE_NAME", "EMPLOYEE_TITLE", "EMPLOYEE_START_DATE", "MANAGER_NAME"],
  },
  {
    slug: "employee-information-form",
    name: "Employee Information Form",
    category: "Onboarding",
    description: "Employee personal information form covering contact details, emergency contact, tax, banking, benefits, and privacy acknowledgment.",
    formats: ["docx"],
    previewImageUrl: "/templates/previews/employee-information-form.png",
    variables: [...commonVariables, "EMPLOYEE_NAME", "EMPLOYEE_TITLE"],
  },
  {
    slug: "resignation-acceptance-letter",
    name: "Resignation Acceptance Letter",
    category: "Offboarding",
    description: "Resignation acknowledgment covering last day, transition expectations, final pay, benefits, property return, and reference process.",
    formats: ["docx"],
    previewImageUrl: "/templates/previews/resignation-acceptance-letter.png",
    variables: [...commonVariables, "EMPLOYEE_NAME", "EMPLOYEE_TITLE", "EMPLOYEE_END_DATE", "MANAGER_NAME"],
  },
  {
    slug: "termination-letter",
    name: "Termination Letter",
    category: "Offboarding",
    description: "Country-aware termination letter framework with effective date, final pay, benefits, property return, confidentiality, and legal review notes.",
    formats: ["docx"],
    relatedTool: "termination-letter",
    variants: ["us", "uk", "ng", "in"],
    defaultVariant: "us",
    previewImageUrl: "/templates/previews/termination-letter.png",
    variables: [...commonVariables, "EMPLOYEE_NAME", "EMPLOYEE_TITLE", "EMPLOYEE_END_DATE", "NOTICE_PERIOD"],
  },
  {
    slug: "exit-interview-form",
    name: "Exit Interview Form",
    category: "Offboarding",
    description: "Structured exit interview script and form covering role, manager, culture, pay, workload, inclusion, and leadership themes.",
    formats: ["docx"],
    previewImageUrl: "/templates/previews/exit-interview-form.png",
    variables: [...commonVariables, "EMPLOYEE_NAME", "EMPLOYEE_TITLE", "EMPLOYEE_END_DATE"],
  },
  {
    slug: "verbal-warning-record",
    name: "Verbal Warning Record",
    category: "Discipline",
    description: "Formal record for a verbal warning conversation with issue, evidence, employee response, expectations, timeline, and signatures.",
    formats: ["docx"],
    aliases: ["verbal-warning-template"],
    previewImageUrl: "/templates/previews/verbal-warning-record.png",
    variables: [...commonVariables, "EMPLOYEE_NAME", "EMPLOYEE_TITLE", "MANAGER_NAME"],
  },
  {
    slug: "written-warning",
    name: "Written Warning",
    category: "Discipline",
    description: "Written warning template for conduct, performance, or attendance issues with facts, expectations, support, timeline, and consequences.",
    formats: ["docx"],
    aliases: ["warning-letter-template"],
    relatedTool: "warning-letter",
    previewImageUrl: "/templates/previews/written-warning.png",
    variables: [...commonVariables, "EMPLOYEE_NAME", "EMPLOYEE_TITLE", "MANAGER_NAME"],
  },
  {
    slug: "final-settlement-statement",
    name: "Final Settlement Statement",
    category: "Payroll",
    description: "Final settlement statement covering final salary, accrued leave, deductions, loans, expenses, severance, benefits, and signed acknowledgment.",
    formats: ["docx"],
    previewImageUrl: "/templates/previews/final-settlement-statement.png",
    variables: [...commonVariables, "EMPLOYEE_NAME", "EMPLOYEE_TITLE", "EMPLOYEE_END_DATE", "SALARY", "CURRENCY"],
  },
];

export function getTemplate(slug: string) {
  return TEMPLATES.find((template) => template.slug === slug || template.aliases?.includes(slug));
}

export function getCanonicalTemplateSlug(slug: string) {
  return getTemplate(slug)?.slug ?? slug;
}

export const TEMPLATE_CATEGORIES = [...new Set(TEMPLATES.map((template) => template.category))];
