import fs from "fs";
import path from "path";

interface Entry {
  term: string;
  fullName: string;
  definition: string;
  category: string;
  alsoSeeArticles: string[];
  alsoSeeTools: string[];
  synonyms: string[];
}

type Row = [
  term: string,
  fullName: string,
  definition: string,
  articles?: string[],
  tools?: string[],
  synonyms?: string[],
];

const categories: { category: string; rows: Row[] }[] = [
  {
    category: "Recruitment & Talent Acquisition",
    rows: [
      ["ATS", "Applicant Tracking System", "Software used to post roles, receive applications, track candidates, and manage hiring workflows.", ["how-to-screen-cvs-efficiently"], ["job-description-generator"], ["recruiting software"]],
      ["Candidate experience", "Candidate experience", "The full experience a candidate has with an employer, from first contact to offer, rejection, or onboarding.", ["the-candidate-experience-why-it-matters"]],
      ["Competency interview", "Competency interview", "An interview that tests specific skills or behaviours using consistent questions and evidence-based scoring.", ["the-complete-guide-to-structured-interviews"], ["interview-questions"], ["behavioral interview"]],
      ["Employee referral", "Employee referral", "A hiring source where employees recommend candidates from their network, often with a referral bonus.", ["sourcing-candidates-beyond-linkedin"]],
      ["Employer brand", "Employer brand", "The reputation and promise an employer has in the labour market, shaped by culture, work, leadership, and employee stories.", ["building-an-employer-brand-from-scratch"]],
      ["EVP", "Employee Value Proposition", "The mix of pay, benefits, growth, culture, purpose, flexibility, and working conditions that makes people join and stay.", ["building-an-employer-brand-from-scratch"]],
      ["Job description", "Job description", "A role document explaining why a job exists, what it owns, required skills, reporting line, and working conditions.", ["how-to-write-a-job-description"], ["job-description-generator"], ["JD"]],
      ["Offer acceptance rate", "Offer acceptance rate", "The percentage of job offers accepted by candidates during a period.", ["how-to-negotiate-salaries-with-candidates"]],
      ["Reference check", "Reference check", "A structured conversation with a former manager or colleague to verify role-relevant work history and behaviours.", ["reference-checks-what-to-ask-what-to-avoid"]],
      ["Structured interview", "Structured interview", "An interview where every candidate is assessed using the same competencies, questions, rating scale, and evidence rules.", ["the-complete-guide-to-structured-interviews"], ["interview-questions"]],
    ],
  },
  {
    category: "Onboarding & Induction",
    rows: [
      ["30-60-90 plan", "30-60-90 day plan", "A phased onboarding plan that defines learning, contribution, and independence goals for a new hire.", ["the-30-60-90-day-onboarding-plan-that-works"], ["30-60-90-plan"]],
      ["Buddy system", "Buddy system", "A peer support arrangement that helps a new hire learn informal norms, tools, contacts, and day-to-day practices.", ["buddy-systems-and-mentorship-in-onboarding"]],
      ["Induction", "Induction", "The formal process of introducing a new hire to the organization, policies, role expectations, and required training.", ["the-30-60-90-day-onboarding-plan-that-works"], [], ["orientation"]],
      ["New hire checklist", "New hire checklist", "A checklist covering preboarding, day-one setup, training, access, policy acknowledgments, and manager actions.", ["onboarding-remote-employees-whats-different"], ["onboarding-checklist"]],
      ["Onboarding cliff", "Onboarding cliff", "The drop in confidence or performance that happens when early support disappears before a new hire is fully productive."],
      ["Preboarding", "Preboarding", "The period between offer acceptance and day one, used for paperwork, equipment, welcome messages, and expectation setting.", ["onboarding-starts-before-day-one-pre-boarding"], [], ["pre-boarding"]],
      ["Probation period", "Probation period", "An initial employment period used to assess role fit and performance; legal meaning varies heavily by country.", ["probation-periods-legal-and-practical"], [], ["trial period"]],
      ["Ramp time", "Ramp time", "The time it takes a new hire to reach expected productivity in the role.", ["the-30-60-90-day-onboarding-plan-that-works"]],
      ["Role clarity", "Role clarity", "A shared understanding of responsibilities, decision rights, success measures, and boundaries for a role."],
      ["Welcome pack", "Welcome pack", "A set of documents, messages, equipment, and practical information sent to a new hire before or on day one.", ["onboarding-starts-before-day-one-pre-boarding"], [], ["welcome kit"]],
    ],
  },
  {
    category: "Employee Records & Documentation",
    rows: [
      ["Document retention", "Document retention", "Rules for how long employee records must be kept before secure deletion or archiving.", [], [], ["record retention"]],
      ["Employee file", "Employee file", "The official personnel record containing employment documents, changes, performance records, and required acknowledgments.", [], [], ["personnel file"]],
      ["Employee ID", "Employee ID", "A unique identifier assigned to an employee for HRIS, payroll, access, reporting, and records management.", [], [], ["staff number"]],
      ["Form I-9", "Employment Eligibility Verification", "A United States form used to verify an employee's identity and authorization to work.", ["united-states"], [], ["I-9"]],
      ["Form 16", "Form 16", "An Indian tax certificate issued by employers showing salary paid and tax deducted at source.", ["india"]],
      ["HRIS", "Human Resources Information System", "A system used to store employee records and manage HR workflows such as profiles, leave, payroll, and reporting.", [], [], ["HR system"]],
      ["HRMS", "Human Resources Management System", "A broad HR platform covering employee data, workflows, payroll integrations, time, performance, and reporting."],
      ["Personnel record", "Personnel record", "Any official record relating to an employee's employment, pay, performance, leave, conduct, or exit.", [], [], ["employee record"]],
      ["P11D", "P11D", "A UK form used to report certain employee benefits and expenses to HMRC.", ["united-kingdom"]],
      ["W-2", "Form W-2", "A United States tax form reporting wages paid and taxes withheld for an employee.", ["united-states"]],
    ],
  },
  {
    category: "Leave & Attendance",
    rows: [
      ["Absenteeism", "Absenteeism", "Regular or repeated absence from work, usually tracked as a percentage of scheduled working time.", ["sick-leave-abuse-handling-without-being-a-jerk"], ["absenteeism-rate"], ["absence rate"]],
      ["Accrued leave", "Accrued leave", "Leave earned over time based on service, hours worked, or policy rules.", ["designing-a-leave-policy-that-works-for-everyone"], [], ["earned leave"]],
      ["Annual leave", "Annual leave", "Paid time off for rest or vacation, often subject to statutory minimums and company policy.", ["designing-a-leave-policy-that-works-for-everyone"], [], ["vacation leave"]],
      ["Bradford Factor", "Bradford Factor", "An absence formula that weights frequent short absences more heavily than fewer long absences.", ["sick-leave-abuse-handling-without-being-a-jerk"], ["absenteeism-rate"]],
      ["Bereavement leave", "Bereavement leave", "Time off after the death of a family member or close relation, paid or unpaid depending on law and policy.", ["designing-a-leave-policy-that-works-for-everyone"], [], ["compassionate leave"]],
      ["Carryover", "Leave carryover", "A rule that allows unused leave to move into the next leave year, often with caps or expiry dates.", ["designing-a-leave-policy-that-works-for-everyone"], [], ["rollover"]],
      ["FMLA", "Family and Medical Leave Act", "A United States law giving eligible employees up to 12 weeks of unpaid, job-protected leave for certain reasons.", ["united-states"]],
      ["Parental leave", "Parental leave", "Leave for parents after birth, adoption, surrogacy, or placement, with rules varying widely by country.", ["maternity-and-paternity-leave-globally"]],
      ["PTO", "Paid Time Off", "A paid leave bank that may combine vacation, personal, and sometimes sick time.", ["designing-a-leave-policy-that-works-for-everyone"]],
      ["Sick leave", "Sick leave", "Time off when an employee is ill, injured, attending medical care, or unable to work for health reasons.", ["sick-leave-abuse-handling-without-being-a-jerk"]],
    ],
  },
  {
    category: "Payroll Administration",
    rows: [
      ["13th month salary", "13th month salary", "An extra salary payment expected or required in some countries, often paid near year end.", ["bonus-structures-types-pros-cons-pitfalls"]],
      ["Deductions", "Payroll deductions", "Amounts withheld from pay for tax, social security, pensions, benefits, loans, or lawful recoveries.", [], [], ["withholdings"]],
      ["EOR", "Employer of Record", "A third party that legally employs workers in a country while the client directs day-to-day work.", ["international-payroll-getting-started-with-global-teams"]],
      ["Gross pay", "Gross pay", "Total earnings before taxes, employee contributions, deductions, and withholdings.", [], [], ["gross salary"]],
      ["Net pay", "Net pay", "The amount an employee receives after required and voluntary deductions.", [], [], ["take-home pay"]],
      ["PAYE", "Pay As You Earn", "A payroll withholding system where employers deduct income tax from employee pay and remit it to the tax authority.", ["nigeria"]],
      ["Payroll cadence", "Payroll cadence", "The schedule on which employees are paid, such as weekly, biweekly, semimonthly, or monthly.", ["international-payroll-getting-started-with-global-teams"], [], ["pay frequency"]],
      ["Payroll register", "Payroll register", "A payroll report listing employees, earnings, deductions, taxes, and net pay for a pay period."],
      ["Pension contribution", "Pension contribution", "Employer or employee payments into a retirement or pension scheme.", ["nigeria", "india"], [], ["retirement contribution"]],
      ["Tax equalization", "Tax equalization", "An expatriate pay approach designed so an assignee pays roughly the same tax as they would at home.", ["international-payroll-getting-started-with-global-teams"]],
    ],
  },
  {
    category: "Compensation, Reward & Benefits",
    rows: [
      ["Bonus pool", "Bonus pool", "The total amount set aside for bonuses before allocation across employees or teams.", ["linking-performance-to-pay-without-demotivating"]],
      ["Compa-ratio", "Compa-ratio", "An employee's salary divided by the midpoint of the pay range for their role or grade.", ["how-to-design-a-salary-structure-from-scratch"], ["salary-benchmark"]],
      ["ESOP", "Employee Stock Ownership Plan", "A plan that gives employees ownership interest in the company, usually through shares or trust structures.", ["equity-compensation-explained-for-hr"]],
      ["Market midpoint", "Market midpoint", "The middle point of a salary range, usually aligned to a target labour market percentile.", ["how-to-design-a-salary-structure-from-scratch"], ["salary-benchmark"]],
      ["Merit increase", "Merit increase", "A salary increase linked to performance, contribution, skills, or position in range.", ["managing-salary-increases-during-economic-uncertainty"], [], ["merit raise"]],
      ["Pay band", "Pay band", "A salary range assigned to a level, grade, or role family.", ["how-to-design-a-salary-structure-from-scratch"], ["salary-benchmark"]],
      ["Pay compression", "Pay compression", "A pay problem where differences between employees, levels, or tenures become too small to reflect value fairly.", ["pay-equity-audits-how-to-run-one"], ["pay-equity"]],
      ["RSU", "Restricted Stock Unit", "An equity award that converts into shares after vesting conditions are met.", ["equity-compensation-explained-for-hr"]],
      ["Salary benchmarking", "Salary benchmarking", "The process of comparing roles and pay against market data to set or validate compensation.", ["salary-benchmarking-a-practical-guide"], ["salary-benchmark"]],
      ["Total rewards", "Total rewards", "The full value of employment including cash, equity, benefits, time off, recognition, flexibility, and growth.", ["total-rewards-communicating-full-value"]],
    ],
  },
  {
    category: "Performance Management",
    rows: [
      ["360 feedback", "360-degree feedback", "Feedback collected from multiple sources such as manager, peers, direct reports, and stakeholders.", ["the-360-degree-feedback-process"], ["performance-review"], ["multi-rater feedback"]],
      ["9-box grid", "9-box grid", "A talent review tool that maps performance against potential to guide development and succession decisions."],
      ["BARS", "Behaviorally Anchored Rating Scale", "A rating scale that defines each score with observable behaviours instead of vague labels.", ["calibration-sessions-fair-ratings-across-teams"]],
      ["Calibration", "Calibration", "A process where managers compare evidence and ratings to improve consistency across teams.", ["calibration-sessions-fair-ratings-across-teams"]],
      ["Goodhart's Law", "Goodhart's Law", "The principle that when a measure becomes a target, it can stop being a good measure.", ["setting-kpis-that-drive-performance"]],
      ["KPI", "Key Performance Indicator", "A measurable indicator used to track whether an employee, team, or organization is achieving an important objective.", ["setting-kpis-that-drive-performance"]],
      ["OKR", "Objectives and Key Results", "A goal-setting framework that pairs an objective with measurable key results, often set quarterly.", ["okrs-vs-kpis-which-framework"]],
      ["PIP", "Performance Improvement Plan", "A structured plan documenting performance gaps, expected improvement, support offered, timelines, and consequences.", ["performance-improvement-plans-the-right-way"], ["pip-builder"]],
      ["SBI model", "Situation-Behavior-Impact model", "A feedback structure that names the situation, describes observable behaviour, and explains impact.", ["how-to-give-feedback-that-lands"]],
      ["SMART goal", "SMART goal", "A goal written to be specific, measurable, achievable, relevant, and time-bound.", ["setting-kpis-that-drive-performance"]],
    ],
  },
  {
    category: "Learning & Development",
    rows: [
      ["ADDIE", "ADDIE model", "A learning design model covering analysis, design, development, implementation, and evaluation."],
      ["Career pathing", "Career pathing", "The process of defining possible career moves, skills, and milestones for employees."],
      ["Competency framework", "Competency framework", "A structured set of skills, behaviours, and expectations used for hiring, development, and performance."],
      ["Kirkpatrick model", "Kirkpatrick model", "A four-level model for evaluating training reaction, learning, behaviour change, and business results."],
      ["LMS", "Learning Management System", "Software used to assign, deliver, track, and report learning activities."],
      ["Mentorship", "Mentorship", "A development relationship where a more experienced person supports another person's growth and judgment.", ["buddy-systems-and-mentorship-in-onboarding"]],
      ["Reskilling", "Reskilling", "Training employees for substantially different work as business needs or technology change."],
      ["Skills matrix", "Skills matrix", "A table showing which employees have which skills, proficiency levels, or certifications."],
      ["Succession planning", "Succession planning", "Identifying and preparing people for critical roles before vacancies or leadership transitions happen."],
      ["Training needs analysis", "Training needs analysis", "A structured assessment of capability gaps and learning priorities.", [], [], ["TNA"]],
    ],
  },
  {
    category: "Employee Relations",
    rows: [
      ["Accommodation", "Reasonable accommodation", "A change to work, tools, schedules, or process that enables a qualified employee to perform their role.", ["how-to-handle-a-high-performer-burning-out"]],
      ["ADR", "Alternative Dispute Resolution", "Methods such as mediation or arbitration used to resolve disputes outside formal litigation."],
      ["Bullying", "Workplace bullying", "Repeated unreasonable behaviour that undermines, humiliates, intimidates, or harms a worker.", ["handling-harassment-complaints-step-by-step"]],
      ["Conflict resolution", "Conflict resolution", "A structured process for resolving workplace disagreements before they damage performance or trust."],
      ["ER specialist", "Employee Relations Specialist", "An HR professional focused on conduct, grievances, investigations, accommodations, and workplace conflict."],
      ["Grievance", "Grievance", "A formal employee complaint about treatment, working conditions, policy application, or workplace conduct.", ["conducting-workplace-investigations"]],
      ["Mediation", "Mediation", "A facilitated conversation where a neutral person helps parties reach a workable resolution."],
      ["Retaliation", "Retaliation", "Adverse treatment because someone reported a concern, participated in an investigation, or exercised a protected right.", ["handling-harassment-complaints-step-by-step"]],
      ["Speak-up culture", "Speak-up culture", "A workplace environment where people can raise concerns without fear of punishment or dismissal.", ["whistleblower-policy-why-you-need-one"]],
      ["Workplace investigation", "Workplace investigation", "A structured fact-finding process used to assess complaints, misconduct, harassment, fraud, or safety concerns.", ["conducting-workplace-investigations"]],
    ],
  },
  {
    category: "Discipline & Grievance",
    rows: [
      ["Final written warning", "Final written warning", "A serious disciplinary warning that usually precedes termination if the issue continues.", ["verbal-vs-written-warnings-when-to-use-each"]],
      ["Gross misconduct", "Gross misconduct", "Serious misconduct that may justify dismissal without normal progressive discipline, depending on law and facts.", ["verbal-vs-written-warnings-when-to-use-each"]],
      ["Just cause", "Just cause", "A legally sufficient reason for discipline or dismissal, often requiring evidence and fair process.", ["how-to-fire-someone-with-dignity-and-legally"]],
      ["Loudermill hearing", "Loudermill hearing", "A pre-termination due process meeting required for many US public-sector employees."],
      ["Misconduct", "Misconduct", "Behaviour that breaches policy, contract, standards, law, or reasonable workplace expectations.", ["verbal-vs-written-warnings-when-to-use-each"]],
      ["Progressive discipline", "Progressive discipline", "A discipline approach that escalates through coaching, warnings, final warning, and termination unless severity requires faster action.", ["verbal-vs-written-warnings-when-to-use-each"]],
      ["Show-cause letter", "Show-cause letter", "A formal letter asking an employee to explain alleged misconduct before a decision is made."],
      ["Suspension pending investigation", "Suspension pending investigation", "A temporary removal from work while serious allegations are investigated, ideally neutral and documented.", ["conducting-workplace-investigations"]],
      ["Verbal warning", "Verbal warning", "A spoken warning that should still be documented with facts, expectations, and follow-up.", ["verbal-vs-written-warnings-when-to-use-each"]],
      ["Written warning", "Written warning", "A formal document setting out a conduct or performance concern, required improvement, support, timeline, and consequences.", ["verbal-vs-written-warnings-when-to-use-each"]],
    ],
  },
  {
    category: "HR Policies & Employee Handbook",
    rows: [
      ["Acceptable use policy", "Acceptable use policy", "A policy defining permitted and prohibited use of company systems, devices, networks, and data."],
      ["Acknowledgment form", "Acknowledgment form", "A signed or electronic confirmation that an employee received, read, or agreed to a policy or document.", ["building-your-first-employee-handbook"]],
      ["Anti-harassment policy", "Anti-harassment policy", "A policy defining harassment, reporting routes, investigation commitment, manager duties, and no-retaliation protections.", ["anti-harassment-policy-what-every-company-needs"]],
      ["Code of conduct", "Code of conduct", "A policy that turns values into expected behaviours, prohibited conduct, escalation routes, and consequences.", ["code-of-conduct-making-values-actionable"]],
      ["Employee handbook", "Employee handbook", "A central document explaining employment basics, policies, expectations, benefits, conduct, and procedures.", ["building-your-first-employee-handbook"]],
      ["Policy owner", "Policy owner", "The person or function accountable for keeping a policy accurate, reviewed, and operational."],
      ["Remote work policy", "Remote work policy", "A policy defining eligibility, location rules, equipment, security, expenses, working hours, and approval for remote work.", ["the-remote-work-policy-with-country-variants"]],
      ["Social media policy", "Social media policy", "A policy covering work-related online conduct, confidentiality, harassment, advocacy, and protected employee speech.", ["social-media-policy-balancing-freedom-and-protection"]],
      ["Travel and expense policy", "Travel and expense policy", "A policy defining business travel, approvals, expense limits, receipts, reimbursement, and audit rules.", ["travel-and-expense-policy-clarity-prevents-conflict"]],
      ["Whistleblower policy", "Whistleblower policy", "A policy that enables reporting serious concerns with confidentiality, no retaliation, and investigation commitments.", ["whistleblower-policy-why-you-need-one"]],
    ],
  },
  {
    category: "Compliance & Labour Law",
    rows: [
      ["ADA", "Americans with Disabilities Act", "A United States law prohibiting disability discrimination and requiring reasonable accommodation for qualified individuals.", ["united-states"]],
      ["ADEA", "Age Discrimination in Employment Act", "A United States law prohibiting age discrimination against workers aged 40 and older.", ["united-states"]],
      ["CCPA", "California Consumer Privacy Act", "A California privacy law that can affect employee and applicant data obligations.", ["data-privacy-and-hr-gdpr-ccpa-and-beyond"]],
      ["EEOC", "Equal Employment Opportunity Commission", "The United States federal agency that enforces major anti-discrimination employment laws.", ["united-states"]],
      ["ERISA", "Employee Retirement Income Security Act", "A United States law regulating many private employer retirement and benefit plans.", ["united-states"]],
      ["FLSA", "Fair Labor Standards Act", "A United States law covering minimum wage, overtime, child labour, and exempt versus non-exempt classification.", ["united-states"]],
      ["GDPR", "General Data Protection Regulation", "The European Union data protection law governing collection, use, transfer, and rights over personal data.", ["data-privacy-and-hr-gdpr-ccpa-and-beyond"]],
      ["IR35", "IR35", "UK tax rules for assessing whether contractors are effectively employees for tax purposes.", ["united-kingdom"]],
      ["OSHA", "Occupational Safety and Health Administration", "The United States agency enforcing workplace safety and health standards.", ["manufacturing"]],
      ["WARN Act", "Worker Adjustment and Retraining Notification Act", "A United States law requiring advance notice for certain large layoffs and plant closures.", ["united-states", "redundancy-legal-requirements-and-humane-execution"]],
    ],
  },
  {
    category: "Employee Engagement & Culture",
    rows: [
      ["Belonging", "Belonging", "The experience of feeling accepted, respected, included, and able to contribute at work."],
      ["Culture add", "Culture add", "A hiring and culture concept focused on what difference a person adds, instead of whether they match existing norms.", ["how-to-reduce-bias-in-hiring"]],
      ["Employee engagement", "Employee engagement", "The level of connection, commitment, motivation, and discretionary effort employees bring to work."],
      ["Employee lifecycle", "Employee lifecycle", "The full journey of an employee from attraction and hiring through onboarding, development, retention, and exit."],
      ["eNPS", "Employee Net Promoter Score", "A survey metric asking how likely employees are to recommend the company as a place to work."],
      ["ERG", "Employee Resource Group", "A voluntary employee group organized around shared identity, experience, interest, or allyship."],
      ["Meritocracy", "Meritocracy", "A system that claims rewards are based on merit; in HR, it should be tested for fairness and hidden bias."],
      ["Psychological safety", "Psychological safety", "A team climate where people can speak up, ask questions, and admit mistakes without fear of humiliation or punishment."],
      ["Pulse survey", "Pulse survey", "A short recurring employee survey used to monitor sentiment, workload, engagement, or change impact."],
      ["Recognition program", "Recognition program", "A structured way to acknowledge employee contributions through praise, awards, points, bonuses, or public appreciation."],
    ],
  },
  {
    category: "Health, Safety & Wellbeing",
    rows: [
      ["Burnout", "Burnout", "A work-related state of exhaustion, cynicism, and reduced efficacy caused by chronic unmanaged workplace stress.", ["how-to-handle-a-high-performer-burning-out", "mental-health-days-the-case-for-them"]],
      ["EAP", "Employee Assistance Program", "A confidential support service that may offer counselling, referrals, crisis support, and wellbeing resources.", ["mental-health-days-the-case-for-them"]],
      ["Ergonomics", "Ergonomics", "Designing work, tools, and workstations to reduce strain, injury, and fatigue.", ["the-remote-work-policy-with-country-variants"]],
      ["Hazard assessment", "Hazard assessment", "A process for identifying workplace hazards and controls to reduce safety risk.", ["manufacturing"]],
      ["Incident report", "Incident report", "A record of a workplace accident, injury, near miss, security event, or serious safety concern."],
      ["Mental health day", "Mental health day", "A day off used to manage mental wellbeing, either as sick leave or a separate policy category.", ["mental-health-days-the-case-for-them"]],
      ["Near miss", "Near miss", "An unplanned event that could have caused injury, damage, or loss but did not.", ["manufacturing"]],
      ["Reasonable adjustment", "Reasonable adjustment", "A UK-style term for changes that remove disadvantage for disabled workers or applicants.", ["united-kingdom"]],
      ["Return-to-work plan", "Return-to-work plan", "A structured plan for an employee returning after illness, injury, parental leave, or extended absence.", ["maternity-and-paternity-leave-globally"]],
      ["Workers' compensation", "Workers' compensation", "A system providing benefits for employees injured or made ill through work, with country-specific rules.", ["manufacturing"]],
    ],
  },
  {
    category: "HR Analytics & Reporting",
    rows: [
      ["Attrition rate", "Attrition rate", "The percentage of employees who leave during a period, often used interchangeably with turnover rate.", ["the-exit-interview-getting-truth-and-using-it"], ["turnover-rate"]],
      ["Cost per hire", "Cost per hire", "Total recruiting cost divided by number of hires in a period.", [], ["cost-per-hire"]],
      ["Dashboard", "HR dashboard", "A visual report that shows key HR metrics such as headcount, attrition, hiring, absence, and demographics.", [], ["hr-dashboard"]],
      ["Headcount", "Headcount", "The number of people employed or engaged by an organization, often split by status, department, country, or level.", [], ["headcount-planner"]],
      ["Leading indicator", "Leading indicator", "A metric that predicts or influences a future outcome, such as pipeline quality before hiring results appear.", ["setting-kpis-that-drive-performance"]],
      ["Lagging indicator", "Lagging indicator", "A metric that reports an outcome after it has happened, such as turnover after employees have left.", ["setting-kpis-that-drive-performance"]],
      ["P90", "90th percentile", "The value below which 90 percent of observations fall, often used for time-to-hire or pay analysis.", [], ["time-to-hire", "salary-benchmark"]],
      ["People analytics", "People analytics", "Using workforce data and analysis to answer HR and business questions.", [], ["hr-dashboard"], ["HR analytics"]],
      ["Regression analysis", "Regression analysis", "A statistical method for estimating relationships between variables, often used in pay equity analysis.", ["pay-equity-audits-how-to-run-one"], ["pay-equity"]],
      ["Time to fill", "Time to fill", "The number of days between opening a role and accepting an offer or filling the vacancy.", [], ["time-to-hire"]],
    ],
  },
  {
    category: "Offboarding & Exit Management",
    rows: [
      ["Exit interview", "Exit interview", "A structured conversation with a departing employee about their experience and reasons for leaving.", ["the-exit-interview-getting-truth-and-using-it"]],
      ["Final pay", "Final pay", "The wages, accrued entitlements, deductions, expenses, and payments due when employment ends.", [], ["termination-letter"]],
      ["Garden leave", "Garden leave", "A notice-period arrangement where an employee remains employed but is told not to work or access systems.", ["how-to-fire-someone-with-dignity-and-legally"]],
      ["Knowledge transfer", "Knowledge transfer", "The planned handover of information, processes, relationships, and decisions before a person leaves or changes role.", ["redundancy-legal-requirements-and-humane-execution"]],
      ["Offboarding", "Offboarding", "The process of managing an employee's exit, including handover, access removal, final pay, documents, and feedback.", ["the-exit-interview-getting-truth-and-using-it"]],
      ["Outplacement", "Outplacement", "Support offered to departing employees, such as career coaching, CV help, job search support, and workshops.", ["redundancy-legal-requirements-and-humane-execution"]],
      ["Redundancy", "Redundancy", "A role elimination caused by business needs rather than employee conduct or performance.", ["redundancy-legal-requirements-and-humane-execution"], [], ["layoff"]],
      ["Resignation", "Resignation", "An employee's voluntary notice that they intend to end employment.", ["the-exit-interview-getting-truth-and-using-it"]],
      ["Severance", "Severance", "Pay or benefits provided when employment ends, required in some countries and discretionary in others.", ["how-to-fire-someone-with-dignity-and-legally"], [], ["severance pay"]],
      ["Termination", "Termination", "The ending of employment by employer decision, employee resignation, contract expiry, redundancy, or mutual agreement.", ["how-to-fire-someone-with-dignity-and-legally"], ["termination-letter"], ["dismissal"]],
    ],
  },
  {
    category: "Remote & Hybrid Work",
    rows: [
      ["Asynchronous work", "Asynchronous work", "Work that does not require people to be online or respond at the same time.", ["onboarding-remote-employees-whats-different"], [], ["async work"]],
      ["Core hours", "Core hours", "Agreed hours when employees should normally be available for meetings and collaboration.", ["the-remote-work-policy-with-country-variants"]],
      ["Digital nomad", "Digital nomad", "A person who works remotely while moving between locations, often creating tax, immigration, and employment risks.", ["the-remote-work-policy-with-country-variants"]],
      ["Distributed team", "Distributed team", "A team whose members work from multiple locations, often across time zones.", ["onboarding-remote-employees-whats-different"]],
      ["Hybrid work", "Hybrid work", "A work arrangement combining remote work with regular office or site attendance.", ["the-remote-work-policy-with-country-variants"]],
      ["Permanent establishment", "Permanent establishment", "A tax concept where business activity in a country can create corporate tax obligations.", ["international-payroll-getting-started-with-global-teams"]],
      ["Remote stipend", "Remote stipend", "A payment or allowance for remote work costs such as internet, equipment, coworking, or ergonomics.", ["the-remote-work-policy-with-country-variants"]],
      ["Right to disconnect", "Right to disconnect", "A legal or policy right to disengage from work communications outside working time.", ["the-remote-work-policy-with-country-variants"]],
      ["Virtual onboarding", "Virtual onboarding", "Onboarding delivered through remote tools, documentation, meetings, and structured manager support.", ["onboarding-remote-employees-whats-different"]],
      ["Work from anywhere", "Work from anywhere", "A policy allowing work from many locations, subject to tax, immigration, security, and employment-law controls.", ["the-remote-work-policy-with-country-variants"], [], ["WFA"]],
    ],
  },
  {
    category: "Diversity, Equity & Inclusion",
    rows: [
      ["Adverse impact", "Adverse impact", "A selection or employment practice that disproportionately harms a protected group, even without intent.", ["how-to-reduce-bias-in-hiring"]],
      ["Affinity bias", "Affinity bias", "A bias where people favour candidates or colleagues who feel similar to themselves.", ["how-to-reduce-bias-in-hiring"]],
      ["DEI", "Diversity, Equity and Inclusion", "Work focused on representation, fairness, access, inclusion, and belonging across employee groups.", ["how-to-reduce-bias-in-hiring"], [], ["DE&I", "D&I"]],
      ["Diversity dimensions", "Diversity dimensions", "Characteristics and experiences that shape identity, such as gender, ethnicity, disability, age, class, religion, and caregiving.", ["how-to-reduce-bias-in-hiring"]],
      ["Equal opportunity", "Equal opportunity", "A commitment and legal principle that employment decisions should not be based on protected characteristics.", ["anti-harassment-policy-what-every-company-needs"]],
      ["Equity audit", "Equity audit", "A review of pay, promotion, hiring, ratings, or access to identify unfair differences between groups.", ["pay-equity-audits-how-to-run-one"], ["pay-equity"]],
      ["Halo effect", "Halo effect", "A bias where one positive trait distorts judgment about unrelated qualities.", ["how-to-reduce-bias-in-hiring"]],
      ["Inclusive language", "Inclusive language", "Language that avoids unnecessary exclusion, stereotypes, ableism, gender-coding, and culture-specific assumptions.", ["how-to-write-a-job-description"]],
      ["Indirect discrimination", "Indirect discrimination", "A neutral rule or practice that disadvantages a protected group and cannot be justified.", ["how-to-reduce-bias-in-hiring"]],
      ["Pay equity", "Pay equity", "Fair pay for comparable work after accounting for legitimate factors such as role, level, location, tenure, and performance.", ["pay-equity-audits-how-to-run-one"], ["pay-equity"]],
    ],
  },
  {
    category: "Manager Support",
    rows: [
      ["1:1", "One-on-one meeting", "A recurring meeting between a manager and direct report focused on priorities, feedback, support, and development.", ["how-to-give-feedback-that-lands"]],
      ["Delegation", "Delegation", "Assigning ownership of work with clear outcomes, authority, constraints, and support."],
      ["Feedback culture", "Feedback culture", "A team norm where timely, specific, respectful feedback is expected and used for improvement.", ["how-to-give-feedback-that-lands"]],
      ["Manager enablement", "Manager enablement", "Training, tools, templates, and support that help managers lead people well."],
      ["Manager self-service", "Manager self-service", "HR systems or workflows that allow managers to complete routine people tasks directly."],
      ["Performance coaching", "Performance coaching", "Manager support that helps an employee improve skills, habits, judgment, or delivery before formal discipline is needed.", ["performance-improvement-plans-the-right-way"]],
      ["Skip-level meeting", "Skip-level meeting", "A meeting between an employee and their manager's manager, often used to understand team health and leadership gaps."],
      ["Span of control", "Span of control", "The number of direct reports a manager has."],
      ["Team charter", "Team charter", "A document that defines a team's purpose, operating norms, decision rights, roles, and communication rules."],
      ["Trust equation", "Trust equation", "A model that frames trust through credibility, reliability, intimacy, and self-orientation."],
    ],
  },
  {
    category: "Workforce Planning & Org Design",
    rows: [
      ["Critical role", "Critical role", "A role whose vacancy or poor performance creates outsized operational, financial, customer, or compliance risk."],
      ["FTE", "Full-Time Equivalent", "A workforce measure that converts hours worked into full-time-equivalent units.", [], ["headcount-planner"]],
      ["Job architecture", "Job architecture", "The framework of job families, levels, titles, career paths, and pay structures in an organization.", ["how-to-design-a-salary-structure-from-scratch"]],
      ["Job family", "Job family", "A group of related jobs with similar work, skills, and career paths.", ["how-to-design-a-salary-structure-from-scratch"]],
      ["Leveling", "Leveling", "Defining role levels based on scope, impact, autonomy, skills, and complexity.", ["technology"], [], ["job leveling"]],
      ["Org design", "Organization design", "The deliberate design of structures, roles, decision rights, processes, and reporting lines.", [], [], ["organisation design"]],
      ["Position management", "Position management", "Planning and controlling approved roles or seats independent of the current employee occupying them.", [], ["headcount-planner"]],
      ["RACI", "Responsible, Accountable, Consulted, Informed", "A responsibility matrix clarifying who does, owns, advises, and is notified about work."],
      ["Scenario planning", "Scenario planning", "Planning workforce needs under multiple plausible business futures.", [], ["headcount-planner"]],
      ["Workforce plan", "Workforce plan", "A forward-looking plan for the headcount, skills, roles, timing, and cost needed to deliver business goals.", [], ["headcount-planner"]],
    ],
  },
];

const entries: Entry[] = categories
  .flatMap(({ category, rows }) =>
    rows.map(([term, fullName, definition, alsoSeeArticles = [], alsoSeeTools = [], synonyms = []]) => ({
      term,
      fullName,
      definition,
      category,
      alsoSeeArticles,
      alsoSeeTools,
      synonyms,
    }))
  )
  .sort((a, b) => a.term.localeCompare(b.term));

if (entries.length < 200) {
  throw new Error(`Expected at least 200 glossary entries, got ${entries.length}`);
}

const outputPath = path.join(process.cwd(), "src/content/glossary/glossary.json");
fs.writeFileSync(outputPath, `${JSON.stringify(entries, null, 2)}\n`);
console.log(`Wrote ${entries.length} glossary entries to ${outputPath}`);
