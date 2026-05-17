import { CALCULATORS } from "./calculators";

export interface ToolInputField {
  name: string;
  label: string;
  type: "text" | "textarea" | "select" | "tags";
  options?: { value: string; label: string }[];
  required?: boolean;
  placeholder?: string;
}

export interface ToolConfig {
  slug: string;
  name: string;
  category: string;
  description: string;
  icon: string;
  toolType?: "ai" | "calculator";
  inputs: ToolInputField[];
  promptTemplate?: (inputs: Record<string, string>) => string;
}

export type SerializableToolConfig = Omit<ToolConfig, "promptTemplate">;

const AI_TOOLS_CONFIG: ToolConfig[] = [
  {
    slug: "job-description-generator",
    name: "Job Description Generator",
    category: "Recruitment",
    description: "Generate a polished, inclusive job description in seconds. Country-aware and role-specific.",
    icon: "FileText",
    inputs: [
      { name: "jobTitle", label: "Job title", type: "text", required: true, placeholder: "e.g. Senior Product Designer" },
      { name: "department", label: "Department", type: "select", options: [
        { value: "engineering", label: "Engineering" }, { value: "product", label: "Product" },
        { value: "design", label: "Design" }, { value: "sales", label: "Sales" },
        { value: "marketing", label: "Marketing" }, { value: "hr", label: "HR & People" },
        { value: "finance", label: "Finance" }, { value: "operations", label: "Operations" },
        { value: "customer-success", label: "Customer Success" },
      ], required: true },
      { name: "level", label: "Seniority level", type: "select", options: [
        { value: "entry", label: "Entry-level" }, { value: "mid", label: "Mid-level" },
        { value: "senior", label: "Senior" }, { value: "lead", label: "Lead / Principal" },
        { value: "director", label: "Director" }, { value: "vp", label: "VP / Head" },
      ], required: true },
      { name: "companySize", label: "Company size", type: "select", options: [
        { value: "startup", label: "Startup (1–50)" }, { value: "small", label: "Small (51–200)" },
        { value: "medium", label: "Medium (201–1000)" }, { value: "large", label: "Large (1000+)" },
      ] },
      { name: "country", label: "Country", type: "select", options: [
        { value: "us", label: "United States" }, { value: "uk", label: "United Kingdom" },
        { value: "ca", label: "Canada" }, { value: "ng", label: "Nigeria" },
        { value: "ke", label: "Kenya" }, { value: "za", label: "South Africa" },
        { value: "in", label: "India" }, { value: "ph", label: "Philippines" },
        { value: "ae", label: "UAE" }, { value: "br", label: "Brazil" },
        { value: "de", label: "Germany" }, { value: "au", label: "Australia" },
      ] },
      { name: "responsibilities", label: "Key responsibilities (optional)", type: "textarea", placeholder: "List the main things this person will do..." },
      { name: "skills", label: "Required skills", type: "tags", placeholder: "Add a skill and press Enter" },
      { name: "tone", label: "Tone", type: "select", options: [
        { value: "formal", label: "Formal" }, { value: "friendly", label: "Friendly" }, { value: "inclusive", label: "Inclusive & modern" },
      ] },
    ],
    promptTemplate: (inputs) => `You are an experienced HR professional and talent acquisition specialist. Write a complete, polished job description for the following role.

Role: ${inputs.jobTitle}
Department: ${inputs.department}
Level: ${inputs.level}
Company size: ${inputs.companySize || "not specified"}
Country: ${inputs.country || "not specified"}
Tone: ${inputs.tone || "professional and inclusive"}
${inputs.responsibilities ? `Key responsibilities provided by the user:\n${inputs.responsibilities}` : ""}
${inputs.skills ? `Skills to include: ${inputs.skills}` : ""}

Structure the JD with these sections:
1. About the role (2-3 sentences)
2. What you'll do (6-8 bullet points with active verbs)
3. What we're looking for (must-haves, 4-6 points)
4. Nice to have (2-4 points)
5. What we offer (benefits, growth, culture)
6. Inclusive closing statement

Guidelines:
- Use ${inputs.tone || "professional"} language throughout
- Avoid gendered language and jargon
- ${inputs.country ? `Be aware of ${inputs.country} employment norms and avoid any requirements that would be illegal there` : ""}
- Keep requirements realistic — list only genuine must-haves
- Format as clean markdown

End with a brief disclaimer: "Note: Please review this job description with your legal/HR team before posting, particularly for jurisdiction-specific compliance."`,
  },

  {
    slug: "job-post-scorecard",
    name: "Job Post Scorecard",
    category: "Recruitment",
    description: "Audit a job post for clarity, realism, inclusivity, candidate appeal, compliance risk, and conversion quality.",
    icon: "ClipboardCheck",
    inputs: [
      { name: "jobTitle", label: "Job title", type: "text", required: true, placeholder: "e.g. People Operations Manager" },
      { name: "country", label: "Country", type: "select", options: [
        { value: "us", label: "United States" }, { value: "uk", label: "United Kingdom" },
        { value: "ng", label: "Nigeria" }, { value: "in", label: "India" },
        { value: "ca", label: "Canada" }, { value: "au", label: "Australia" },
      ] },
      { name: "seniority", label: "Seniority", type: "select", options: [
        { value: "entry", label: "Entry-level" }, { value: "mid", label: "Mid-level" },
        { value: "senior", label: "Senior" }, { value: "lead", label: "Lead / Principal" },
        { value: "manager", label: "Manager" }, { value: "executive", label: "Executive" },
      ] },
      { name: "jobPost", label: "Job post text", type: "textarea", required: true, placeholder: "Paste the full job post here..." },
      { name: "mustHaves", label: "True must-haves", type: "tags", placeholder: "Add must-have requirements and press Enter" },
      { name: "hiringGoal", label: "Hiring goal", type: "textarea", placeholder: "What should this hire achieve in the first 6-12 months?" },
    ],
    promptTemplate: (inputs) => `You are a senior talent acquisition and HR compliance reviewer. Score this job post and recommend practical improvements.

Role: ${inputs.jobTitle}
Country: ${inputs.country || "not specified"}
Seniority: ${inputs.seniority || "not specified"}
True must-haves: ${inputs.mustHaves || "not specified"}
Hiring goal: ${inputs.hiringGoal || "not specified"}

Job post:
${inputs.jobPost}

Return:
1. Overall score out of 100.
2. Scores out of 10 for clarity, realism, inclusivity, candidate appeal, compensation transparency, compliance risk, structure, and conversion quality.
3. The top 5 issues hurting applicant quality.
4. Requirements that should be removed, softened, or moved to nice-to-have.
5. Missing information candidates will expect.
6. Country-specific caution flags for ${inputs.country || "the relevant jurisdiction"}.
7. A rewritten high-converting version of the job post.

Guidelines:
- Flag vague, inflated, discriminatory, or unrealistic requirements.
- Do not invent salary ranges unless the user provided one.
- Keep legal comments practical and include a short review disclaimer.
- Format as clean markdown with a score table and action checklist.`,
  },

  {
    slug: "employer-brand-checklist",
    name: "Employer Brand Checklist",
    category: "Recruitment",
    description: "Create a practical employer-brand action plan across careers pages, job posts, reviews, social proof, and candidate communications.",
    icon: "Sparkles",
    inputs: [
      { name: "companyName", label: "Company name", type: "text", required: true, placeholder: "e.g. Atlas HR" },
      { name: "companySize", label: "Company size", type: "select", options: [
        { value: "startup", label: "Startup (1-50)" }, { value: "small", label: "Small (51-200)" },
        { value: "medium", label: "Medium (201-1000)" }, { value: "large", label: "Large (1000+)" },
      ] },
      { name: "hiringMarkets", label: "Hiring markets", type: "tags", placeholder: "e.g. Nigeria, UK, Remote, India" },
      { name: "targetRoles", label: "Target roles", type: "tags", placeholder: "e.g. engineers, sales, customer success" },
      { name: "currentChannels", label: "Current candidate channels", type: "textarea", placeholder: "Careers page, LinkedIn, referrals, agencies, communities..." },
      { name: "knownIssues", label: "Known issues", type: "textarea", placeholder: "Low response rates, weak Glassdoor reviews, unclear culture, slow feedback..." },
    ],
    promptTemplate: (inputs) => `You are an employer-brand and talent acquisition strategist. Build a practical employer-brand checklist and 30-day improvement plan.

Company: ${inputs.companyName}
Company size: ${inputs.companySize || "not specified"}
Hiring markets: ${inputs.hiringMarkets || "not specified"}
Target roles: ${inputs.targetRoles || "not specified"}
Current channels: ${inputs.currentChannels || "not specified"}
Known issues: ${inputs.knownIssues || "not specified"}

Return:
1. Employer-brand scorecard with scores out of 10 for clarity, proof, role relevance, candidate trust, diversity/inclusion signal, review readiness, and channel consistency.
2. A checklist grouped by careers page, job posts, employee proof, candidate communications, interview process, social/review sites, and recruiter enablement.
3. The top 10 highest-impact fixes ranked by effort and impact.
4. Copy examples for a sharper employee value proposition and careers-page intro.
5. Metrics to track weekly.
6. A 30-day action plan with owners for HR, hiring managers, leadership, and marketing.

Keep it practical for a lean HR team. Do not suggest expensive brand campaigns unless the basics are already covered.`,
  },

  {
    slug: "candidate-experience-audit",
    name: "Candidate Experience Audit",
    category: "Recruitment",
    description: "Audit the hiring journey from application to offer or rejection and turn it into a measurable improvement plan.",
    icon: "Route",
    inputs: [
      { name: "roleType", label: "Role type", type: "text", required: true, placeholder: "e.g. software engineering, retail associate, sales leader" },
      { name: "country", label: "Country", type: "select", options: [
        { value: "us", label: "United States" }, { value: "uk", label: "United Kingdom" },
        { value: "ng", label: "Nigeria" }, { value: "in", label: "India" },
        { value: "remote", label: "Remote / multi-country" },
      ] },
      { name: "processStages", label: "Current stages", type: "textarea", required: true, placeholder: "Application, recruiter screen, assessment, panel, final interview, offer..." },
      { name: "timeToHire", label: "Current time to hire", type: "text", placeholder: "e.g. 32 days" },
      { name: "candidateFeedback", label: "Candidate feedback or complaints", type: "textarea", placeholder: "Slow feedback, unclear assessments, too many interviews..." },
      { name: "dropOffPoints", label: "Known drop-off points", type: "textarea", placeholder: "Where do candidates withdraw or stop responding?" },
    ],
    promptTemplate: (inputs) => `You are a recruiting operations and candidate experience expert. Audit this hiring journey and recommend specific improvements.

Role type: ${inputs.roleType}
Country/market: ${inputs.country || "not specified"}
Current process stages:
${inputs.processStages}
Current time to hire: ${inputs.timeToHire || "not specified"}
Candidate feedback or complaints: ${inputs.candidateFeedback || "not specified"}
Known drop-off points: ${inputs.dropOffPoints || "not specified"}

Return:
1. Candidate experience score out of 100.
2. Scores out of 10 for application ease, speed, communication, interview structure, assessment fairness, feedback quality, accessibility, and offer/rejection closure.
3. The main friction points by stage.
4. A revised hiring journey with recommended stage count, owner, candidate message, and SLA for each stage.
5. Email/message templates for application received, interview invite, delay update, rejection, and offer next steps.
6. Metrics to track: response rate, drop-off, stage conversion, time in stage, candidate NPS, and offer acceptance.
7. Compliance and fairness cautions for ${inputs.country || "the hiring market"}.

Keep the recommendations realistic for a small or mid-market HR team.`,
  },

  {
    slug: "interview-questions",
    name: "Interview Question Generator",
    category: "Recruitment",
    description: "Generate role-specific, competency-based interview questions for any position.",
    icon: "MessageSquare",
    inputs: [
      { name: "jobTitle", label: "Job title", type: "text", required: true, placeholder: "e.g. Marketing Manager" },
      { name: "level", label: "Seniority", type: "select", options: [
        { value: "entry", label: "Entry-level" }, { value: "mid", label: "Mid-level" },
        { value: "senior", label: "Senior" }, { value: "leadership", label: "Leadership" },
      ], required: true },
      { name: "focusAreas", label: "Competencies to assess", type: "tags", placeholder: "e.g. leadership, data analysis..." },
      { name: "questionCount", label: "Number of questions", type: "select", options: [
        { value: "5", label: "5 questions" }, { value: "10", label: "10 questions" }, { value: "15", label: "15 questions" },
      ] },
    ],
    promptTemplate: (inputs) => `You are a talent acquisition expert. Generate ${inputs.questionCount || "10"} high-quality interview questions for a ${inputs.level} ${inputs.jobTitle} role.

${inputs.focusAreas ? `Focus on these competencies: ${inputs.focusAreas}` : ""}

Include a mix of:
- Behavioural questions (STAR format, "Tell me about a time...")
- Situational questions ("How would you handle...")
- Technical/role-specific questions
- Cultural / values questions

For each question, include:
1. The question itself
2. What good answers typically include (2-3 bullet points)
3. Red flags to watch for

Format as clean markdown with numbered questions.`,
  },

  {
    slug: "offer-letter",
    name: "Offer Letter Generator",
    category: "Recruitment",
    description: "Generate a professional, country-aware offer letter with the right legal clauses.",
    icon: "Mail",
    inputs: [
      { name: "candidateName", label: "Candidate name", type: "text", required: true },
      { name: "jobTitle", label: "Job title", type: "text", required: true },
      { name: "department", label: "Department", type: "text" },
      { name: "startDate", label: "Start date", type: "text", placeholder: "e.g. 1 February 2025" },
      { name: "salary", label: "Salary / compensation", type: "text", required: true, placeholder: "e.g. $75,000/year" },
      { name: "country", label: "Country", type: "select", options: [
        { value: "us", label: "United States" }, { value: "uk", label: "United Kingdom" },
        { value: "ng", label: "Nigeria" }, { value: "ke", label: "Kenya" },
        { value: "in", label: "India" }, { value: "au", label: "Australia" },
      ] },
      { name: "reportingTo", label: "Reports to", type: "text" },
      { name: "workArrangement", label: "Work arrangement", type: "select", options: [
        { value: "office", label: "Office (full-time)" }, { value: "remote", label: "Remote" }, { value: "hybrid", label: "Hybrid" },
      ] },
      { name: "additionalBenefits", label: "Key benefits to include", type: "textarea", placeholder: "e.g. health insurance, 25 days annual leave, equity..." },
    ],
    promptTemplate: (inputs) => `You are an experienced HR professional. Write a formal offer letter for the following:

Candidate: ${inputs.candidateName}
Role: ${inputs.jobTitle}
Department: ${inputs.department || "not specified"}
Start date: ${inputs.startDate || "to be confirmed"}
Compensation: ${inputs.salary}
Reports to: ${inputs.reportingTo || "not specified"}
Work arrangement: ${inputs.workArrangement || "office"}
Country: ${inputs.country || "not specified"}
${inputs.additionalBenefits ? `Benefits: ${inputs.additionalBenefits}` : ""}

Write a professional offer letter that:
- Uses a warm but professional tone
- Includes all standard sections: greeting, role, compensation, start date, reporting line, work arrangement, benefits, next steps
- ${inputs.country ? `Includes any standard clauses appropriate for ${inputs.country} (e.g., employment at will for US, probation period, etc.)` : ""}
- Ends with clear next steps for acceptance

Format as a proper business letter with appropriate spacing.

Note: This is a template — review with employment counsel before sending.`,
  },

  {
    slug: "warning-letter",
    name: "Warning Letter Generator",
    category: "Employee Relations",
    description: "Generate verbal, written, or final warning letters that follow best practice and protect the company.",
    icon: "AlertTriangle",
    inputs: [
      { name: "employeeName", label: "Employee name", type: "text", required: true },
      { name: "warningType", label: "Warning type", type: "select", options: [
        { value: "verbal", label: "Verbal warning (formal record)" },
        { value: "written", label: "First written warning" },
        { value: "final", label: "Final written warning" },
      ], required: true },
      { name: "issueType", label: "Nature of the issue", type: "select", options: [
        { value: "performance", label: "Performance" }, { value: "conduct", label: "Conduct / behaviour" },
        { value: "attendance", label: "Attendance / timekeeping" }, { value: "other", label: "Other" },
      ], required: true },
      { name: "issueDescription", label: "Description of the issue", type: "textarea", required: true, placeholder: "Describe what happened, when, and the impact..." },
      { name: "previousWarnings", label: "Previous warnings given", type: "textarea", placeholder: "Leave blank if this is the first warning..." },
      { name: "improvementRequired", label: "Improvement required", type: "textarea", placeholder: "What specific changes are expected, and by when?" },
    ],
    promptTemplate: (inputs) => `You are an experienced HR professional. Write a ${inputs.warningType} warning letter for the following situation:

Employee: ${inputs.employeeName}
Issue type: ${inputs.issueType}
Issue description: ${inputs.issueDescription}
${inputs.previousWarnings ? `Previous warnings: ${inputs.previousWarnings}` : "This is the first formal warning."}
${inputs.improvementRequired ? `Improvement required: ${inputs.improvementRequired}` : ""}

The letter should:
- Be professional and factual, not punitive in tone
- Clearly state the nature of the concern
- Reference any previous discussions or warnings
- Set clear expectations and timelines for improvement
- Explain the consequences if improvement is not made
- Include space for signatures (employee, manager, HR)
- Protect the company legally by being specific and documented

Format as a formal letter. Note: Review with HR/legal before issuing.`,
  },

  {
    slug: "termination-letter",
    name: "Termination Letter Generator",
    category: "Offboarding",
    description: "Generate a professional termination letter. Country-aware with the right legal framing.",
    icon: "LogOut",
    inputs: [
      { name: "employeeName", label: "Employee name", type: "text", required: true },
      { name: "terminationReason", label: "Reason for termination", type: "select", options: [
        { value: "performance", label: "Performance (after PIP)" },
        { value: "conduct", label: "Gross misconduct" },
        { value: "redundancy", label: "Redundancy / restructuring" },
        { value: "end-of-contract", label: "End of fixed-term contract" },
      ], required: true },
      { name: "lastWorkingDay", label: "Last working day", type: "text", placeholder: "e.g. 14 February 2025" },
      { name: "country", label: "Country", type: "select", options: [
        { value: "us", label: "United States" }, { value: "uk", label: "United Kingdom" },
        { value: "ng", label: "Nigeria" }, { value: "in", label: "India" }, { value: "au", label: "Australia" },
      ] },
      { name: "noticePeriod", label: "Notice period / payment in lieu", type: "text", placeholder: "e.g. 4 weeks notice" },
      { name: "additionalContext", label: "Additional context", type: "textarea", placeholder: "Any key facts to include (e.g. severance, return of equipment)..." },
    ],
    promptTemplate: (inputs) => `You are an experienced HR professional. Write a termination letter for the following:

Employee: ${inputs.employeeName}
Reason: ${inputs.terminationReason}
Last working day: ${inputs.lastWorkingDay || "to be confirmed"}
Country: ${inputs.country || "not specified"}
Notice: ${inputs.noticePeriod || "standard notice"}
${inputs.additionalContext ? `Additional context: ${inputs.additionalContext}` : ""}

The letter should:
- Be professional, factual, and compassionate in tone
- Clearly state the decision and the effective date
- Reference the reason briefly and factually
- Include practical next steps (return of equipment, final pay, references policy)
- ${inputs.country ? `Use appropriate language and clauses for ${inputs.country} employment law` : ""}
- Avoid anything that could be used against the company

Format as a formal letter.

Important disclaimer: Termination is high-stakes. Always have this reviewed by an employment lawyer before sending, particularly for ${inputs.country || "your jurisdiction"}.`,
  },

  {
    slug: "30-60-90-plan",
    name: "30/60/90-Day Plan Builder",
    category: "Onboarding",
    description: "Build a structured onboarding plan with clear goals for each phase.",
    icon: "Calendar",
    inputs: [
      { name: "jobTitle", label: "Job title", type: "text", required: true },
      { name: "department", label: "Department", type: "text", required: true },
      { name: "level", label: "Seniority", type: "select", options: [
        { value: "junior", label: "Junior / Entry-level" }, { value: "mid", label: "Mid-level" },
        { value: "senior", label: "Senior" }, { value: "management", label: "Manager / Director" },
      ], required: true },
      { name: "keyResponsibilities", label: "Key responsibilities", type: "textarea", placeholder: "What are the main things this person will own?" },
      { name: "teamContext", label: "Team context (optional)", type: "textarea", placeholder: "e.g. joining a team of 8, cross-functional role..." },
    ],
    promptTemplate: (inputs) => `You are an experienced HR and onboarding specialist. Create a detailed 30/60/90-day onboarding plan for:

Role: ${inputs.jobTitle}
Department: ${inputs.department}
Seniority: ${inputs.level}
${inputs.keyResponsibilities ? `Key responsibilities: ${inputs.keyResponsibilities}` : ""}
${inputs.teamContext ? `Team context: ${inputs.teamContext}` : ""}

Structure the plan in three phases. For each phase (Days 1–30, Days 31–60, Days 61–90), provide:

**Learning goals:** What the hire should understand
**Performance goals:** What the hire should start doing / delivering
**Relationship goals:** Key people to meet and relationships to build
**Success metrics:** How the manager and hire will know things are on track

Make it specific, practical, and appropriate for the seniority level. Format as clean markdown with clear headings.`,
  },

  {
    slug: "performance-review",
    name: "Performance Review Template",
    category: "Performance",
    description: "Generate structured performance review templates for annual, quarterly, or probation reviews.",
    icon: "TrendingUp",
    inputs: [
      { name: "reviewType", label: "Review type", type: "select", options: [
        { value: "annual", label: "Annual review" }, { value: "quarterly", label: "Quarterly check-in" },
        { value: "probation", label: "Probation review" }, { value: "360", label: "360° review" },
      ], required: true },
      { name: "employeeRole", label: "Employee role", type: "text", required: true },
      { name: "keyObjectives", label: "Key objectives / KPIs", type: "textarea", placeholder: "List the main goals being reviewed..." },
    ],
    promptTemplate: (inputs) => `You are an experienced HR professional. Create a ${inputs.reviewType} performance review template for a ${inputs.employeeRole}.

${inputs.keyObjectives ? `Key objectives to review: ${inputs.keyObjectives}` : ""}

Include sections for:
1. Performance against objectives (with rating scale guidance)
2. Core competencies assessment
3. Strengths demonstrated
4. Areas for development
5. Manager comments
6. Employee self-assessment section
7. Goals for next period
8. Career development discussion
9. Overall rating and recommendation

${inputs.reviewType === "360" ? "Also include peer feedback and stakeholder feedback sections." : ""}
${inputs.reviewType === "probation" ? "Include a clear recommendation section: Confirm employment / Extend probation / End employment." : ""}

Format as a structured template with clear labels and space for written responses.`,
  },

  {
    slug: "pip-builder",
    name: "PIP Builder",
    category: "Performance",
    description: "Build a Performance Improvement Plan that is fair, specific, and legally sound.",
    icon: "AlertCircle",
    inputs: [
      { name: "employeeName", label: "Employee name", type: "text", required: true },
      { name: "employeeRole", label: "Employee role", type: "text", required: true },
      { name: "performanceGaps", label: "Performance gaps identified", type: "textarea", required: true, placeholder: "Describe specific performance concerns with examples..." },
      { name: "pipDuration", label: "PIP duration", type: "select", options: [
        { value: "30 days", label: "30 days" }, { value: "60 days", label: "60 days" }, { value: "90 days", label: "90 days" },
      ] },
      { name: "supportOffered", label: "Support to be provided", type: "textarea", placeholder: "Training, coaching, resources, check-in frequency..." },
    ],
    promptTemplate: (inputs) => `You are an experienced HR professional. Create a Performance Improvement Plan (PIP) for:

Employee: ${inputs.employeeName}
Role: ${inputs.employeeRole}
Duration: ${inputs.pipDuration || "60 days"}
Performance concerns: ${inputs.performanceGaps}
${inputs.supportOffered ? `Support offered: ${inputs.supportOffered}` : ""}

The PIP should include:
1. Purpose statement (professional, not punitive)
2. Summary of performance concerns (specific, factual, with examples)
3. Expected performance standards (SMART goals)
4. Action steps and timeline
5. Support and resources provided
6. Check-in schedule (recommended: weekly)
7. Consequences if improvement is not made
8. Success criteria
9. Signature blocks

Tone should be professional, clear, and supportive — the goal is improvement, not a paper trail for dismissal.

Note: Review this PIP with HR and legal before issuing.`,
  },

  {
    slug: "onboarding-checklist",
    name: "Onboarding Checklist",
    category: "Onboarding",
    description: "Generate a comprehensive onboarding checklist tailored to the role and company size.",
    icon: "CheckSquare",
    inputs: [
      { name: "jobTitle", label: "Job title", type: "text", required: true },
      { name: "department", label: "Department", type: "text" },
      { name: "companySize", label: "Company size", type: "select", options: [
        { value: "startup", label: "Startup (1–50)" }, { value: "small", label: "Small (51–200)" },
        { value: "medium", label: "Medium (201–1000)" }, { value: "large", label: "Large (1000+)" },
      ] },
      { name: "workArrangement", label: "Work arrangement", type: "select", options: [
        { value: "office", label: "Office" }, { value: "remote", label: "Remote" }, { value: "hybrid", label: "Hybrid" },
      ] },
    ],
    promptTemplate: (inputs) => `You are an HR specialist. Create a comprehensive onboarding checklist for a new ${inputs.jobTitle}${inputs.department ? ` in ${inputs.department}` : ""}.

Company size: ${inputs.companySize || "not specified"}
Work arrangement: ${inputs.workArrangement || "office"}

Organise the checklist into phases:
- Before Day 1 (pre-boarding)
- Day 1
- Week 1
- Month 1

For each item, include:
- The task itself
- Who is responsible (HR / Manager / IT / Employee)
- Whether it's required or optional

Include practical items like: system access, equipment setup, compliance training, introductions, culture orientation, role-specific induction.

Format as a clean checklist with checkboxes (markdown [ ] format).`,
  },

  {
    slug: "rejection-email",
    name: "Rejection Email Writer",
    category: "Recruitment",
    description: "Write kind, professional rejection emails that leave a positive impression.",
    icon: "Mail",
    inputs: [
      { name: "candidateName", label: "Candidate name", type: "text", required: true },
      { name: "roleName", label: "Role applied for", type: "text", required: true },
      { name: "stageReached", label: "Stage reached", type: "select", options: [
        { value: "application", label: "Application review" },
        { value: "phone", label: "Phone/video screen" },
        { value: "interview", label: "Interview" },
        { value: "final", label: "Final round" },
      ] },
      { name: "feedback", label: "Feedback to share (optional)", type: "textarea", placeholder: "Any specific feedback you'd like to include..." },
    ],
    promptTemplate: (inputs) => `Write a kind, professional rejection email for a candidate who has been unsuccessful.

Candidate name: ${inputs.candidateName}
Role: ${inputs.roleName}
Stage reached: ${inputs.stageReached}
${inputs.feedback ? `Feedback to include: ${inputs.feedback}` : "Keep feedback general and encouraging."}

The email should:
- Be warm and human, not a form letter
- Thank the candidate genuinely for their time
- Be clear about the decision without being harsh
- ${inputs.feedback ? "Include the specific feedback provided" : "Encourage them without false hope"}
- Leave the door open for future opportunities (if appropriate)
- Be concise — no more than 150 words

Tone: professional but human. Never corporate-robotic.`,
  },
];

const CALCULATOR_TOOL_CONFIGS: ToolConfig[] = CALCULATORS.map((calculator) => ({
  slug: calculator.slug,
  name: calculator.name,
  category: calculator.category,
  description: calculator.description,
  icon: "Calculator",
  toolType: "calculator",
  inputs: [],
}));

export const TOOLS_CONFIG: ToolConfig[] = [...AI_TOOLS_CONFIG, ...CALCULATOR_TOOL_CONFIGS];

export function getToolConfig(slug: string): ToolConfig | undefined {
  return TOOLS_CONFIG.find((t) => t.slug === slug);
}
