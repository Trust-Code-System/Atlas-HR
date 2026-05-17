export function scoreSalesIntent(input: {
  companySize?: string | null;
  currentTools?: string[] | null;
  biggestChallenge?: string | null;
}) {
  let score = 45;
  const size = input.companySize ?? "";
  const challenge = (input.biggestChallenge ?? "").toLowerCase();
  const tools = input.currentTools ?? [];

  if (/250|500|1000|5000|\+/.test(size)) score += 30;
  else if (/51|100|200/.test(size)) score += 20;
  else if (/11|50/.test(size)) score += 10;

  if (tools.length > 0) score += 5;
  if (/(workday|bamboo|rippling|hibob|seamlesshr|paycom|personio)/i.test(tools.join(" "))) score += 10;
  if (/(compliance|approval|self-service|workflow|audit|report|turnover|onboarding|offboarding|enterprise|sso)/.test(challenge)) score += 15;

  return Math.max(0, Math.min(100, score));
}

export function expectedArrCents(input: { companySize?: string | null; intentScore: number }) {
  const size = input.companySize ?? "";
  if (/5000|1000/.test(size)) return 250_000_00;
  if (/501|500/.test(size)) return 100_000_00;
  if (/251|250/.test(size)) return 60_000_00;
  if (/51|200|250/.test(size)) return 20_000_00;
  if (/11|50/.test(size)) return 8_000_00;
  return input.intentScore >= 70 ? 6_000_00 : 2_500_00;
}
