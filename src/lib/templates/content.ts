import type { TemplateVariant } from "./variables";

export interface TemplateSection {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
  table?: { headers: string[]; rows: string[][] };
  variants?: TemplateVariant[];
}

export interface TemplateSpec {
  slug: string;
  title: string;
  category: string;
  version?: string;
  variants?: TemplateVariant[];
  sections: TemplateSection[];
}

const legalUseNotes: TemplateSection = {
  heading: "Notes for use",
  paragraphs: [
    "This template is provided for general guidance and must be reviewed by qualified legal counsel before use in your jurisdiction. Atlas HR makes no warranty as to legal sufficiency.",
    "Specific clauses, especially governing law, dispute resolution, restrictive covenants, statutory notice, employee data, tax, immigration, and termination provisions, require local legal review.",
    "Remove guidance notes before issuing the final document. Keep a signed copy in the employee or contractor file.",
  ],
};

const signatureSection: TemplateSection = {
  heading: "Signature blocks",
  table: {
    headers: ["Party", "Name", "Signature", "Date"],
    rows: [
      ["For {{COMPANY_NAME}}", "{{MANAGER_NAME}}", "", "{{TODAY}}"],
      ["Employee / recipient", "{{EMPLOYEE_NAME}}", "", "{{TODAY}}"],
    ],
  },
};

function withStandardEnding(sections: TemplateSection[], includeSignature = true) {
  return includeSignature ? [...sections, signatureSection, legalUseNotes] : [...sections, legalUseNotes];
}

const contractCore: TemplateSection[] = [
  {
    heading: "Parties and appointment",
    paragraphs: [
      "This agreement is between {{COMPANY_NAME}} of {{COMPANY_ADDRESS}} and {{EMPLOYEE_NAME}}. The employee is appointed as {{EMPLOYEE_TITLE}} with effect from {{EMPLOYEE_START_DATE}}.",
      "The employee will report to {{MANAGER_NAME}} or another manager nominated by the company. The company may reasonably vary duties, reporting lines, and work location to meet business needs, subject to applicable law and consultation requirements.",
    ],
  },
  {
    heading: "Duties and standards",
    bullets: [
      "Perform the duties of the role with skill, care, honesty, and good faith.",
      "Comply with the employee handbook, code of conduct, data privacy rules, information security rules, health and safety rules, and lawful management instructions.",
      "Declare conflicts of interest promptly and protect company property, confidential information, and customer trust.",
    ],
  },
  {
    heading: "Compensation and benefits",
    paragraphs: [
      "Base salary is {{CURRENCY}} {{SALARY}}, paid through normal payroll and subject to required deductions, taxes, and withholdings. Bonus, commission, equity, or incentive eligibility applies only where confirmed in a separate written plan.",
      "Benefits, leave, pension, insurance, and allowances are provided under company policy and applicable law. The company may amend non-contractual benefits after appropriate notice and review.",
    ],
  },
  {
    heading: "Hours, leave, and policies",
    paragraphs: [
      "Normal working hours, rest periods, overtime eligibility, public holidays, and leave entitlements are governed by the employee's contract, company policy, and applicable local law.",
      "The employee must record time accurately where required and must obtain approval before overtime, travel, remote work outside the approved location, or extended leave.",
    ],
  },
  {
    heading: "Confidentiality, IP, and data",
    bullets: [
      "Keep company, customer, employee, supplier, technical, financial, and strategic information confidential during and after employment.",
      "Assign to the company all work product, inventions, designs, documents, code, processes, and materials created in the course of employment to the fullest extent permitted by law.",
      "Process personal data only for authorized work purposes and follow the company's privacy and information security instructions.",
    ],
  },
  {
    heading: "Termination and notice",
    paragraphs: [
      "Either party may terminate employment by giving {{NOTICE_PERIOD}} notice or payment in lieu where lawful and applicable. The company may terminate without notice for gross misconduct or other circumstances recognized by applicable law.",
      "On termination, the employee must return company property, complete handover, preserve confidentiality, and cooperate with final payroll, benefits, and access-removal processes.",
    ],
  },
];

const variantNotes: Record<TemplateVariant, TemplateSection> = {
  global: {
    heading: "Country-specific review note",
    variants: ["global"],
    bullets: ["Select the employee's actual work jurisdiction before issuing. Local law may override this template."],
  },
  us: {
    heading: "United States variant note",
    variants: ["us"],
    bullets: [
      "Confirm at-will wording, state wage notices, pay transparency, restrictive covenant limits, final pay, expense reimbursement, and arbitration requirements before use.",
      "Do not use noncompete or salary-history language without state-specific review.",
    ],
  },
  uk: {
    heading: "United Kingdom variant note",
    variants: ["uk"],
    bullets: [
      "Confirm the document satisfies written particulars requirements, holiday wording, working time, pension auto-enrolment, probation, notice, and disciplinary procedure references.",
      "Restrictive covenants must protect legitimate business interests and be no broader than necessary.",
    ],
  },
  ng: {
    heading: "Nigeria variant note",
    variants: ["ng"],
    bullets: [
      "Confirm Labour Act coverage, senior staff treatment, pension, PAYE, NSITF, group life, allowances, probation, and notice periods.",
      "Separate statutory benefits from market or discretionary benefits such as 13th month or transport support.",
    ],
  },
  in: {
    heading: "India variant note",
    variants: ["in"],
    bullets: [
      "Confirm state Shops and Establishments rules, appointment letter requirements, working hours, holidays, EPF, ESI, gratuity, POSH, and notice periods.",
      "Use state annexures where the employee's work location affects leave, holidays, professional tax, or final settlement.",
    ],
  },
};

function countryAwareSections(base: TemplateSection[], variants: TemplateVariant[] = ["global"]) {
  return [...base, ...variants.map((variant) => variantNotes[variant])];
}

const policyIntro: TemplateSection = {
  heading: "Purpose and scope",
  paragraphs: [
    "This policy applies to all employees, workers, contractors, interns, and temporary staff of {{COMPANY_NAME}} unless a local addendum states otherwise.",
    "Managers are responsible for applying this policy consistently. HR is responsible for maintaining the policy, answering questions, and escalating legal or high-risk issues.",
  ],
};

export const TEMPLATE_SPECS: TemplateSpec[] = [
  {
    slug: "employment-contract-permanent",
    title: "Permanent Employment Contract",
    category: "Contracts",
    variants: ["us", "uk", "ng", "in"],
    sections: withStandardEnding(countryAwareSections(contractCore, ["us", "uk", "ng", "in"])),
  },
  {
    slug: "employment-contract-fixed-term",
    title: "Fixed-Term Employment Contract",
    category: "Contracts",
    variants: ["us", "uk", "ng", "in"],
    sections: withStandardEnding(
      countryAwareSections(
        [
          ...contractCore.slice(0, 5),
          {
            heading: "Fixed term, renewal, and conversion",
            paragraphs: [
              "Employment starts on {{EMPLOYEE_START_DATE}} and is expected to end on {{EMPLOYEE_END_DATE}} unless extended, renewed, converted, or ended earlier in accordance with this agreement and applicable law.",
              "Any renewal or conversion to permanent employment must be confirmed in writing. Continued work after the end date should be reviewed immediately by HR and legal counsel.",
            ],
          },
          contractCore[5],
        ],
        ["us", "uk", "ng", "in"]
      )
    ),
  },
  {
    slug: "independent-contractor-agreement",
    title: "Independent Contractor Agreement",
    category: "Contracts",
    variants: ["us", "uk", "ng", "in"],
    sections: withStandardEnding(
      countryAwareSections(
        [
          {
            heading: "Parties and independent status",
            paragraphs: [
              "This agreement is between {{COMPANY_NAME}} and {{EMPLOYEE_NAME}} for the services described below. The contractor is engaged as an independent contractor and not as an employee, worker, agent, partner, or joint venturer.",
              "The contractor is responsible for taxes, insurance, licenses, tools, assistants, and business expenses unless this agreement states otherwise.",
            ],
          },
          {
            heading: "Scope of work and deliverables",
            table: {
              headers: ["Deliverable", "Acceptance criteria", "Due date", "Fee"],
              rows: [["[Deliverable 1]", "[Objective criteria]", "[Date]", "{{CURRENCY}} {{SALARY}}"]],
            },
          },
          {
            heading: "Control, substitution, and method",
            bullets: [
              "The contractor controls how services are performed, subject to agreed deliverables, quality standards, security requirements, and deadlines.",
              "The contractor may provide a suitably qualified substitute only with prior written approval where required for security, confidentiality, or regulatory reasons.",
              "The company will not provide employee benefits, paid leave, pension, or statutory employee protections unless required by law.",
            ],
          },
          {
            heading: "Confidentiality, IP, and non-solicitation",
            paragraphs: [
              "The contractor must protect confidential information and assign or license work product to {{COMPANY_NAME}} as stated in this agreement.",
              "Any non-solicitation, noncompete, or restrictive covenant must be reviewed locally before use.",
            ],
          },
        ],
        ["us", "uk", "ng", "in"]
      )
    ),
  },
  {
    slug: "nda-confidentiality",
    title: "NDA and Confidentiality Agreement",
    category: "Contracts",
    sections: withStandardEnding([
      {
        heading: "Confidential information",
        paragraphs: [
          "Confidential information includes non-public business, technical, financial, employee, customer, supplier, product, pricing, strategy, source code, process, and operational information disclosed by either party.",
        ],
      },
      {
        heading: "Obligations",
        bullets: [
          "Use confidential information only for the approved purpose.",
          "Protect it with at least reasonable care.",
          "Share it only with people who need to know and are bound by confidentiality obligations.",
          "Return or destroy materials when requested, subject to legal retention obligations.",
        ],
      },
      {
        heading: "Exclusions and term",
        paragraphs: [
          "Confidential information does not include information that is public through no breach, already known lawfully, independently developed, or received lawfully from a third party.",
          "Confidentiality obligations continue for the period stated in the final agreement, and trade secrets remain protected for as long as permitted by law.",
        ],
      },
    ]),
  },
  {
    slug: "offer-letter",
    title: "Offer Letter",
    category: "Contracts",
    variants: ["us", "uk", "ng", "in"],
    sections: withStandardEnding(
      countryAwareSections([
        {
          heading: "Offer summary",
          table: {
            headers: ["Term", "Details"],
            rows: [
              ["Candidate", "{{EMPLOYEE_NAME}}"],
              ["Role", "{{EMPLOYEE_TITLE}}"],
              ["Start date", "{{EMPLOYEE_START_DATE}}"],
              ["Manager", "{{MANAGER_NAME}}"],
              ["Compensation", "{{CURRENCY}} {{SALARY}}"],
              ["Work country", "{{COUNTRY}}"],
            ],
          },
        },
        {
          heading: "Conditions and next steps",
          bullets: [
            "This offer is subject to satisfactory right-to-work or work authorization checks.",
            "The company may also require references, background checks, licensing checks, or medical fitness checks where lawful and relevant.",
            "Please sign and return this letter by the acceptance deadline stated in the covering email.",
          ],
        },
      ], ["us", "uk", "ng", "in"])
    ),
  },
  {
    slug: "employee-handbook-template",
    title: "Employee Handbook Template",
    category: "Policies",
    sections: withStandardEnding(
      [
        policyIntro,
        {
          heading: "25-section handbook outline",
          bullets: [
            "Welcome and company purpose",
            "Employment basics and equal opportunity",
            "Code of conduct",
            "Anti-harassment and complaints process",
            "Working hours, attendance, and timekeeping",
            "Pay, payroll, and deductions",
            "Leave and holidays",
            "Benefits and wellbeing",
            "Remote, hybrid, and flexible work",
            "IT, data privacy, and security",
            "Health and safety",
            "Performance, feedback, and development",
            "Discipline and grievance",
            "Conflicts, gifts, and outside work",
            "Travel and expenses",
            "Whistleblowing",
            "Social media and public communications",
            "Confidentiality and IP",
            "Employee records and privacy rights",
            "Resignation, termination, and offboarding",
            "Country addenda",
            "Policy version control",
            "Acknowledgment form",
            "Legal review log",
            "Contacts and escalation routes",
          ],
        },
        {
          heading: "Acknowledgment",
          paragraphs: [
            "I acknowledge that I have received or can access the {{COMPANY_NAME}} employee handbook. I understand that I am responsible for reading it, asking questions, and following the policies that apply to my role and work location.",
          ],
        },
      ],
      true
    ),
  },
  {
    slug: "remote-work-policy",
    title: "Remote Work Policy",
    category: "Policies",
    variants: ["global", "us", "uk", "ng", "in"],
    sections: withStandardEnding(countryAwareSections([
      policyIntro,
      {
        heading: "Eligibility and approval",
        bullets: [
          "Remote work may be fully remote, hybrid, occasional, or temporary.",
          "Eligibility depends on role, performance, security, customer needs, team coordination, work authorization, tax, and local labor law.",
          "Employees must not work from another country or state for an extended period without written approval from HR.",
        ],
      },
      {
        heading: "Equipment, expenses, and security",
        bullets: [
          "Company equipment must be used securely and returned when requested.",
          "Expense reimbursement, stipends, internet, coworking, and ergonomic equipment are handled under local policy.",
          "Employees must protect confidential information, use approved systems, and report security incidents immediately.",
        ],
      },
    ], ["global", "us", "uk", "ng", "in"])),
  },
  {
    slug: "anti-harassment-policy",
    title: "Anti-Harassment Policy",
    category: "Policies",
    sections: withStandardEnding([
      policyIntro,
      {
        heading: "Prohibited conduct",
        bullets: [
          "Harassment, discrimination, sexual harassment, bullying, victimization, and retaliation are prohibited.",
          "The policy applies at work, online, during travel, at events, with customers, with vendors, and in work-connected communications.",
          "Managers who receive a complaint must escalate it promptly and must not promise confidentiality beyond what the process can support.",
        ],
      },
      {
        heading: "Reporting and investigation",
        paragraphs: [
          "Employees may report concerns to their manager, HR, another senior leader, or any alternative channel listed by the company. Reports will be reviewed promptly, fairly, and with appropriate confidentiality.",
        ],
      },
    ]),
  },
  {
    slug: "code-of-conduct",
    title: "Code of Conduct",
    category: "Policies",
    sections: withStandardEnding([
      policyIntro,
      {
        heading: "Expected behaviors",
        bullets: [
          "Act with integrity, honesty, and accountability.",
          "Treat colleagues, customers, candidates, vendors, and community members with respect.",
          "Disclose conflicts of interest and gifts that could influence judgment.",
          "Protect confidential information and company assets.",
          "Speak up when something looks unsafe, unlawful, unethical, or inconsistent with company values.",
        ],
      },
      {
        heading: "Consequences and repair",
        paragraphs: [
          "Breaches may result in coaching, training, warning, reassignment, loss of access, termination, or legal action depending on severity and context.",
        ],
      },
    ]),
  },
  {
    slug: "data-privacy-policy-employee",
    title: "Employee Data Privacy Policy",
    category: "Policies",
    sections: withStandardEnding([
      policyIntro,
      {
        heading: "Data collected",
        bullets: [
          "Identity, contact, employment, payroll, tax, benefits, bank, performance, leave, disciplinary, grievance, health and safety, system access, and training data.",
          "Sensitive data is collected only where lawful and necessary for employment, benefits, safety, legal compliance, or workplace investigations.",
        ],
      },
      {
        heading: "Use, retention, and rights",
        paragraphs: [
          "Employee data is used for HR administration, payroll, benefits, legal compliance, security, workforce planning, performance, and workplace safety. Retention periods should be documented in the company retention schedule.",
        ],
      },
    ]),
  },
  {
    slug: "social-media-policy",
    title: "Social Media Policy",
    category: "Policies",
    sections: withStandardEnding([
      policyIntro,
      {
        heading: "Personal and work accounts",
        bullets: [
          "Employees may identify their role where accurate, but must not imply they speak for the company unless authorized.",
          "Confidential information, trade secrets, private employee data, customer data, and unreleased company information must not be posted.",
          "Online harassment of colleagues, candidates, customers, or vendors is treated as workplace conduct.",
        ],
      },
      {
        heading: "Protected activity and advocacy",
        paragraphs: [
          "This policy should not be applied to restrict legally protected employee communications about pay, working conditions, organizing, safety, or other protected matters.",
        ],
      },
    ]),
  },
  {
    slug: "travel-and-expense-policy",
    title: "Travel and Expense Policy",
    category: "Policies",
    sections: withStandardEnding([
      policyIntro,
      {
        heading: "Approval and limits",
        table: {
          headers: ["Category", "Default rule", "Approval"],
          rows: [
            ["Flights", "Economy unless policy exception applies", "Manager and finance"],
            ["Hotels", "Reasonable business hotel near work location", "Manager"],
            ["Meals", "Within local daily limit", "Manager"],
            ["Client entertainment", "Business purpose and attendee list required", "Manager and finance"],
          ],
        },
      },
      {
        heading: "Receipts, reimbursement, and audit",
        bullets: [
          "Submit expenses promptly with itemized receipts and business purpose.",
          "Alcohol, gifts, upgrades, personal travel, and foreign exchange treatment must follow local rules.",
          "Finance may audit expense claims and recover improper payments where lawful.",
        ],
      },
    ]),
  },
  {
    slug: "whistleblower-policy",
    title: "Whistleblower Policy",
    category: "Policies",
    sections: withStandardEnding([
      policyIntro,
      {
        heading: "Covered concerns",
        bullets: [
          "Fraud, bribery, accounting misconduct, safety risk, harassment, discrimination, retaliation, privacy breach, legal violation, conflicts of interest, and serious policy breaches.",
        ],
      },
      {
        heading: "Reporting, confidentiality, and no retaliation",
        paragraphs: [
          "Reports may be made to HR, legal, compliance, senior leadership, the board channel, or any external channel required by law. Retaliation against anyone raising a concern in good faith is prohibited.",
        ],
      },
    ]),
  },
  {
    slug: "annual-performance-review",
    title: "Annual Performance Review Form",
    category: "Performance",
    sections: withStandardEnding([
      {
        heading: "Review details",
        table: {
          headers: ["Field", "Response"],
          rows: [["Employee", "{{EMPLOYEE_NAME}}"], ["Role", "{{EMPLOYEE_TITLE}}"], ["Manager", "{{MANAGER_NAME}}"], ["Review period", "[Period]"]],
        },
      },
      {
        heading: "Performance assessment",
        bullets: ["Objectives achieved", "Core competencies", "Values and behaviors", "Strengths", "Development areas", "Overall rating", "Promotion or compensation recommendation if applicable"],
      },
      {
        heading: "Development plan",
        table: { headers: ["Goal", "Action", "Support", "Due date"], rows: [["[Goal]", "[Action]", "[Support]", "[Date]"]] },
      },
    ]),
  },
  {
    slug: "quarterly-check-in",
    title: "Quarterly Check-In Form",
    category: "Performance",
    sections: withStandardEnding([
      { heading: "Progress review", bullets: ["What went well?", "What changed?", "Which goals are at risk?", "What support is needed?", "What should stop, start, or continue?"] },
      { heading: "Next quarter priorities", table: { headers: ["Priority", "Measure", "Owner", "Check-in date"], rows: [["[Priority]", "[Measure]", "{{EMPLOYEE_NAME}}", "[Date]"]] } },
    ]),
  },
  {
    slug: "probation-review",
    title: "Probation Review Form",
    category: "Performance",
    sections: withStandardEnding([
      { heading: "Review recommendation", bullets: ["Confirm employment", "Extend probation", "End employment", "Escalate for HR/legal review"] },
      { heading: "Evidence summary", table: { headers: ["Area", "Evidence", "Rating"], rows: [["Role performance", "[Examples]", "[Rating]"], ["Conduct and values", "[Examples]", "[Rating]"], ["Attendance and reliability", "[Examples]", "[Rating]"]] } },
      { heading: "Support and next steps", paragraphs: ["Document coaching, training, resources, check-ins, and any extension period. Confirm all decisions in writing."] },
    ]),
  },
  {
    slug: "performance-improvement-plan-pip",
    title: "Performance Improvement Plan",
    category: "Performance",
    sections: withStandardEnding([
      { heading: "Purpose", paragraphs: ["This plan sets out specific performance concerns, expected standards, support available, review cadence, and success criteria. The goal is meaningful improvement."] },
      { heading: "Improvement goals", table: { headers: ["Concern", "Required standard", "Support", "Review date"], rows: [["[Specific gap]", "[Measurable expectation]", "[Support]", "[Date]"]] } },
      { heading: "Check-in cadence and outcomes", bullets: ["Weekly check-ins are recommended.", "Document progress factually.", "State what success looks like.", "State consequences if improvement is not made."] },
    ]),
  },
  {
    slug: "360-feedback-form",
    title: "360 Feedback Form",
    category: "Performance",
    sections: withStandardEnding([
      { heading: "Instructions", paragraphs: ["Use this form for development, not pay decisions, unless reviewed by HR. Feedback should be specific, behavior-based, and respectful."] },
      { heading: "Competencies", table: { headers: ["Competency", "Rating", "Evidence"], rows: [["Leadership", "[1-5]", "[Example]"], ["Collaboration", "[1-5]", "[Example]"], ["Communication", "[1-5]", "[Example]"], ["Execution", "[1-5]", "[Example]"]] } },
      { heading: "Open questions", bullets: ["What should this person continue?", "What should they change?", "What is one development priority?"] },
    ]),
  },
  {
    slug: "job-description",
    title: "Job Description Template",
    category: "Recruitment",
    sections: withStandardEnding([
      { heading: "Role overview", paragraphs: ["{{COMPANY_NAME}} is hiring a {{EMPLOYEE_TITLE}}. This role exists to [describe business problem and impact]."] },
      { heading: "Responsibilities", bullets: ["[Outcome-focused responsibility]", "[Collaboration responsibility]", "[Operational responsibility]", "[Improvement responsibility]"] },
      { heading: "Requirements", bullets: ["Must-have skills only", "Experience that is genuinely required", "Tools or credentials where essential", "Inclusive language reviewed before posting"] },
      { heading: "Compensation and benefits", paragraphs: ["Salary range: {{CURRENCY}} {{SALARY}}. Include benefits, work arrangement, location, and equal opportunity statement."] },
    ]),
  },
  {
    slug: "interview-scorecard",
    title: "Interview Scorecard",
    category: "Recruitment",
    sections: withStandardEnding([
      { heading: "Candidate and role", table: { headers: ["Field", "Response"], rows: [["Candidate", "{{EMPLOYEE_NAME}}"], ["Role", "{{EMPLOYEE_TITLE}}"], ["Interviewer", "[Name]"], ["Interview date", "{{TODAY}}"]] } },
      { heading: "Competency ratings", table: { headers: ["Competency", "Rating 1-5", "Evidence"], rows: [["Role knowledge", "", ""], ["Problem solving", "", ""], ["Communication", "", ""], ["Values", "", ""]] } },
      { heading: "Recommendation", bullets: ["Strong hire", "Hire", "No hire", "Hold / more evidence needed"] },
    ]),
  },
  {
    slug: "reference-check-form",
    title: "Reference Check Form",
    category: "Recruitment",
    sections: withStandardEnding([
      { heading: "Reference details", table: { headers: ["Field", "Response"], rows: [["Candidate", "{{EMPLOYEE_NAME}}"], ["Role", "{{EMPLOYEE_TITLE}}"], ["Reference name", ""], ["Relationship", ""], ["Dates worked together", ""]] } },
      { heading: "Questions", bullets: ["What was the candidate responsible for?", "What were their strongest contributions?", "Where did they need support?", "Would you rehire them? Why or why not?", "Is there anything role-relevant we should know?"] },
      { heading: "Legal-safe note", paragraphs: ["Do not ask about protected characteristics, medical history, family status, religion, age, union activity, or other legally protected areas."] },
    ]),
  },
  {
    slug: "offer-letter-acceptance-form",
    title: "Offer Letter Acceptance Form",
    category: "Onboarding",
    sections: withStandardEnding([
      { heading: "Acceptance confirmation", paragraphs: ["I, {{EMPLOYEE_NAME}}, accept the offer to join {{COMPANY_NAME}} as {{EMPLOYEE_TITLE}} with a start date of {{EMPLOYEE_START_DATE}}."] },
      { heading: "Candidate confirmations", bullets: ["I understand the offer conditions.", "I will provide onboarding documents by the requested date.", "I will notify HR if my work authorization, address, or availability changes."] },
    ]),
  },
  {
    slug: "new-hire-checklist",
    title: "New Hire Checklist",
    category: "Onboarding",
    sections: withStandardEnding([
      { heading: "Before day 1", bullets: ["Signed offer and contract", "Right-to-work checks", "Payroll setup", "Equipment ordered", "System access requested", "Manager welcome message", "Buddy assigned"] },
      { heading: "Day 1", bullets: ["Welcome meeting", "HR orientation", "IT setup", "Policy acknowledgments", "Team introductions", "Role expectations"] },
      { heading: "Week 1 and month 1", bullets: ["Manager check-in", "Role training", "Compliance training", "Feedback conversation", "30-day onboarding review"] },
    ]),
  },
  {
    slug: "employee-information-form",
    title: "Employee Information Form",
    category: "Onboarding",
    sections: withStandardEnding([
      { heading: "Personal details", table: { headers: ["Field", "Response"], rows: [["Full name", "{{EMPLOYEE_NAME}}"], ["Address", ""], ["Phone", ""], ["Email", ""], ["Emergency contact", ""]] } },
      { heading: "Payroll and benefits", table: { headers: ["Field", "Response"], rows: [["Bank details", ""], ["Tax ID", ""], ["Pension / retirement details", ""], ["Benefit selections", ""]] } },
      { heading: "Privacy acknowledgment", paragraphs: ["Employee data will be processed for employment administration, payroll, benefits, legal compliance, and workplace safety according to the employee privacy policy."] },
    ]),
  },
  {
    slug: "resignation-acceptance-letter",
    title: "Resignation Acceptance Letter",
    category: "Offboarding",
    sections: withStandardEnding([
      { heading: "Acknowledgment", paragraphs: ["We acknowledge receipt of your resignation from your role as {{EMPLOYEE_TITLE}}. Your last working day is recorded as {{EMPLOYEE_END_DATE}}."] },
      { heading: "Transition and final arrangements", bullets: ["Agree handover plan with {{MANAGER_NAME}}.", "Return company property by the last day.", "Submit final expenses.", "Final pay and benefits will be processed under policy and local law."] },
    ]),
  },
  {
    slug: "termination-letter",
    title: "Termination Letter",
    category: "Offboarding",
    variants: ["us", "uk", "ng", "in"],
    sections: withStandardEnding(countryAwareSections([
      { heading: "Decision and effective date", paragraphs: ["This letter confirms that your employment with {{COMPANY_NAME}} as {{EMPLOYEE_TITLE}} will end on {{EMPLOYEE_END_DATE}}."] },
      { heading: "Final pay and benefits", bullets: ["Final salary through the termination date", "Notice or pay in lieu where applicable", "Accrued leave treatment", "Approved expenses", "Benefits end date", "Return of company property"] },
      { heading: "Confidentiality and next steps", paragraphs: ["Your confidentiality, IP, restrictive covenant, data protection, and post-employment obligations continue as stated in your agreement and applicable law."] },
    ], ["us", "uk", "ng", "in"])),
  },
  {
    slug: "exit-interview-form",
    title: "Exit Interview Form",
    category: "Offboarding",
    sections: withStandardEnding([
      { heading: "Interview details", table: { headers: ["Field", "Response"], rows: [["Employee", "{{EMPLOYEE_NAME}}"], ["Role", "{{EMPLOYEE_TITLE}}"], ["Last day", "{{EMPLOYEE_END_DATE}}"], ["Interviewer", ""]] } },
      { heading: "Questions", bullets: ["Why are you leaving?", "What worked well?", "What made work harder?", "How was your manager experience?", "Would you recommend the company?", "What should leadership fix first?"] },
      { heading: "Themes and follow-up", paragraphs: ["Aggregate themes across exits before reporting. Escalate serious allegations immediately rather than waiting for trend analysis."] },
    ]),
  },
  {
    slug: "verbal-warning-record",
    title: "Verbal Warning Record",
    category: "Discipline",
    sections: withStandardEnding([
      { heading: "Issue and evidence", table: { headers: ["Field", "Response"], rows: [["Employee", "{{EMPLOYEE_NAME}}"], ["Manager", "{{MANAGER_NAME}}"], ["Issue type", "[Performance / conduct / attendance]"], ["Facts", "[Specific facts]"]] } },
      { heading: "Expectations", bullets: ["Specific improvement required", "Support offered", "Review date", "Consequences if issue continues"] },
      { heading: "Employee response", paragraphs: ["Record the employee's response factually. Do not include opinions, assumptions, or comments about protected characteristics."] },
    ]),
  },
  {
    slug: "written-warning",
    title: "Written Warning",
    category: "Discipline",
    sections: withStandardEnding([
      { heading: "Warning summary", paragraphs: ["This written warning concerns [specific issue]. It follows [prior discussion or investigation] and sets out the improvement required."] },
      { heading: "Required change", table: { headers: ["Concern", "Expected standard", "Timeline", "Support"], rows: [["[Specific issue]", "[Expected behavior]", "[Date]", "[Support]"]] } },
      { heading: "Consequences and appeal", paragraphs: ["Failure to improve may result in further disciplinary action up to and including termination, subject to applicable law and process. Include appeal rights where required."] },
    ]),
  },
  {
    slug: "final-settlement-statement",
    title: "Final Settlement Statement",
    category: "Payroll",
    sections: withStandardEnding([
      { heading: "Employee and exit details", table: { headers: ["Field", "Response"], rows: [["Employee", "{{EMPLOYEE_NAME}}"], ["Role", "{{EMPLOYEE_TITLE}}"], ["End date", "{{EMPLOYEE_END_DATE}}"], ["Currency", "{{CURRENCY}}"]] } },
      { heading: "Settlement calculation", table: { headers: ["Item", "Amount", "Notes"], rows: [["Final salary", "", ""], ["Accrued leave payout", "", ""], ["Approved expenses", "", ""], ["Severance / redundancy", "", ""], ["Deductions / loans", "", ""], ["Net payment", "", ""]] } },
      { heading: "Acknowledgment", paragraphs: ["The employee acknowledges receipt of this statement. Signing does not waive statutory rights unless a separate legally reviewed settlement agreement says so."] },
    ]),
  },
];

export function getTemplateSpec(slug: string) {
  return TEMPLATE_SPECS.find((spec) => spec.slug === slug);
}
