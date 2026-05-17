import { NextRequest } from "next/server";
import { getCalculator } from "@/lib/calculators";
import { createClient } from "@/lib/supabase/server";

function titleFor(calculatorName: string) {
  return `${calculatorName} report - ${new Date().toLocaleDateString()}`;
}

export async function POST(req: NextRequest) {
  const { calculatorSlug, inputs, result } = await req.json();
  const calculator = getCalculator(calculatorSlug);

  if (!calculator) {
    return Response.json({ error: "Calculator not found" }, { status: 404 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Sign in to save calculator reports" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("generated_documents")
    .insert({
      user_id: user.id,
      tool_slug: calculator.slug,
      tool_name: calculator.name,
      inputs,
      output: JSON.stringify(result, null, 2),
      title: titleFor(calculator.name),
    })
    .select("id")
    .single();

  if (error) {
    return Response.json({ error: "Could not save report" }, { status: 500 });
  }

  return Response.json({ documentId: data.id });
}
