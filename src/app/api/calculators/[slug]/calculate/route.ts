import { getCalculator } from "@/lib/calculators";

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const calculator = getCalculator(slug);

  if (!calculator) {
    return Response.json({ error: "Calculator not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = calculator.schema.safeParse(body.inputs ?? {});

  if (!parsed.success) {
    return Response.json(
      {
        error: "Invalid calculator inputs",
        details: parsed.error.issues.map((issue) => issue.message),
      },
      { status: 400 },
    );
  }

  return Response.json({
    result: calculator.compute(parsed.data),
  });
}
