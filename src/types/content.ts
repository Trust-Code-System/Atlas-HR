export interface Article {
  id: string;
  slug: string;
  title: string;
  category: string;
  country?: string;
  industry?: string;
  content: string;
  excerpt?: string;
  author: string;
  readingTime?: number;
  updatedAt: string;
  publishedAt: string;
  tags?: string[];
  relatedTools?: string[];
  relatedTemplates?: string[];
}

export interface Tool {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  icon: string;
  isPremium?: boolean;
  inputs?: ToolInput[];
}

export interface ToolInput {
  name: string;
  label: string;
  type: "text" | "textarea" | "select" | "tags" | "number";
  options?: { value: string; label: string }[];
  required?: boolean;
  placeholder?: string;
}

export interface Template {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  country?: string;
  industry?: string;
  formats: ("docx" | "pdf" | "gdoc")[];
  isPremium?: boolean;
  previewUrl?: string;
  fileUrl?: string;
}

export interface Course {
  id: string;
  slug: string;
  title: string;
  description: string;
  instructor: string;
  level: "beginner" | "intermediate" | "advanced";
  durationMinutes: number;
  isPremium: boolean;
  category: string;
  thumbnail?: string;
  lessons?: Lesson[];
}

export interface Lesson {
  id: string;
  courseId: string;
  order: number;
  title: string;
  contentType: "video" | "text" | "quiz";
  contentUrl?: string;
  durationSeconds: number;
}

export interface GeneratedDocument {
  id: string;
  userId: string;
  toolSlug: string;
  toolName: string;
  inputs: Record<string, string>;
  output: string;
  createdAt: string;
}
