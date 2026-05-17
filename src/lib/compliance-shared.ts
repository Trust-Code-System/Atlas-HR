export type ComplianceUpdate = {
  id: string;
  country: string;
  countrySlug: string;
  title: string;
  date: string;
  status: "Monitoring" | "Action needed" | "Review recommended" | "Critical";
  severity: "critical" | "action_needed" | "review_recommended" | "monitoring";
  whatChanged: string;
  whoIsAffected: string;
  whatToDoNext: string[];
  linkedTemplates: string[];
  linkedArticles: string[];
  publishedBy: string;
  publishedAt: string;
  adminStatus: "draft" | "review" | "published" | "archived";
};

export const SEVERITY_LABELS: Record<ComplianceUpdate["severity"], string> = {
  critical: "Critical",
  action_needed: "Action needed",
  review_recommended: "Review recommended",
  monitoring: "Monitoring",
};

export const SEVERITY_STYLES: Record<ComplianceUpdate["severity"], string> = {
  critical: "bg-red-100 text-red-700 border-red-200",
  action_needed: "bg-amber-100 text-amber-700 border-amber-200",
  review_recommended: "bg-blue-100 text-blue-700 border-blue-200",
  monitoring: "bg-slate-100 text-slate-600 border-slate-200",
};

export const ADMIN_STATUS_LABELS: Record<ComplianceUpdate["adminStatus"], string> = {
  draft: "Draft",
  review: "Under Review",
  published: "Published",
  archived: "Archived",
};

export const COUNTRY_SLUGS: Record<string, string> = {
  Nigeria: "nigeria",
  India: "india",
  "United Kingdom": "uk",
  "United States": "us",
};
