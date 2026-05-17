export type CustomerStoryLaunchAsset = {
  icon: string;
  label: string;
};

export type CustomerStory = {
  slug: string;
  persona: string;
  companyType: string;
  location: string;
  headline: string;
  summary: string;
  quote: string;
  name: string;
  role: string;
  company: string;
  initials: string;
  outcome: string;
  metrics: { label: string; value: string }[];
  problem: string;
  solution: string;
  results: string[];
  /** Uppercase badge above headline (e.g. stitch “SOLO HR PRO”) */
  personaBadge?: string;
  heroImage?: { src: string; alt: string };
  /** Large pull quote in primary aside card */
  featuredQuote?: string;
  /** Bulleted list under “How Atlas Helped” after the solution paragraph */
  howAtlasBullets?: string[];
  /** Italic quote inside the Outcome callout */
  outcomeTestimonial?: string;
  outcomeBadgeLabel?: string;
  launchAssets?: CustomerStoryLaunchAsset[];
  productCta?: { href: string; label: string };
};

export const CUSTOMER_STORIES: CustomerStory[] = [
  {
    slug: "solo-hr-manager",
    persona: "Solo HR pro",
    companyType: "HR Director @ Zenith Logistics",
    location: "United Kingdom",
    headline: "A solo HR manager turns scattered policy work into one repeatable workflow.",
    summary:
      "How a solo HR leader at Zenith Logistics replaced scattered compliance work with one repeatable Atlas HR workflow across regions.",
    quote:
      "Atlas HR gave me back the 15 hours a week I was losing to administrative compliance. It’s like having a dedicated legal team in my pocket.",
    name: "Hannah Mitchell",
    role: "HR Director",
    company: "Zenith Logistics",
    initials: "HM",
    outcome: "Strategic HR leadership with fewer manual compliance hours.",
    personaBadge: "SOLO HR PRO",
    heroImage: {
      src: "https://lh3.googleusercontent.com/aida-public/AB6AXuDM0xNxMNxPKOf4clg9Mwz1jdhL0UD4vVNxu1RATgVFiMxmdpB56eSIQUuku2HJhnyzFaVLs22tM0ZUYAPTnSjJH2K_IXirghdmX85FWRjlYlvw1Doq63YQXpA4DQDhFJOr-HGQZpmcylRO2Umpxzg2_TggzqxpR0bO7zH6lm0oqLtFTGh_iVqgbgVrJhkKUhM8xC4kMpiemEzITDUvlnBeN37FxtTjLUCbpUAztvWtLoIQlw7XxAXFBIFIFtCm7nPsI-vQMeEUC-8",
      alt: "A wide-angle professional photograph of a modern, airy office environment with high ceilings and floor-to-ceiling windows. The scene is illuminated by natural soft daylight, showcasing a clean and organized workspace with ergonomic furniture. The overall aesthetic is one of calm corporate modernism, using a palette of soft grays, whites, and subtle indigo accents to match the enterprise HR theme.",
    },
    featuredQuote:
      "Atlas HR gave me back the 15 hours a week I was losing to administrative compliance. It’s like having a dedicated legal team in my pocket.",
    howAtlasBullets: [
      "Automated policy updates synchronized with local regulatory shifts.",
      "Universal document templates that maintain brand consistency while ensuring legal rigor.",
      "One-click distribution to global teams via the integrated Community portal.",
    ],
    outcomeTestimonial:
      "The difference is night and day. I've moved from being a document clerk to a strategic HR leader. Atlas doesn't just store my files; it thinks ahead for me.",
    outcomeBadgeLabel: "CERTIFIED IMPACT STORY",
    launchAssets: [
      { icon: "description", label: "Compliance Engine v2.1" },
      { icon: "draw", label: "Smart Contract Drafter" },
      { icon: "groups", label: "Employee Self-Service Portal" },
      { icon: "analytics", label: "Global Reporting Dashboard" },
    ],
    productCta: { href: "/pricing", label: "View Product Details" },
    metrics: [
      { label: "Documents drafted", value: "124" },
      { label: "Tools used", value: "08" },
      { label: "Time saved", value: "30h" },
    ],
    problem:
      "At Zenith Logistics, Hannah found herself buried under a mountain of localized compliance documents. As the sole HR practitioner for 150 employees across three regions, she was manually updating handbooks, drafting offer letters from scratch, and tracking policy changes in spreadsheets. The risk of error was high, and the time commitment was unsustainable for a single-person department.",
    solution:
      "Atlas HR introduced a centralized intelligence layer that automated the heavy lifting of compliance. By connecting Zenith's existing employee data to Atlas's global knowledge base, Hannah was able to generate region-specific documents in seconds.",
    results: [
      "Built a cleaner first draft for common employee-relations documents.",
      "Used country guides to sanity-check leave and termination policy language.",
      "Saved the most reused templates into a library for repeat work.",
    ],
  },
  {
    slug: "nigerian-people-lead",
    persona: "Global-south HR team",
    companyType: "120-person technology company",
    location: "Nigeria",
    headline: "A Nigerian people lead gets HR guidance that reflects local operating reality.",
    summary:
      "Draft placeholder for a beta customer story focused on Atlas HR's global and Nigerian launch angle.",
    quote:
      "Most HR tools assume we operate in the US. Atlas starts from the countries where my team actually works.",
    name: "Beta user placeholder",
    role: "People Lead",
    company: "Lagos technology company",
    initials: "NG",
    outcome: "Better local HR confidence for a fast-growing team.",
    metrics: [
      { label: "Country guides used", value: "4" },
      { label: "Templates downloaded", value: "9" },
      { label: "Manager questions answered", value: "18" },
    ],
    problem:
      "The team needed practical guidance for Nigerian HR operations while also supporting remote employees in other markets. Generic US-first tools left too many local questions unanswered.",
    solution:
      "Atlas provided Nigeria-focused guidance, employment templates, and Copilot prompts that helped the people lead prepare clearer answers for managers and founders.",
    results: [
      "Reviewed leave, payroll, and termination guidance from one workspace.",
      "Created reusable onboarding and policy documents for managers.",
      "Identified which country-specific issues still needed local counsel.",
    ],
  },
  {
    slug: "mid-market-hrbp",
    persona: "Mid-market HRBP",
    companyType: "400-person multi-country company",
    location: "India and Southeast Asia",
    headline: "An HR business partner standardizes manager support across several countries.",
    summary:
      "Draft placeholder for a mid-market customer story. Replace with real beta data and permissioned brand assets.",
    quote:
      "The value is not just document generation. It is having the context, templates, and next steps together.",
    name: "Beta user placeholder",
    role: "HR Business Partner",
    company: "Regional operations company",
    initials: "BP",
    outcome: "More consistent manager guidance across markets.",
    metrics: [
      { label: "Countries referenced", value: "6" },
      { label: "Copilot chats", value: "24" },
      { label: "Templates shared", value: "14" },
    ],
    problem:
      "Managers across regions asked similar HR questions but received inconsistent answers depending on who was available and which old template was copied.",
    solution:
      "Atlas gave the HRBP a common starting point for manager guidance, document generation, and knowledge articles, while still making country-specific review visible.",
    results: [
      "Created a common manager-support workflow for recurring questions.",
      "Used templates as the base for policy and employee-relations work.",
      "Built a shortlist of content gaps to feed back into the beta program.",
    ],
  },
];

export function getCustomerStory(slug: string) {
  return CUSTOMER_STORIES.find((story) => story.slug === slug) ?? null;
}
