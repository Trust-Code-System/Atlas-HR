export interface KnowledgeArticle {
  slug: string;
  category: string;
  title: string;
  excerpt: string;
  readingTime: number;
  tags: string[];
  publishedAt: string;
  draft: boolean;
}

export const CATEGORY_LABELS: Record<string, string> = {
  "compensation-reward-and-benefits": "Compensation & Benefits",
  "compliance-and-labour-law": "Compliance & Labour Law",
  "discipline-and-grievance": "Discipline & Grievance",
  "hr-policies-and-employee-handbook": "HR Policies & Handbook",
  "leave-and-attendance": "Leave & Attendance",
  "onboarding-and-induction": "Onboarding & Induction",
  "payroll-administration": "Payroll Administration",
  "performance-management": "Performance Management",
  "recruitment-and-talent-acquisition": "Recruitment & Talent",
};
