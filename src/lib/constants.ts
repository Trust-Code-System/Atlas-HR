export const HR_CATEGORIES = [
  { slug: "recruitment-and-talent-acquisition", label: "Recruitment & Talent Acquisition", icon: "Users" },
  { slug: "onboarding-and-induction", label: "Onboarding & Induction", icon: "UserPlus" },
  { slug: "employee-records-and-documentation", label: "Employee Records & Documentation", icon: "FileText" },
  { slug: "leave-and-attendance", label: "Leave & Attendance", icon: "Calendar" },
  { slug: "payroll-administration", label: "Payroll Administration", icon: "DollarSign" },
  { slug: "compensation-reward-and-benefits", label: "Compensation, Reward & Benefits", icon: "Gift" },
  { slug: "performance-management", label: "Performance Management", icon: "TrendingUp" },
  { slug: "learning-and-development", label: "Learning & Development", icon: "BookOpen" },
  { slug: "employee-relations", label: "Employee Relations", icon: "Heart" },
  { slug: "discipline-and-grievance", label: "Discipline & Grievance", icon: "AlertTriangle" },
  { slug: "hr-policies-and-employee-handbook", label: "HR Policies & Employee Handbook", icon: "Book" },
  { slug: "compliance-and-labour-law", label: "Compliance & Labour Law", icon: "Scale" },
  { slug: "employee-engagement-and-culture", label: "Employee Engagement & Culture", icon: "Smile" },
  { slug: "health-safety-and-wellbeing", label: "Health, Safety & Wellbeing", icon: "Shield" },
  { slug: "hr-analytics-and-reporting", label: "HR Analytics & Reporting", icon: "BarChart2" },
  { slug: "offboarding-and-exit-management", label: "Offboarding & Exit Management", icon: "LogOut" },
  { slug: "remote-and-hybrid-work", label: "Remote & Hybrid Work", icon: "Monitor" },
  { slug: "diversity-equity-and-inclusion", label: "Diversity, Equity & Inclusion", icon: "Globe" },
  { slug: "manager-support", label: "Manager Support", icon: "Briefcase" },
  { slug: "workforce-planning-and-org-design", label: "Workforce Planning & Org Design", icon: "Layers" },
] as const;

export const HR_CATEGORY_SLUGS = HR_CATEGORIES.map((category) => category.slug);

export const COUNTRIES = [
  { code: "us", label: "United States" },
  { code: "uk", label: "United Kingdom" },
  { code: "ca", label: "Canada" },
  { code: "ng", label: "Nigeria" },
  { code: "ke", label: "Kenya" },
  { code: "za", label: "South Africa" },
  { code: "in", label: "India" },
  { code: "ph", label: "Philippines" },
  { code: "ae", label: "UAE" },
  { code: "br", label: "Brazil" },
  { code: "de", label: "Germany" },
  { code: "au", label: "Australia" },
] as const;

export const INDUSTRIES = [
  { slug: "tech", label: "Technology" },
  { slug: "healthcare", label: "Healthcare" },
  { slug: "manufacturing", label: "Manufacturing" },
  { slug: "retail", label: "Retail" },
  { slug: "finance", label: "Finance" },
  { slug: "hospitality", label: "Hospitality" },
  { slug: "ngo", label: "NGO / Nonprofit" },
  { slug: "education", label: "Education" },
  { slug: "government", label: "Government" },
  { slug: "other", label: "Other" },
] as const;

export const COMPANY_SIZES = [
  "1-10", "11-50", "51-200", "201-500", "501-1000", "1001-5000", "5000+",
] as const;

// Roles a person can hold when they register a workspace. Whoever signs up
// without an invite is creating the company, so they become the workspace
// admin/owner — this is captured as their job title.
export const HR_ROLES = [
  "Head of HR / CHRO",
  "HR Manager",
  "HR Generalist / Officer",
  "People Operations",
  "Founder / CEO",
  "Operations / Office Manager",
  "IT / System Admin",
  "Other",
] as const;

export const GOALS = [
  "Generate HR documents faster",
  "Learn HR best practices",
  "Connect with other HR pros",
  "Track HR metrics",
  "Stay compliant with labour law",
  "Manage my team better",
  "Earn HR certifications",
  "Build company policies",
] as const;

export const USER_ROLES = [
  "visitor",
  "free",
  "pro",
  "team_admin",
  "team_member",
  "business_admin",
  "business_member",
  "enterprise",
  "moderator",
  "admin",
] as const;

export const COMMUNITY_CATEGORIES = [
  "Recruitment & Hiring",
  "Onboarding",
  "Performance Management",
  "Employee Relations",
  "Compliance & Law",
  "Compensation & Benefits",
  "Culture & Engagement",
  "HR Analytics",
  "Learning & Development",
  "Remote & Hybrid Work",
  "HR Technology",
  "Diversity & Inclusion",
  "General HR",
] as const;

export type CommunityCategory = (typeof COMMUNITY_CATEGORIES)[number];

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Home", icon: "Home" },
  { href: "/copilot", label: "Atlas Copilot", icon: "MessageSquare" },
  { href: "/knowledge", label: "Knowledge Hub", icon: "BookOpen" },
  { href: "/tools", label: "Tools & Generators", icon: "Wrench" },
  { href: "/templates", label: "Templates", icon: "FileText" },
  { href: "/community", label: "Community", icon: "Users" },
  { href: "/learning", label: "Learning", icon: "GraduationCap" },
] as const;
