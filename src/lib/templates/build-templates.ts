import fs from "fs/promises";
import path from "path";
import sharp from "sharp";
import { Packer } from "docx";
import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";
import { TEMPLATES } from "../templates-data";
import { getTemplateBuilder } from "./registry";
import type { TemplateVariant } from "./variables";

loadEnvConfig(process.cwd());

const outputRoot = path.join(process.cwd(), "public", "templates", "generated");
const previewRoot = path.join(process.cwd(), "public", "templates", "previews");

const sampleVariables = {
  COMPANY_NAME: "Atlas HR Demo Company",
  COMPANY_ADDRESS: "123 People Operations Way",
  EMPLOYEE_NAME: "Amina Okafor",
  EMPLOYEE_TITLE: "People Operations Manager",
  EMPLOYEE_START_DATE: "2026-06-01",
  EMPLOYEE_END_DATE: "2026-12-31",
  MANAGER_NAME: "Jordan Lee",
  HR_CONTACT: "people@example.com",
  SALARY: "75000",
  CURRENCY: "USD",
  COUNTRY: "United States",
  EFFECTIVE_DATE: "2026-06-01",
  NOTICE_PERIOD: "30 days",
  TODAY: new Date().toISOString().slice(0, 10),
};

function fileName(slug: string, variant: TemplateVariant) {
  return variant === "global" ? `${slug}.docx` : `${slug}-${variant}.docx`;
}

function previewSvg(templateName: string, category: string) {
  const safeName = templateName.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const safeCategory = category.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  return `
  <svg width="900" height="1200" viewBox="0 0 900 1200" xmlns="http://www.w3.org/2000/svg">
    <rect width="900" height="1200" fill="#f8fafc"/>
    <rect x="90" y="90" width="720" height="1020" rx="18" fill="#ffffff" stroke="#dbe3ef" stroke-width="2"/>
    <rect x="130" y="145" width="150" height="34" rx="8" fill="#ede9fe"/>
    <text x="145" y="168" font-family="Arial" font-size="16" font-weight="700" fill="#6d28d9">ATLAS HR</text>
    <text x="130" y="260" font-family="Arial" font-size="42" font-weight="700" fill="#111827">${safeName}</text>
    <text x="130" y="310" font-family="Arial" font-size="22" fill="#64748b">${safeCategory} template</text>
    <line x1="130" y1="370" x2="770" y2="370" stroke="#dbe3ef" stroke-width="2"/>
    <rect x="130" y="430" width="640" height="34" rx="6" fill="#eef2ff"/>
    <rect x="130" y="500" width="560" height="18" rx="4" fill="#cbd5e1"/>
    <rect x="130" y="540" width="600" height="18" rx="4" fill="#cbd5e1"/>
    <rect x="130" y="580" width="520" height="18" rx="4" fill="#cbd5e1"/>
    <rect x="130" y="660" width="640" height="2" fill="#e2e8f0"/>
    <rect x="130" y="710" width="290" height="90" rx="8" fill="#f1f5f9"/>
    <rect x="480" y="710" width="290" height="90" rx="8" fill="#f1f5f9"/>
    <rect x="130" y="850" width="640" height="2" fill="#e2e8f0"/>
    <rect x="130" y="905" width="230" height="18" rx="4" fill="#cbd5e1"/>
    <rect x="130" y="945" width="420" height="18" rx="4" fill="#cbd5e1"/>
    <text x="130" y="1040" font-family="Arial" font-size="16" fill="#94a3b8">Generated preview - first page layout</text>
  </svg>`;
}

async function writePreview(slug: string, name: string, category: string) {
  const output = path.join(previewRoot, `${slug}.png`);
  await sharp(Buffer.from(previewSvg(name, category))).png().toFile(output);
  return output;
}

function contentTypeFor(filePath: string) {
  if (filePath.endsWith(".docx")) {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  if (filePath.endsWith(".png")) return "image/png";
  return "application/json";
}

function storagePath(filePath: string) {
  const relative = path.relative(path.join(process.cwd(), "public", "templates"), filePath);
  return relative.replace(/\\/g, "/");
}

async function uploadToSupabase(files: string[]) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for template upload.");
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  for (const filePath of files) {
    const fileBuffer = await fs.readFile(filePath);
    const destination = storagePath(filePath);
    const { error } = await supabase.storage.from("templates").upload(destination, fileBuffer, {
      contentType: contentTypeFor(filePath),
      upsert: true,
    });

    if (error) throw new Error(`Failed to upload ${destination}: ${error.message}`);
  }

  const records = TEMPLATES.flatMap((template) => {
    const variants = template.variants?.length ? template.variants : (["global"] as TemplateVariant[]);
    return variants.map((variant) => ({
      slug: template.slug,
      variant,
      docx_path: storagePath(path.join(outputRoot, fileName(template.slug, variant))),
      preview_image_path: storagePath(path.join(previewRoot, `${template.slug}.png`)),
      docx_url: `/storage/v1/object/public/templates/${storagePath(path.join(outputRoot, fileName(template.slug, variant)))}`,
      preview_image_url: `/storage/v1/object/public/templates/${storagePath(path.join(previewRoot, `${template.slug}.png`))}`,
      metadata: {
        name: template.name,
        category: template.category,
        variables: template.variables ?? [],
      },
      generated_at: new Date().toISOString(),
    }));
  });

  const { error } = await supabase.from("template_assets").upsert(records, {
    onConflict: "slug,variant",
  });

  if (error) throw new Error(`Failed to upsert template assets: ${error.message}`);
}

export async function buildTemplates() {
  await fs.mkdir(outputRoot, { recursive: true });
  await fs.mkdir(previewRoot, { recursive: true });

  const generated: string[] = [];
  const previews: string[] = [];

  for (const template of TEMPLATES) {
    const builder = getTemplateBuilder(template.slug);
    if (!builder) throw new Error(`Missing builder for ${template.slug}`);

    const variants = template.variants?.length ? template.variants : (["global"] as TemplateVariant[]);
    for (const variant of variants) {
      const document = builder(sampleVariables, variant);
      const buffer = await Packer.toBuffer(document);
      const output = path.join(outputRoot, fileName(template.slug, variant));
      await fs.writeFile(output, buffer);
      generated.push(output);
    }

    previews.push(await writePreview(template.slug, template.name, template.category));
  }

  const manifestPath = path.join(outputRoot, "manifest.json");
  await fs.writeFile(
    manifestPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        templates: TEMPLATES.map((template) => ({
          slug: template.slug,
          variants: template.variants?.length ? template.variants : ["global"],
          previewImageUrl: `/templates/previews/${template.slug}.png`,
        })),
      },
      null,
      2
    )
  );

  if (process.argv.includes("--upload")) {
    await uploadToSupabase([...generated, ...previews, manifestPath]);
  }

  return generated;
}

if (process.argv[1]?.endsWith("build-templates.ts")) {
  buildTemplates()
    .then((files) => {
      const uploadText = process.argv.includes("--upload") ? " Uploaded assets to Supabase Storage." : "";
      console.log(`Generated ${files.length} DOCX files and ${TEMPLATES.length} PNG previews.${uploadText}`);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
