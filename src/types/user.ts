export type UserRole =
  | "visitor"
  | "free"
  | "pro"
  | "team_admin"
  | "team_member"
  | "business_admin"
  | "business_member"
  | "enterprise"
  | "moderator"
  | "admin";

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  bio?: string;
  role: UserRole;
  country?: string;
  companySize?: string;
  industry?: string;
  isVerified?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Organisation {
  id: string;
  name: string;
  plan: "free" | "pro" | "team" | "business" | "enterprise";
  ownerId: string;
  memberCount: number;
  employeeCount: number;
  industry?: string;
  country?: string;
  createdAt: string;
}
