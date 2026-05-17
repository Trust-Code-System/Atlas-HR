export interface ReviewerProfile {
  name: string;
  credentials: string;
  role: string;
  bio: string;
  initials: string;
  color: string;
  specialisms: string[];
}

export const REVIEWER_PROFILES: Record<string, ReviewerProfile> = {
  "Atlas HR Editorial Team": {
    name: "Atlas HR Editorial Team",
    credentials: "CIPD | SHRM | CIPM",
    role: "Editorial Team",
    bio: "The Atlas HR editorial team comprises qualified HR practitioners with expertise across employment law, payroll, compliance, and people operations in Nigeria, India, the United Kingdom, and the United States.",
    initials: "AH",
    color: "bg-blue-600",
    specialisms: ["Global HR", "Compliance", "Editorial standards"],
  },
  "Adaeze Okafor": {
    name: "Adaeze Okafor",
    credentials: "CIPM, ACIPM",
    role: "Senior HR Specialist — West Africa",
    bio: "Adaeze is a Chartered HR practitioner with 12 years of experience in Nigerian employment law, PAYE compliance, pension regulation, and labour relations. She specialises in multi-state payroll and contract structuring for SMEs.",
    initials: "AO",
    color: "bg-emerald-600",
    specialisms: ["Nigeria labour law", "PAYE & pension", "Contracts"],
  },
  "Priya Nair": {
    name: "Priya Nair",
    credentials: "SHRM-CP, MBA (HR)",
    role: "Senior HR Specialist — South Asia",
    bio: "Priya brings 10 years of experience across India's multi-state employment landscape, covering Shops and Establishments compliance, PF and ESI administration, maternity benefits, and labour code transition planning.",
    initials: "PN",
    color: "bg-violet-600",
    specialisms: ["India state compliance", "PF & ESI", "Labour codes"],
  },
  "James Whitmore": {
    name: "James Whitmore",
    credentials: "MCIPD",
    role: "Senior HR Specialist — UK & Europe",
    bio: "James is a chartered member of the CIPD with 14 years advising UK employers on employment particulars, fair dismissal procedure, redundancy, TUPE, working time, and tribunal risk reduction.",
    initials: "JW",
    color: "bg-sky-600",
    specialisms: ["UK employment law", "Fair dismissal", "Redundancy & TUPE"],
  },
  "Sarah Chen": {
    name: "Sarah Chen",
    credentials: "SPHR, JD",
    role: "Senior HR Specialist — North America",
    bio: "Sarah combines HR leadership and legal training to advise US employers on at-will employment nuances, multi-state compliance, FMLA, ADA, WARN Act obligations, and final-pay requirements across jurisdictions.",
    initials: "SC",
    color: "bg-rose-600",
    specialisms: ["US multi-state law", "FMLA & ADA", "Final-pay compliance"],
  },
};

export function getReviewerProfile(name: string): ReviewerProfile {
  return REVIEWER_PROFILES[name] ?? REVIEWER_PROFILES["Atlas HR Editorial Team"];
}

export const COUNTRY_FLAG_MAP: Record<string, string> = {
  global: "🌍",
  nigeria: "🇳🇬",
  india: "🇮🇳",
  uk: "🇬🇧",
  "united kingdom": "🇬🇧",
  us: "🇺🇸",
  "united states": "🇺🇸",
};

export const COUNTRY_LABEL_MAP: Record<string, string> = {
  global: "Global",
  nigeria: "Nigeria",
  india: "India",
  uk: "United Kingdom",
  "united kingdom": "United Kingdom",
  us: "United States",
  "united states": "United States",
};

export const LEGAL_REVIEW_CATEGORIES = new Set([
  "compliance-and-labour-law",
  "discipline-and-grievance",
  "payroll-administration",
]);

export const LEGAL_REVIEW_TEMPLATE_CATEGORIES = new Set([
  "Contracts",
  "Offboarding",
  "Discipline",
  "Payroll",
]);
