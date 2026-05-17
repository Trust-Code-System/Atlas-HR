import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { buildTemplateBuffer } from "@/lib/templates/document";
import { getUserWithPlan } from "@/lib/auth/get-user-with-plan";
import { hasFeature } from "@/lib/limits";
import type { TemplateVariables, TemplateVariant } from "@/lib/templates/variables";
import { getCanonicalTemplateSlug, getTemplate, TEMPLATE_VARIABLES } from "@/lib/templates-data";

export const runtime = "nodejs";

const variants = ["global", "us", "uk", "ng", "in"] as const;

const downloadSchema = z.object({
  variant: z.enum(variants).optional(),
  variables: z.record(z.string(), z.string()).optional(),
});

interface RouteContext {
  params: Promise<{ slug: string }>;
}

function safeFilename(value: string) {
  return value.replace(/[^a-z0-9-]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase();
}

function filterVariables(values: Record<string, string> | undefined, allowed: string[]) {
  const allowedSet = new Set(allowed);
  const output: TemplateVariables = {};

  for (const [key, value] of Object.entries(values ?? {})) {
    if (!allowedSet.has(key) || !(key in TEMPLATE_VARIABLES)) continue;
    output[key as keyof TemplateVariables] = value.trim();
  }

  return output;
}

async function downloadTemplate(context: RouteContext, input: unknown) {
  const { slug } = await context.params;
  const template = getTemplate(slug);

  if (!template) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  if (template.isPremium) {
    const { role } = await getUserWithPlan();
    if (!hasFeature(role, "premium_templates")) {
      return NextResponse.json(
        {
          error: "Premium template requires Pro",
          upgrade_url: "/pricing#pro",
        },
        { status: 403 }
      );
    }
  }

  const payload = downloadSchema.safeParse(input);
  if (!payload.success) {
    return NextResponse.json({ error: "Invalid template download payload" }, { status: 400 });
  }

  const allowedVariants = template.variants?.length ? template.variants : (["global"] as TemplateVariant[]);
  const variant = payload.data.variant ?? template.defaultVariant ?? allowedVariants[0];

  if (!allowedVariants.includes(variant)) {
    return NextResponse.json({ error: "Variant is not available for this template" }, { status: 400 });
  }

  const canonicalSlug = getCanonicalTemplateSlug(slug);
  const variables = filterVariables(payload.data.variables, template.variables ?? Object.keys(TEMPLATE_VARIABLES));
  const buffer = await buildTemplateBuffer(canonicalSlug, variables, variant);
  const filename = safeFilename(variant === "global" ? canonicalSlug : `${canonicalSlug}-${variant}`);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${filename}.docx"`,
      "Cache-Control": "no-store",
    },
  });
}

export async function GET(request: NextRequest, context: RouteContext) {
  const variant = request.nextUrl.searchParams.get("variant") ?? undefined;
  return downloadTemplate(context, { variant });
}

export async function POST(request: NextRequest, context: RouteContext) {
  const input = await request.json().catch(() => ({}));
  return downloadTemplate(context, input);
}
