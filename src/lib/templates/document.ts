import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  HeadingLevel,
  Packer,
  PageBreak,
  PageNumber,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import { getTemplateSpec, type TemplateSection, type TemplateSpec } from "./content";
import { fill, type TemplateVariables, type TemplateVariant, variantLabel } from "./variables";

// ─── Border presets ────────────────────────────────────────────────────────────

const border = {
  style: BorderStyle.SINGLE,
  size: 2,
  color: "E2E8F0",
};

const borderMid = {
  style: BorderStyle.SINGLE,
  size: 4,
  color: "CBD5E1",
};

const noBorder = {
  style: BorderStyle.SINGLE,
  size: 0,
  color: "FFFFFF",
};

// ─── Brand palette ─────────────────────────────────────────────────────────────

const brand = {
  // Blues
  navy:      "0F172A",
  navyMid:   "1E293B",
  blue:      "2563EB",
  blueDark:  "1D4ED8",
  blueSoft:  "EFF6FF",
  blueMid:   "DBEAFE",
  // Neutrals
  slate:     "475569",
  slateMid:  "64748B",
  slateLight:"F8FAFC",
  slateXL:   "F1F5F9",
  border:    "E2E8F0",
  white:     "FFFFFF",
  // Amber (warnings / required)
  amberSoft: "FFFBEB",
  amber:     "92400E",
  amberBdr:  "FCD34D",
  // Rose (strict requirements)
  roseSoft:  "FFF1F2",
  rose:      "9F1239",
  // Emerald (recommended / positive)
  emeraldSoft:"ECFDF5",
  emerald:   "065F46",
};

// ─── Text helpers ──────────────────────────────────────────────────────────────

function text(
  value: string,
  variables: TemplateVariables,
  options?: {
    bold?: boolean;
    italics?: boolean;
    size?: number;
    color?: string;
    allCaps?: boolean;
    underline?: boolean;
  }
) {
  return new TextRun({
    text: options?.allCaps ? fill(value, variables).toUpperCase() : fill(value, variables),
    bold: options?.bold,
    italics: options?.italics,
    size: options?.size ?? 22,
    color: options?.color ?? brand.navy,
    font: "Aptos",
    underline: options?.underline ? {} : undefined,
  });
}

function para(
  value: string,
  variables: TemplateVariables,
  options?: {
    spacingAfter?: number;
    spacingBefore?: number;
    bold?: boolean;
    italics?: boolean;
    color?: string;
    size?: number;
    alignment?: (typeof AlignmentType)[keyof typeof AlignmentType];
  }
) {
  return new Paragraph({
    children: [text(value, variables, options)],
    alignment: options?.alignment,
    spacing: { before: options?.spacingBefore ?? 0, after: options?.spacingAfter ?? 180 },
  });
}

function bullets(items: string[], variables: TemplateVariables) {
  return items.map(
    (item) =>
      new Paragraph({
        children: [text(item, variables, { color: brand.slate })],
        bullet: { level: 0 },
        spacing: { before: 40, after: 120 },
      })
  );
}

// ─── Cell helpers ──────────────────────────────────────────────────────────────

/** Standard data-table cell */
function cell(value: string, variables: TemplateVariables, header = false) {
  return new TableCell({
    borders: { top: border, bottom: border, left: border, right: border },
    shading: header
      ? { type: ShadingType.CLEAR, fill: brand.blueSoft }
      : undefined,
    margins: { top: 140, bottom: 140, left: 180, right: 180 },
    children: [
      new Paragraph({
        children: [
          text(value, variables, {
            bold: header,
            color: header ? brand.blueDark : brand.slate,
            size: header ? 20 : 20,
          }),
        ],
        spacing: { after: 0 },
      }),
    ],
  });
}

/** Status cell — colours Required / Recommended automatically */
function statusCell(value: string, variables: TemplateVariables) {
  const lower = value.toLowerCase();
  const isRequired    = lower === "required";
  const isRecommended = lower === "recommended";
  const color     = isRequired ? brand.rose : isRecommended ? brand.emerald : brand.slate;
  const fillColor = isRequired ? brand.roseSoft : isRecommended ? brand.emeraldSoft : brand.white;
  return new TableCell({
    borders: { top: border, bottom: border, left: borderMid, right: border },
    shading: { type: ShadingType.CLEAR, fill: fillColor },
    margins: { top: 140, bottom: 140, left: 180, right: 180 },
    children: [
      new Paragraph({
        children: [text(value, variables, { bold: true, color, size: 19 })],
        spacing: { after: 0 },
      }),
    ],
  });
}

/** Card cell — large padded container */
function cardCell(
  children: (Paragraph | Table)[],
  fillColor = brand.white,
  borders = border,
  accentLeft?: string
) {
  const leftBorder = accentLeft
    ? { style: BorderStyle.SINGLE, size: 20, color: accentLeft }
    : borders;
  return new TableCell({
    borders: {
      top: borders,
      bottom: borders,
      right: borders,
      left: leftBorder,
    },
    shading: { type: ShadingType.CLEAR, fill: fillColor },
    margins: { top: 240, bottom: 240, left: 280, right: 280 },
    children,
  });
}

/** Label + value pair (metadata rows) */
function labelValue(label: string, value: string, variables: TemplateVariables) {
  return new Paragraph({
    spacing: { after: 80 },
    children: [
      text(`${label}  `, variables, {
        bold: true,
        color: brand.slateMid,
        size: 17,
        allCaps: true,
      }),
      text(value, variables, { color: brand.navy, size: 21 }),
    ],
  });
}

// ─── Structural helpers ────────────────────────────────────────────────────────

function divider() {
  return new Paragraph({
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 16, color: brand.blue },
    },
    spacing: { before: 160, after: 280 },
    children: [],
  });
}

function spacer(points = 200) {
  return new Paragraph({ spacing: { after: points }, children: [] });
}

function table(section: NonNullable<TemplateSection["table"]>, variables: TemplateVariables) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: section.headers.map((h) => cell(h, variables, true)) }),
      ...section.rows.map(
        (row) =>
          new TableRow({
            children: row.map((value, colIdx) =>
              colIdx === section.headers.length - 1 &&
              (value.toLowerCase() === "required" || value.toLowerCase() === "recommended")
                ? statusCell(value, variables)
                : cell(value, variables)
            ),
          })
      ),
    ],
  });
}

// ─── Section renderer ──────────────────────────────────────────────────────────

function renderSection(section: TemplateSection, variables: TemplateVariables) {
  const children: (Paragraph | Table)[] = [
    // Heading with left accent bar + bottom rule
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 400, after: 60 },
      border: {
        left: { style: BorderStyle.SINGLE, size: 24, color: brand.blue },
      },
      indent: { left: 200 },
      children: [
        text(section.heading, variables, { bold: true, size: 30, color: brand.navy }),
      ],
    }),
    // Thin coloured rule under heading
    new Paragraph({
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 4, color: brand.blueMid },
      },
      spacing: { before: 0, after: 200 },
      children: [],
    }),
  ];

  if (section.paragraphs) {
    children.push(
      ...section.paragraphs.map((p) =>
        para(p, variables, { color: brand.slate, size: 22, spacingAfter: 180 })
      )
    );
  }

  if (section.bullets) {
    children.push(...bullets(section.bullets, variables));
    children.push(spacer(80));
  }

  if (section.table) {
    children.push(table(section.table, variables));
    children.push(spacer(120));
  }

  return children;
}

// ─── Title page ────────────────────────────────────────────────────────────────

function titlePage(spec: TemplateSpec, variables: TemplateVariables, variant: TemplateVariant) {
  return [
    // ── Blue brand banner ────────────────────────────────────────────────────
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          height: { value: 700, rule: "exact" as const },
          children: [
            cardCell(
              [
                new Paragraph({
                  spacing: { after: 60 },
                  children: [
                    text("Atlas", variables, { bold: true, size: 28, color: "FFFFFF" }),
                    text(" HR", variables, { bold: true, size: 28, color: "BFDBFE" }),
                  ],
                }),
                new Paragraph({
                  spacing: { after: 0 },
                  children: [
                    text("Professional HR Template", variables, { size: 19, color: "93C5FD" }),
                  ],
                }),
              ],
              brand.blue,
              noBorder
            ),
          ],
        }),
      ],
    }),

    // ── Narrow navy accent strip under banner ────────────────────────────────
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          height: { value: 80, rule: "exact" as const },
          children: [
            new TableCell({
              borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
              shading: { type: ShadingType.CLEAR, fill: brand.navyMid },
              margins: { top: 0, bottom: 0, left: 0, right: 0 },
              children: [new Paragraph({ children: [], spacing: { after: 0 } })],
            }),
          ],
        }),
      ],
    }),

    spacer(400),

    // ── Document title ───────────────────────────────────────────────────────
    new Paragraph({
      alignment: AlignmentType.LEFT,
      heading: HeadingLevel.TITLE,
      spacing: { before: 0, after: 80 },
      children: [text(spec.title, variables, { bold: true, size: 52, color: brand.navy })],
    }),
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { after: 0 },
      children: [
        text(`${spec.category} template`, variables, { size: 24, color: brand.slateMid }),
      ],
    }),

    divider(),

    // ── Tagline ──────────────────────────────────────────────────────────────
    para(
      "Built for HR teams that need clean, editable documents with country-aware guidance and review prompts.",
      variables,
      { size: 22, color: brand.slate, spacingAfter: 320 }
    ),

    // ── Metadata card (two columns) ──────────────────────────────────────────
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            // Left — document properties (blue left accent)
            cardCell(
              [
                labelValue("Variant", variantLabel(variant), variables),
                labelValue("Format", "DOCX", variables),
                labelValue("Version", spec.version ?? "1.0", variables),
              ],
              brand.white,
              border,
              brand.blue
            ),
            // Right — company placeholders (slate left accent)
            cardCell(
              [
                labelValue("Company", "{{COMPANY_NAME}}", variables),
                labelValue("Owner", "{{HR_CONTACT}}", variables),
                labelValue("Effective date", "{{EFFECTIVE_DATE}}", variables),
              ],
              brand.slateXL,
              border,
              brand.slateMid
            ),
          ],
        }),
      ],
    }),

    spacer(300),

    // ── Pre-issue checklist ──────────────────────────────────────────────────
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            cell("Before you issue", variables, true),
            cell("Status", variables, true),
          ],
        }),
        ...[
          ["Replace every placeholder in square brackets or braces.", "Required"],
          ["Check local employment law and internal approval rules.", "Required"],
          ["Remove guidance notes that should not go to employees.", "Required"],
          ["Save the final signed copy in the employee record.", "Recommended"],
        ].map(
          ([task, status]) =>
            new TableRow({
              children: [
                cell(task, variables),
                statusCell(status, variables),
              ],
            })
        ),
      ],
    }),

    spacer(300),

    // ── Legal review note ─────────────────────────────────────────────────────
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            cardCell(
              [
                new Paragraph({
                  spacing: { after: 100 },
                  children: [
                    text("⚠  Legal review note", variables, {
                      bold: true,
                      color: brand.amber,
                      size: 21,
                    }),
                  ],
                }),
                new Paragraph({
                  spacing: { after: 0 },
                  children: [
                    text(
                      "This template is a practical starting point, not legal advice. Review sensitive clauses with qualified local counsel before use.",
                      variables,
                      { color: brand.slate, size: 20 }
                    ),
                  ],
                }),
              ],
              brand.amberSoft,
              border,
              brand.amberBdr
            ),
          ],
        }),
      ],
    }),

    new Paragraph({ children: [new PageBreak()] }),
  ];
}

// ─── Document builder ──────────────────────────────────────────────────────────

export function buildTemplateDocument(
  spec: TemplateSpec,
  variables: TemplateVariables = {},
  variant: TemplateVariant = "global"
) {
  const children = [
    ...titlePage(spec, variables, variant),
    ...spec.sections
      .filter((s) => !s.variants || s.variants.includes(variant))
      .flatMap((s) => renderSection(s, variables)),
  ];

  return new Document({
    creator: "Atlas HR",
    title: spec.title,
    description: `${spec.title} generated by Atlas HR`,
    styles: {
      paragraphStyles: [
        {
          id: "Title",
          name: "Title",
          run: { font: "Aptos", size: 52, bold: true, color: brand.navy },
          paragraph: { spacing: { after: 200 } },
        },
        {
          id: "Heading2",
          name: "Heading 2",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { font: "Aptos", size: 30, bold: true, color: brand.navy },
          paragraph: { spacing: { before: 360, after: 100 } },
        },
        {
          id: "Normal",
          name: "Normal",
          run: { font: "Aptos", size: 22, color: brand.slate },
          paragraph: { spacing: { after: 180 } },
        },
      ],
    },
    sections: [
      {
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                border: {
                  bottom: { style: BorderStyle.SINGLE, size: 4, color: brand.blueMid },
                },
                spacing: { after: 100 },
                children: [
                  text("Atlas HR", variables, { bold: true, size: 18, color: brand.blue }),
                  text(`  |  ${spec.title}`, variables, { size: 18, color: brand.slateMid }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                border: {
                  top: { style: BorderStyle.SINGLE, size: 4, color: brand.border },
                },
                spacing: { before: 100 },
                children: [
                  new TextRun({
                    children: ["Atlas HR  ·  Page ", PageNumber.CURRENT, " of ", PageNumber.TOTAL_PAGES],
                    color: brand.slateMid,
                    size: 18,
                    font: "Aptos",
                  }),
                ],
              }),
            ],
          }),
        },
        properties: {
          page: {
            margin: { top: 900, right: 1000, bottom: 900, left: 1000 },
          },
        },
        children,
      },
    ],
  });
}

export async function buildTemplateBuffer(
  slug: string,
  variables: TemplateVariables = {},
  variant: TemplateVariant = "global"
) {
  const spec = getTemplateSpec(slug);
  if (!spec) throw new Error(`Unknown template spec: ${slug}`);
  const document = buildTemplateDocument(spec, variables, variant);
  return Packer.toBuffer(document);
}
