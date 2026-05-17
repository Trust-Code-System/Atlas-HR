import { z } from "zod";

export type CalculatorSlug =
  | "turnover-rate"
  | "cost-per-hire"
  | "time-to-hire"
  | "headcount-planner"
  | "absenteeism-rate"
  | "salary-benchmark"
  | "pay-equity"
  | "hr-dashboard";

export interface FieldOption {
  value: string;
  label: string;
}

export interface TableColumn {
  key: string;
  label: string;
  type: "text" | "number" | "date" | "select";
  options?: FieldOption[];
  placeholder?: string;
}

export type CalculatorField =
  | {
      kind: "text" | "number" | "date" | "textarea";
      name: string;
      label: string;
      placeholder?: string;
      min?: number;
      step?: number;
    }
  | {
      kind: "select";
      name: string;
      label: string;
      options: FieldOption[];
    }
  | {
      kind: "table";
      name: string;
      label: string;
      columns: TableColumn[];
      addLabel: string;
    }
  | {
      kind: "csv";
      name: string;
      label: string;
      helper: string;
    };

export interface CalculatorConfig<I = unknown, R = unknown> {
  slug: CalculatorSlug;
  name: string;
  description: string;
  category: string;
  schema: z.ZodType<I>;
  defaultInputs: I;
  fields: CalculatorField[];
  compute: (inputs: I) => R;
}

const numberInput = z.coerce.number().finite().default(0);
const positiveNumberInput = z.coerce.number().finite().nonnegative().default(0);
const optionalText = z.string().optional().default("");

export function round(value: number, decimals = 1) {
  if (!Number.isFinite(value)) return 0;
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function safeDivide(numerator: number, denominator: number) {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) return 0;
  return numerator / denominator;
}

export function sum(values: number[]) {
  return values.reduce((total, value) => total + (Number.isFinite(value) ? value : 0), 0);
}

export function mean(values: number[]) {
  const clean = values.filter(Number.isFinite);
  return clean.length ? sum(clean) / clean.length : 0;
}

export function median(values: number[]) {
  const clean = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!clean.length) return 0;
  const middle = Math.floor(clean.length / 2);
  return clean.length % 2 ? clean[middle] : (clean[middle - 1] + clean[middle]) / 2;
}

export function percentile(values: number[], p: number) {
  const clean = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!clean.length) return 0;
  if (clean.length === 1) return clean[0];
  const index = (p / 100) * (clean.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return clean[lower];
  return clean[lower] + (clean[upper] - clean[lower]) * (index - lower);
}

function daysBetween(start: string, end: string) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return 0;
  return Math.max(0, Math.round((endDate.getTime() - startDate.getTime()) / 86_400_000));
}

function monthsAgo(months: number) {
  const date = new Date();
  date.setDate(1);
  date.setMonth(date.getMonth() - months);
  return date;
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

const departmentTurnoverSchema = z.object({
  department: z.string().default("Department"),
  startingHeadcount: positiveNumberInput,
  endingHeadcount: positiveNumberInput,
  voluntaryLeavers: positiveNumberInput,
  involuntaryLeavers: positiveNumberInput,
});

export const turnoverInputSchema = z.object({
  period: z.enum(["year", "quarter", "custom"]).default("year"),
  startingHeadcount: positiveNumberInput,
  endingHeadcount: positiveNumberInput,
  voluntaryLeavers: positiveNumberInput,
  involuntaryLeavers: positiveNumberInput,
  industry: z.enum(["technology", "healthcare", "retail", "manufacturing", "finance", "hospitality"]).default("technology"),
  departments: z.array(departmentTurnoverSchema).default([]),
});

export type TurnoverInputs = z.infer<typeof turnoverInputSchema>;

const turnoverBenchmarks: Record<TurnoverInputs["industry"], number> = {
  technology: 13,
  healthcare: 19,
  retail: 60,
  manufacturing: 22,
  finance: 12,
  hospitality: 45,
};

function turnoverRate(leavers: number, start: number, end: number) {
  return safeDivide(leavers, (start + end) / 2) * 100;
}

export function computeTurnoverRate(rawInputs: TurnoverInputs) {
  const inputs = turnoverInputSchema.parse(rawInputs);
  const totalLeavers = inputs.voluntaryLeavers + inputs.involuntaryLeavers;
  const averageHeadcount = (inputs.startingHeadcount + inputs.endingHeadcount) / 2;
  const totalTurnoverRate = turnoverRate(totalLeavers, inputs.startingHeadcount, inputs.endingHeadcount);
  const voluntaryTurnoverRate = turnoverRate(inputs.voluntaryLeavers, inputs.startingHeadcount, inputs.endingHeadcount);
  const involuntaryTurnoverRate = turnoverRate(inputs.involuntaryLeavers, inputs.startingHeadcount, inputs.endingHeadcount);
  const benchmark = turnoverBenchmarks[inputs.industry];
  const departmentBreakdown = inputs.departments.map((department) => {
    const departmentLeavers = department.voluntaryLeavers + department.involuntaryLeavers;
    return {
      department: department.department || "Department",
      turnoverRate: round(turnoverRate(departmentLeavers, department.startingHeadcount, department.endingHeadcount), 1),
      totalLeavers: departmentLeavers,
    };
  });

  const recommendations =
    totalTurnoverRate > benchmark
      ? [
          "Run stay interviews with high-performing employees in the next 30 days.",
          "Segment voluntary exits by manager, tenure band, department, and role family.",
          "Review compensation, workload, manager quality, and career progression before replacing people one-for-one.",
        ]
      : [
          "Keep monitoring voluntary exits by manager and role family.",
          "Protect retention drivers that are working: manager quality, growth, pay fairness, and workload.",
        ];

  return {
    averageHeadcount: round(averageHeadcount, 1),
    totalLeavers,
    totalTurnoverRate: round(totalTurnoverRate, 1),
    voluntaryTurnoverRate: round(voluntaryTurnoverRate, 1),
    involuntaryTurnoverRate: round(involuntaryTurnoverRate, 1),
    benchmark,
    benchmarkDelta: round(totalTurnoverRate - benchmark, 1),
    status: totalTurnoverRate > benchmark ? "Above benchmark" : "At or below benchmark",
    leaverMix: [
      { name: "Voluntary", value: inputs.voluntaryLeavers },
      { name: "Involuntary", value: inputs.involuntaryLeavers },
    ],
    departmentBreakdown,
    recommendations,
    sourceNote: "Benchmarks are illustrative static values based on SHRM 2024-style industry ranges.",
  };
}

export const costPerHireInputSchema = z.object({
  numberOfHires: positiveNumberInput,
  internalRecruiterCosts: positiveNumberInput,
  externalRecruiterFees: positiveNumberInput,
  jobBoardSpend: positiveNumberInput,
  atsCost: positiveNumberInput,
  backgroundCheckCosts: positiveNumberInput,
  signOnBonuses: positiveNumberInput,
  otherCosts: positiveNumberInput,
  periods: z
    .array(z.object({ period: z.string().default("Period"), totalCost: positiveNumberInput, hires: positiveNumberInput }))
    .default([]),
});

export type CostPerHireInputs = z.infer<typeof costPerHireInputSchema>;

export function computeCostPerHire(rawInputs: CostPerHireInputs) {
  const inputs = costPerHireInputSchema.parse(rawInputs);
  const categories = [
    { name: "Internal recruiter", value: inputs.internalRecruiterCosts },
    { name: "Agency fees", value: inputs.externalRecruiterFees },
    { name: "Job boards", value: inputs.jobBoardSpend },
    { name: "ATS", value: inputs.atsCost },
    { name: "Background checks", value: inputs.backgroundCheckCosts },
    { name: "Sign-on bonuses", value: inputs.signOnBonuses },
    { name: "Other", value: inputs.otherCosts },
  ];
  const totalCost = sum(categories.map((category) => category.value));
  const costPerHire = safeDivide(totalCost, inputs.numberOfHires);
  const benchmark = 4700;

  return {
    totalCost: round(totalCost, 0),
    costPerHire: round(costPerHire, 0),
    benchmark,
    benchmarkDelta: round(costPerHire - benchmark, 0),
    breakdown: categories.filter((category) => category.value > 0),
    trend: inputs.periods.map((period) => ({
      period: period.period,
      costPerHire: round(safeDivide(period.totalCost, period.hires), 0),
    })),
    recommendation:
      costPerHire > benchmark
        ? "Review agency dependency, job board conversion, referral quality, and interview cycle time before cutting recruiter capacity."
        : "Cost per hire is within the illustrative benchmark. Keep watching quality of hire and retention so low cost does not hide weak fit.",
    sourceNote: "Benchmark is an illustrative Talent Board-style market reference. Replace with your licensed benchmark source where available.",
  };
}

const hireRowSchema = z.object({
  roleTitle: z.string().default("Role"),
  datePosted: z.string().default(""),
  dateApplied: z.string().default(""),
  dateFirstInterview: z.string().default(""),
  dateOfferExtended: z.string().default(""),
  dateOfferAccepted: z.string().default(""),
  dateStarted: z.string().default(""),
});

export const timeToHireInputSchema = z.object({
  hires: z.array(hireRowSchema).default([]),
});

export type TimeToHireInputs = z.infer<typeof timeToHireInputSchema>;

const stageBenchmarks = {
  postToApply: 7,
  applyToInterview: 7,
  interviewToOffer: 14,
  offerToAccept: 5,
  acceptToStart: 14,
};

export function computeTimeToHire(rawInputs: TimeToHireInputs) {
  const inputs = timeToHireInputSchema.parse(rawInputs);
  const rows = inputs.hires.map((hire) => {
    const postToApply = daysBetween(hire.datePosted, hire.dateApplied);
    const applyToInterview = daysBetween(hire.dateApplied, hire.dateFirstInterview);
    const interviewToOffer = daysBetween(hire.dateFirstInterview, hire.dateOfferExtended);
    const offerToAccept = daysBetween(hire.dateOfferExtended, hire.dateOfferAccepted);
    const acceptToStart = daysBetween(hire.dateOfferAccepted, hire.dateStarted);
    const timeToFill = daysBetween(hire.datePosted, hire.dateOfferAccepted);
    const timeToHire = daysBetween(hire.datePosted, hire.dateStarted);
    return {
      roleTitle: hire.roleTitle || "Role",
      postToApply,
      applyToInterview,
      interviewToOffer,
      offerToAccept,
      acceptToStart,
      timeToFill,
      timeToHire,
    };
  });

  const stageAverages = [
    { stage: "Post to apply", key: "postToApply", days: round(mean(rows.map((row) => row.postToApply)), 1), benchmark: stageBenchmarks.postToApply },
    { stage: "Apply to interview", key: "applyToInterview", days: round(mean(rows.map((row) => row.applyToInterview)), 1), benchmark: stageBenchmarks.applyToInterview },
    { stage: "Interview to offer", key: "interviewToOffer", days: round(mean(rows.map((row) => row.interviewToOffer)), 1), benchmark: stageBenchmarks.interviewToOffer },
    { stage: "Offer to accept", key: "offerToAccept", days: round(mean(rows.map((row) => row.offerToAccept)), 1), benchmark: stageBenchmarks.offerToAccept },
    { stage: "Accept to start", key: "acceptToStart", days: round(mean(rows.map((row) => row.acceptToStart)), 1), benchmark: stageBenchmarks.acceptToStart },
  ];
  const bottleneck = [...stageAverages].sort((a, b) => b.days - b.benchmark - (a.days - a.benchmark))[0] ?? stageAverages[0];
  const times = rows.map((row) => row.timeToHire);

  return {
    rows,
    averageTimeToHire: round(mean(times), 1),
    averageTimeToFill: round(mean(rows.map((row) => row.timeToFill)), 1),
    medianTimeToHire: round(median(times), 1),
    p90TimeToHire: round(percentile(times, 90), 1),
    stageAverages,
    bottleneck,
    funnel: stageAverages.map((stage) => ({ name: stage.stage, days: stage.days })),
  };
}

const headcountDepartmentSchema = z.object({
  department: z.string().default("Department"),
  currentHeadcount: positiveNumberInput,
  targetHeadcount: positiveNumberInput,
  attritionRate: positiveNumberInput,
  timeToHireDays: positiveNumberInput,
  productiveQuarter: z.enum(["Q1", "Q2", "Q3", "Q4"]).default("Q4"),
  historicalQuarterlyVelocity: positiveNumberInput,
});

export const headcountPlannerInputSchema = z.object({
  departments: z.array(headcountDepartmentSchema).default([]),
});

export type HeadcountPlannerInputs = z.infer<typeof headcountPlannerInputSchema>;

const quarters = ["Q1", "Q2", "Q3", "Q4"] as const;

export function computeHeadcountPlanner(rawInputs: HeadcountPlannerInputs) {
  const inputs = headcountPlannerInputSchema.parse(rawInputs);
  const departments = inputs.departments.map((department) => {
    const growthHires = Math.max(0, department.targetHeadcount - department.currentHeadcount);
    const attritionBackfill = Math.ceil(department.currentHeadcount * (department.attritionRate / 100));
    const totalHires = growthHires + attritionBackfill;
    const productiveIndex = quarters.indexOf(department.productiveQuarter);
    const rampQuarters = Math.max(0, Math.ceil(department.timeToHireDays / 90) - 1);
    const latestHiringIndex = Math.max(0, productiveIndex - rampQuarters);
    const plan = quarters.map((quarter, index) => {
      if (totalHires === 0) return { quarter, hires: 0 };
      if (index > latestHiringIndex) return { quarter, hires: 0 };
      const activeQuarters = latestHiringIndex + 1;
      const base = Math.floor(totalHires / activeQuarters);
      const remainder = totalHires % activeQuarters;
      return { quarter, hires: base + (index < remainder ? 1 : 0) };
    });
    const peakQuarterHires = Math.max(...plan.map((item) => item.hires), 0);

    return {
      department: department.department || "Department",
      growthHires,
      attritionBackfill,
      totalHires,
      plan,
      risk:
        department.historicalQuarterlyVelocity > 0 && peakQuarterHires > department.historicalQuarterlyVelocity
          ? `Peak quarterly hiring need (${peakQuarterHires}) exceeds historical velocity (${department.historicalQuarterlyVelocity}).`
          : "",
    };
  });

  return {
    departments,
    totalHires: sum(departments.map((department) => department.totalHires)),
    quarterlyTotals: quarters.map((quarter) => ({
      quarter,
      hires: sum(departments.map((department) => department.plan.find((item) => item.quarter === quarter)?.hires ?? 0)),
    })),
    stackedByQuarter: quarters.map((quarter) => ({
      quarter,
      ...Object.fromEntries(
        departments.map((department) => [
          department.department,
          department.plan.find((item) => item.quarter === quarter)?.hires ?? 0,
        ])
      ),
    })),
    risks: departments.map((department) => department.risk).filter(Boolean),
  };
}

const absenceBreakdownSchema = z.object({
  name: z.string().default("Category"),
  days: positiveNumberInput,
});

export const absenteeismInputSchema = z.object({
  totalWorkDays: positiveNumberInput,
  absentDays: positiveNumberInput,
  headcount: positiveNumberInput,
  absenceInstances: positiveNumberInput,
  averageDailyWage: positiveNumberInput,
  departments: z.array(absenceBreakdownSchema).default([]),
  absenceTypes: z.array(absenceBreakdownSchema).default([]),
});

export type AbsenteeismInputs = z.infer<typeof absenteeismInputSchema>;

export function computeAbsenteeism(rawInputs: AbsenteeismInputs) {
  const inputs = absenteeismInputSchema.parse(rawInputs);
  const totalPossibleWorkDays = inputs.totalWorkDays * inputs.headcount;
  const absenteeismRate = safeDivide(inputs.absentDays, totalPossibleWorkDays) * 100;
  const bradfordFactor = inputs.absenceInstances ** 2 * inputs.absentDays;
  const cost = inputs.averageDailyWage * inputs.absentDays;
  const benchmark = 3;
  const patternFlags = [
    absenteeismRate > benchmark ? "Absenteeism is above the 3% benchmark. Review by manager, shift, and leave type." : "",
    bradfordFactor > 200 ? "Bradford Factor is high. Use it as a conversation trigger, not an automatic discipline score." : "",
    inputs.departments.some((department) => department.days > inputs.absentDays * 0.4)
      ? "One department carries more than 40% of absence days. Check workload, manager, shift, and staffing patterns."
      : "",
  ].filter(Boolean);

  return {
    totalPossibleWorkDays,
    absenteeismRate: round(absenteeismRate, 2),
    benchmark,
    benchmarkDelta: round(absenteeismRate - benchmark, 2),
    bradfordFactor: round(bradfordFactor, 0),
    cost: round(cost, 0),
    departments: inputs.departments,
    absenceTypes: inputs.absenceTypes,
    patternFlags,
  };
}

export const salaryBenchmarkInputSchema = z.object({
  role: z.string().default("Role"),
  location: z.string().default(""),
  currency: z.string().default("USD"),
  salaries: z.array(positiveNumberInput).default([]),
  yourOffer: positiveNumberInput,
});

export type SalaryBenchmarkInputs = z.infer<typeof salaryBenchmarkInputSchema>;

export function computeSalaryBenchmark(rawInputs: SalaryBenchmarkInputs) {
  const inputs = salaryBenchmarkInputSchema.parse(rawInputs);
  const salaries = inputs.salaries.filter((salary) => salary > 0).sort((a, b) => a - b);
  const p25 = percentile(salaries, 25);
  const p50 = percentile(salaries, 50);
  const p75 = percentile(salaries, 75);
  const p90 = percentile(salaries, 90);
  const offerPercentile = salaries.length ? safeDivide(salaries.filter((salary) => salary <= inputs.yourOffer).length, salaries.length) * 100 : 0;
  const min = salaries[0] ?? 0;
  const max = salaries[salaries.length - 1] ?? 0;
  const binCount = Math.min(8, Math.max(1, Math.ceil(Math.sqrt(salaries.length))));
  const binSize = binCount ? Math.max(1, (max - min) / binCount) : 1;
  const histogram = Array.from({ length: binCount }, (_, index) => {
    const start = min + index * binSize;
    const end = index === binCount - 1 ? max : start + binSize;
    return {
      range: `${round(start, 0)}-${round(end, 0)}`,
      count: salaries.filter((salary) => salary >= start && (index === binCount - 1 ? salary <= end : salary < end)).length,
    };
  });

  return {
    role: inputs.role,
    location: inputs.location,
    currency: inputs.currency,
    count: salaries.length,
    percentiles: {
      p25: round(p25, 0),
      p50: round(p50, 0),
      p75: round(p75, 0),
      p90: round(p90, 0),
    },
    recommendedRange: { min: round(p25, 0), max: round(p75, 0) },
    yourOffer: inputs.yourOffer,
    offerPercentile: round(offerPercentile, 1),
    histogram,
    note:
      "Atlas does not provide proprietary salary data. Use this tool to analyze data you gathered from sources like Levels.fyi, Payscale, Glassdoor, Radford, Mercer, or your network.",
  };
}

const payEquityEmployeeSchema = z.object({
  id: z.string().default("Employee"),
  gender: z.string().default(""),
  ethnicity: z.string().optional().default(""),
  department: z.string().default(""),
  level: z.string().default(""),
  tenureYears: numberInput,
  performanceRating: numberInput,
  salary: positiveNumberInput,
});

export const payEquityInputSchema = z.object({
  employees: z.array(payEquityEmployeeSchema).default([]),
});

export type PayEquityInputs = z.infer<typeof payEquityInputSchema>;

function transpose(matrix: number[][]) {
  return matrix[0]?.map((_, columnIndex) => matrix.map((row) => row[columnIndex])) ?? [];
}

function multiply(a: number[][], b: number[][]) {
  return a.map((row) => b[0].map((_, columnIndex) => sum(row.map((value, index) => value * b[index][columnIndex]))));
}

function inverse(matrix: number[][]) {
  const n = matrix.length;
  const augmented = matrix.map((row, index) => [
    ...row.map((value) => (Number.isFinite(value) ? value : 0)),
    ...Array.from({ length: n }, (_, identityIndex) => (identityIndex === index ? 1 : 0)),
  ]);

  for (let column = 0; column < n; column += 1) {
    let pivot = column;
    for (let row = column + 1; row < n; row += 1) {
      if (Math.abs(augmented[row][column]) > Math.abs(augmented[pivot][column])) pivot = row;
    }
    if (Math.abs(augmented[pivot][column]) < 1e-8) return null;
    [augmented[column], augmented[pivot]] = [augmented[pivot], augmented[column]];
    const divisor = augmented[column][column];
    augmented[column] = augmented[column].map((value) => value / divisor);
    for (let row = 0; row < n; row += 1) {
      if (row === column) continue;
      const factor = augmented[row][column];
      augmented[row] = augmented[row].map((value, index) => value - factor * augmented[column][index]);
    }
  }

  return augmented.map((row) => row.slice(n));
}

function ols(x: number[][], y: number[]) {
  const xt = transpose(x);
  const xtx = multiply(xt, x);
  const xtxInv = inverse(xtx);
  if (!xtxInv) return null;
  const xty = multiply(xt, y.map((value) => [value]));
  const beta = multiply(xtxInv, xty).map((row) => row[0]);
  const predictions = x.map((row) => sum(row.map((value, index) => value * beta[index])));
  const residuals = y.map((value, index) => value - predictions[index]);
  const dof = Math.max(1, y.length - beta.length);
  const sigma2 = sum(residuals.map((value) => value ** 2)) / dof;
  const standardErrors = xtxInv.map((row, index) => Math.sqrt(Math.max(0, row[index] * sigma2)));
  return { beta, predictions, residuals, standardErrors };
}

function normalizedGender(value: string) {
  const lower = value.trim().toLowerCase();
  if (["female", "woman", "f"].includes(lower)) return "female";
  if (["male", "man", "m"].includes(lower)) return "male";
  return lower || "unspecified";
}

export function computePayEquity(rawInputs: PayEquityInputs) {
  const inputs = payEquityInputSchema.parse(rawInputs);
  const employees = inputs.employees.filter((employee) => employee.salary > 0);
  const men = employees.filter((employee) => normalizedGender(employee.gender) === "male").map((employee) => employee.salary);
  const women = employees.filter((employee) => normalizedGender(employee.gender) === "female").map((employee) => employee.salary);
  const medianMale = median(men);
  const medianFemale = median(women);
  const rawGap = safeDivide(medianMale - medianFemale, medianMale) * 100;
  const levels = [...new Set(employees.map((employee) => employee.level).filter(Boolean))].slice(1);
  const departments = [...new Set(employees.map((employee) => employee.department).filter(Boolean))].slice(1);
  const x = employees.map((employee) => [
    1,
    normalizedGender(employee.gender) === "female" ? 1 : 0,
    employee.tenureYears,
    employee.performanceRating,
    ...levels.map((level) => (employee.level === level ? 1 : 0)),
    ...departments.map((department) => (employee.department === department ? 1 : 0)),
  ]);
  const y = employees.map((employee) => employee.salary);
  const model = employees.length > x[0]?.length ? ols(x, y) : null;
  const femaleCoefficient = model?.beta[1] ?? 0;
  const adjustedGap = safeDivide(-femaleCoefficient, medianMale || mean(y)) * 100;
  const standardError = model?.standardErrors[1] ?? 0;
  const tStatistic = standardError ? femaleCoefficient / standardError : 0;
  const controlsOnlyX = employees.map((employee) => [
    1,
    employee.tenureYears,
    employee.performanceRating,
    ...levels.map((level) => (employee.level === level ? 1 : 0)),
    ...departments.map((department) => (employee.department === department ? 1 : 0)),
  ]);
  const controlsOnlyModel = employees.length > controlsOnlyX[0]?.length ? ols(controlsOnlyX, y) : null;
  const unexplained = employees
    .map((employee, index) => ({
      id: employee.id,
      department: employee.department,
      level: employee.level,
      gender: employee.gender,
      salary: employee.salary,
      expectedSalary: round(controlsOnlyModel?.predictions[index] ?? mean(y), 0),
      gap: round(employee.salary - (controlsOnlyModel?.predictions[index] ?? mean(y)), 0),
    }))
    .sort((a, b) => a.gap - b.gap)
    .slice(0, 5);
  const byDepartment = [...new Set(employees.map((employee) => employee.department || "Unassigned"))].map((department) => {
    const group = employees.filter((employee) => (employee.department || "Unassigned") === department);
    const maleMedian = median(group.filter((employee) => normalizedGender(employee.gender) === "male").map((employee) => employee.salary));
    const femaleMedian = median(group.filter((employee) => normalizedGender(employee.gender) === "female").map((employee) => employee.salary));
    return { department, gap: round(safeDivide(maleMedian - femaleMedian, maleMedian) * 100, 1), maleMedian, femaleMedian };
  });

  return {
    employeeCount: employees.length,
    medianMale: round(medianMale, 0),
    medianFemale: round(medianFemale, 0),
    rawGap: round(rawGap, 1),
    adjustedGap: round(adjustedGap, 1),
    femaleCoefficient: round(femaleCoefficient, 0),
    statisticallySignificant: employees.length >= 30 && Math.abs(tStatistic) >= 1.96,
    tStatistic: round(tStatistic, 2),
    byDepartment,
    unexplained,
    methodology:
      "Adjusted gap uses ordinary least squares controlling for level, tenure, performance rating, and department. This is a screening tool, not a legally defensible pay-equity audit.",
  };
}

const dashboardEmployeeSchema = z.object({
  employeeId: z.string().default(""),
  name: z.string().default(""),
  department: z.string().default(""),
  role: z.string().default(""),
  level: z.string().default(""),
  gender: z.string().default(""),
  ethnicity: z.string().default(""),
  startDate: z.string().default(""),
  endDate: z.string().default(""),
  salary: positiveNumberInput,
  country: z.string().default(""),
  managerId: z.string().default(""),
});

export const hrDashboardInputSchema = z.object({
  employees: z.array(dashboardEmployeeSchema).default([]),
  departmentFilter: optionalText,
  countryFilter: optionalText,
  levelFilter: optionalText,
});

export type HrDashboardInputs = z.infer<typeof hrDashboardInputSchema>;

function isActiveEmployee(employee: z.infer<typeof dashboardEmployeeSchema>) {
  return !employee.endDate || employee.endDate.toLowerCase() === "active";
}

export function computeHrDashboard(rawInputs: HrDashboardInputs) {
  const inputs = hrDashboardInputSchema.parse(rawInputs);
  const filtered = inputs.employees.filter((employee) => {
    if (inputs.departmentFilter && employee.department !== inputs.departmentFilter) return false;
    if (inputs.countryFilter && employee.country !== inputs.countryFilter) return false;
    if (inputs.levelFilter && employee.level !== inputs.levelFilter) return false;
    return true;
  });
  const active = filtered.filter(isActiveEmployee);
  const now = new Date();
  const oneYearAgo = new Date(now);
  oneYearAgo.setFullYear(now.getFullYear() - 1);
  const exitsLast12 = filtered.filter((employee) => employee.endDate && employee.endDate.toLowerCase() !== "active" && new Date(employee.endDate) >= oneYearAgo);
  const hiresLast12 = filtered.filter((employee) => employee.startDate && new Date(employee.startDate) >= oneYearAgo);
  const averageTenureYears = mean(
    active.map((employee) => safeDivide(daysBetween(employee.startDate, now.toISOString().slice(0, 10)), 365))
  );
  const attritionRate = safeDivide(exitsLast12.length, active.length + exitsLast12.length / 2) * 100;
  const months = Array.from({ length: 12 }, (_, index) => monthsAgo(11 - index));
  const headcountTrend = months.map((month) => {
    const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    return {
      month: monthKey(month),
      headcount: filtered.filter((employee) => {
        const start = new Date(employee.startDate);
        const end = employee.endDate && employee.endDate.toLowerCase() !== "active" ? new Date(employee.endDate) : null;
        return start <= monthEnd && (!end || end > monthEnd);
      }).length,
    };
  });
  const genderSplit = [...new Set(active.map((employee) => employee.gender || "Unspecified"))].map((gender) => ({
    name: gender,
    value: active.filter((employee) => (employee.gender || "Unspecified") === gender).length,
  }));
  const departments = [...new Set(active.map((employee) => employee.department || "Unassigned"))];
  const levels = [...new Set(active.map((employee) => employee.level || "Unassigned"))];
  const demographicsByDepartment = departments.map((department) => ({
    department,
    ...Object.fromEntries(genderSplit.map((gender) => [gender.name, active.filter((employee) => (employee.department || "Unassigned") === department && (employee.gender || "Unspecified") === gender.name).length])),
  }));
  const tenureDistribution = [
    { bucket: "<1 year", count: active.filter((employee) => safeDivide(daysBetween(employee.startDate, now.toISOString().slice(0, 10)), 365) < 1).length },
    { bucket: "1-3 years", count: active.filter((employee) => {
      const years = safeDivide(daysBetween(employee.startDate, now.toISOString().slice(0, 10)), 365);
      return years >= 1 && years < 3;
    }).length },
    { bucket: "3-5 years", count: active.filter((employee) => {
      const years = safeDivide(daysBetween(employee.startDate, now.toISOString().slice(0, 10)), 365);
      return years >= 3 && years < 5;
    }).length },
    { bucket: "5+ years", count: active.filter((employee) => safeDivide(daysBetween(employee.startDate, now.toISOString().slice(0, 10)), 365) >= 5).length },
  ];
  const compensationByLevel = levels.map((level) => ({
    level,
    medianSalary: round(median(active.filter((employee) => (employee.level || "Unassigned") === level).map((employee) => employee.salary)), 0),
  }));
  const genderPayGapByDepartment = departments.map((department) => {
    const group = active.filter((employee) => (employee.department || "Unassigned") === department);
    const maleMedian = median(group.filter((employee) => normalizedGender(employee.gender) === "male").map((employee) => employee.salary));
    const femaleMedian = median(group.filter((employee) => normalizedGender(employee.gender) === "female").map((employee) => employee.salary));
    return { department, gap: round(safeDivide(maleMedian - femaleMedian, maleMedian) * 100, 1) };
  });
  const hiresAndExits = months.map((month) => ({
    month: monthKey(month),
    hires: hiresLast12.filter((employee) => employee.startDate.startsWith(monthKey(month))).length,
    exits: exitsLast12.filter((employee) => employee.endDate.startsWith(monthKey(month))).length,
  }));
  const leadershipKeywords = ["lead", "manager", "director", "head", "vp", "chief", "principal"];
  const leadershipByLevel = levels.map((level) => {
    const group = active.filter((employee) => (employee.level || "Unassigned") === level);
    const isLeadershipLevel = leadershipKeywords.some((keyword) => level.toLowerCase().includes(keyword));
    return {
      level,
      leadershipLevel: isLeadershipLevel,
      womenPercent: round(safeDivide(group.filter((employee) => normalizedGender(employee.gender) === "female").length, group.length) * 100, 1),
      underrepresentedPercent: round(safeDivide(group.filter((employee) => employee.ethnicity && !["majority", "white"].includes(employee.ethnicity.toLowerCase())).length, group.length) * 100, 1),
    };
  });

  return {
    totalHeadcount: active.length,
    genderSplit,
    averageTenureYears: round(averageTenureYears, 1),
    attritionRate: round(attritionRate, 1),
    headcountTrend,
    demographicsByDepartment,
    tenureDistribution,
    compensationByLevel,
    genderPayGapByDepartment,
    hiresAndExits,
    leadershipByLevel,
    filters: {
      departments: departments.filter(Boolean),
      countries: [...new Set(inputs.employees.map((employee) => employee.country).filter(Boolean))],
      levels: levels.filter(Boolean),
    },
  };
}

export const CALCULATORS: CalculatorConfig[] = [
  {
    slug: "turnover-rate",
    name: "Turnover Rate Calculator",
    category: "Calculators",
    description: "Calculate total, voluntary, and involuntary turnover against illustrative industry benchmarks.",
    schema: turnoverInputSchema,
    defaultInputs: {
      period: "year",
      startingHeadcount: 120,
      endingHeadcount: 132,
      voluntaryLeavers: 12,
      involuntaryLeavers: 4,
      industry: "technology",
      departments: [
        { department: "Engineering", startingHeadcount: 48, endingHeadcount: 52, voluntaryLeavers: 3, involuntaryLeavers: 1 },
        { department: "Sales", startingHeadcount: 30, endingHeadcount: 34, voluntaryLeavers: 6, involuntaryLeavers: 2 },
      ],
    },
    fields: [
      { kind: "select", name: "period", label: "Period", options: [{ value: "year", label: "Year" }, { value: "quarter", label: "Quarter" }, { value: "custom", label: "Custom" }] },
      { kind: "number", name: "startingHeadcount", label: "Starting headcount", min: 0 },
      { kind: "number", name: "endingHeadcount", label: "Ending headcount", min: 0 },
      { kind: "number", name: "voluntaryLeavers", label: "Voluntary leavers", min: 0 },
      { kind: "number", name: "involuntaryLeavers", label: "Involuntary leavers", min: 0 },
      { kind: "select", name: "industry", label: "Industry benchmark", options: Object.keys(turnoverBenchmarks).map((industry) => ({ value: industry, label: industry.replace(/^\w/, (letter) => letter.toUpperCase()) })) },
      {
        kind: "table",
        name: "departments",
        label: "Department breakdown",
        addLabel: "Add department",
        columns: [
          { key: "department", label: "Department", type: "text" },
          { key: "startingHeadcount", label: "Start", type: "number" },
          { key: "endingHeadcount", label: "End", type: "number" },
          { key: "voluntaryLeavers", label: "Vol.", type: "number" },
          { key: "involuntaryLeavers", label: "Invol.", type: "number" },
        ],
      },
    ],
    compute: (inputs) => computeTurnoverRate(inputs as TurnoverInputs),
  },
  {
    slug: "cost-per-hire",
    name: "Cost-Per-Hire Calculator",
    category: "Calculators",
    description: "Add internal and external recruiting costs to see cost per hire and spend mix.",
    schema: costPerHireInputSchema,
    defaultInputs: {
      numberOfHires: 18,
      internalRecruiterCosts: 42_000,
      externalRecruiterFees: 28_000,
      jobBoardSpend: 6_500,
      atsCost: 3_000,
      backgroundCheckCosts: 1_800,
      signOnBonuses: 9_000,
      otherCosts: 2_500,
      periods: [
        { period: "Q1", totalCost: 72_000, hires: 14 },
        { period: "Q2", totalCost: 92_800, hires: 18 },
      ],
    },
    fields: [
      { kind: "number", name: "numberOfHires", label: "Number of hires", min: 0 },
      { kind: "number", name: "internalRecruiterCosts", label: "Internal recruiter costs", min: 0 },
      { kind: "number", name: "externalRecruiterFees", label: "External recruiter / agency fees", min: 0 },
      { kind: "number", name: "jobBoardSpend", label: "Job board spend", min: 0 },
      { kind: "number", name: "atsCost", label: "ATS cost allocated", min: 0 },
      { kind: "number", name: "backgroundCheckCosts", label: "Background check costs", min: 0 },
      { kind: "number", name: "signOnBonuses", label: "Sign-on bonuses", min: 0 },
      { kind: "number", name: "otherCosts", label: "Other costs", min: 0 },
      {
        kind: "table",
        name: "periods",
        label: "Trend periods",
        addLabel: "Add period",
        columns: [
          { key: "period", label: "Period", type: "text" },
          { key: "totalCost", label: "Total cost", type: "number" },
          { key: "hires", label: "Hires", type: "number" },
        ],
      },
    ],
    compute: (inputs) => computeCostPerHire(inputs as CostPerHireInputs),
  },
  {
    slug: "time-to-hire",
    name: "Time-to-Hire Tracker",
    category: "Calculators",
    description: "Track hiring stage duration, time-to-fill, time-to-hire, and bottlenecks by role.",
    schema: timeToHireInputSchema,
    defaultInputs: {
      hires: [
        { roleTitle: "Product Manager", datePosted: "2026-01-02", dateApplied: "2026-01-08", dateFirstInterview: "2026-01-14", dateOfferExtended: "2026-01-30", dateOfferAccepted: "2026-02-04", dateStarted: "2026-03-01" },
        { roleTitle: "Support Lead", datePosted: "2026-01-10", dateApplied: "2026-01-15", dateFirstInterview: "2026-01-20", dateOfferExtended: "2026-02-01", dateOfferAccepted: "2026-02-03", dateStarted: "2026-02-17" },
      ],
    },
    fields: [
      {
        kind: "table",
        name: "hires",
        label: "Hires",
        addLabel: "Add hire",
        columns: [
          { key: "roleTitle", label: "Role", type: "text" },
          { key: "datePosted", label: "Posted", type: "date" },
          { key: "dateApplied", label: "Applied", type: "date" },
          { key: "dateFirstInterview", label: "Interview", type: "date" },
          { key: "dateOfferExtended", label: "Offer", type: "date" },
          { key: "dateOfferAccepted", label: "Accepted", type: "date" },
          { key: "dateStarted", label: "Started", type: "date" },
        ],
      },
    ],
    compute: (inputs) => computeTimeToHire(inputs as TimeToHireInputs),
  },
  {
    slug: "headcount-planner",
    name: "Headcount Planner",
    category: "Calculators",
    description: "Plan quarterly hiring needs by department, accounting for attrition and hiring ramp time.",
    schema: headcountPlannerInputSchema,
    defaultInputs: {
      departments: [
        { department: "Engineering", currentHeadcount: 42, targetHeadcount: 55, attritionRate: 10, timeToHireDays: 75, productiveQuarter: "Q4", historicalQuarterlyVelocity: 6 },
        { department: "Sales", currentHeadcount: 24, targetHeadcount: 36, attritionRate: 18, timeToHireDays: 45, productiveQuarter: "Q3", historicalQuarterlyVelocity: 5 },
      ],
    },
    fields: [
      {
        kind: "table",
        name: "departments",
        label: "Department plan",
        addLabel: "Add department",
        columns: [
          { key: "department", label: "Department", type: "text" },
          { key: "currentHeadcount", label: "Current", type: "number" },
          { key: "targetHeadcount", label: "Target", type: "number" },
          { key: "attritionRate", label: "Attrition %", type: "number" },
          { key: "timeToHireDays", label: "TTH days", type: "number" },
          { key: "productiveQuarter", label: "Productive by", type: "select", options: quarters.map((quarter) => ({ value: quarter, label: quarter })) },
          { key: "historicalQuarterlyVelocity", label: "Velocity", type: "number" },
        ],
      },
    ],
    compute: (inputs) => computeHeadcountPlanner(inputs as HeadcountPlannerInputs),
  },
  {
    slug: "absenteeism-rate",
    name: "Absenteeism Rate Calculator",
    category: "Calculators",
    description: "Calculate absenteeism rate, Bradford Factor, estimated cost, and department patterns.",
    schema: absenteeismInputSchema,
    defaultInputs: {
      totalWorkDays: 22,
      absentDays: 48,
      headcount: 75,
      absenceInstances: 16,
      averageDailyWage: 180,
      departments: [{ name: "Operations", days: 28 }, { name: "Sales", days: 12 }],
      absenceTypes: [{ name: "Sick", days: 35 }, { name: "No-show", days: 8 }, { name: "Late", days: 5 }],
    },
    fields: [
      { kind: "number", name: "totalWorkDays", label: "Total work days in period", min: 0 },
      { kind: "number", name: "absentDays", label: "Total unplanned absent days", min: 0 },
      { kind: "number", name: "headcount", label: "Headcount", min: 0 },
      { kind: "number", name: "absenceInstances", label: "Number of absence instances", min: 0 },
      { kind: "number", name: "averageDailyWage", label: "Average daily wage", min: 0 },
      {
        kind: "table",
        name: "departments",
        label: "By department",
        addLabel: "Add department",
        columns: [
          { key: "name", label: "Department", type: "text" },
          { key: "days", label: "Days", type: "number" },
        ],
      },
      {
        kind: "table",
        name: "absenceTypes",
        label: "By absence type",
        addLabel: "Add type",
        columns: [
          { key: "name", label: "Type", type: "text" },
          { key: "days", label: "Days", type: "number" },
        ],
      },
    ],
    compute: (inputs) => computeAbsenteeism(inputs as AbsenteeismInputs),
  },
  {
    slug: "salary-benchmark",
    name: "Salary Benchmark Calculator",
    category: "Calculators",
    description: "Analyze salary data you gathered and compute percentiles, histogram, and offer position.",
    schema: salaryBenchmarkInputSchema,
    defaultInputs: {
      role: "Senior HR Business Partner",
      location: "Lagos",
      currency: "NGN",
      salaries: [18_000_000, 20_500_000, 22_000_000, 24_000_000, 25_500_000, 28_000_000, 32_000_000],
      yourOffer: 24_500_000,
    },
    fields: [
      { kind: "text", name: "role", label: "Role" },
      { kind: "text", name: "location", label: "Country / city" },
      { kind: "text", name: "currency", label: "Currency" },
      { kind: "textarea", name: "salaries", label: "Comparison salaries", placeholder: "Paste one salary per line or comma-separated" },
      { kind: "number", name: "yourOffer", label: "Your offer", min: 0 },
    ],
    compute: (inputs) => computeSalaryBenchmark(inputs as SalaryBenchmarkInputs),
  },
  {
    slug: "pay-equity",
    name: "Pay Equity Calculator",
    category: "Calculators",
    description: "Screen pay equity risk with raw and adjusted gender pay-gap analysis.",
    schema: payEquityInputSchema,
    defaultInputs: {
      employees: [
        { id: "E001", gender: "Female", ethnicity: "Black", department: "Sales", level: "Manager", tenureYears: 4, performanceRating: 4, salary: 92_000 },
        { id: "E002", gender: "Male", ethnicity: "White", department: "Sales", level: "Manager", tenureYears: 4, performanceRating: 4, salary: 98_000 },
        { id: "E003", gender: "Female", ethnicity: "Asian", department: "Engineering", level: "Senior", tenureYears: 5, performanceRating: 5, salary: 142_000 },
        { id: "E004", gender: "Male", ethnicity: "White", department: "Engineering", level: "Senior", tenureYears: 5, performanceRating: 5, salary: 150_000 },
      ],
    },
    fields: [
      { kind: "csv", name: "employees", label: "CSV upload", helper: "Expected columns: id/name, gender, ethnicity, department, level, tenure_years, performance_rating, salary." },
      {
        kind: "table",
        name: "employees",
        label: "Employee data",
        addLabel: "Add employee",
        columns: [
          { key: "id", label: "ID", type: "text" },
          { key: "gender", label: "Gender", type: "text" },
          { key: "ethnicity", label: "Ethnicity", type: "text" },
          { key: "department", label: "Department", type: "text" },
          { key: "level", label: "Level", type: "text" },
          { key: "tenureYears", label: "Tenure", type: "number" },
          { key: "performanceRating", label: "Rating", type: "number" },
          { key: "salary", label: "Salary", type: "number" },
        ],
      },
    ],
    compute: (inputs) => computePayEquity(inputs as PayEquityInputs),
  },
  {
    slug: "hr-dashboard",
    name: "HR Dashboard",
    category: "Calculators",
    description: "Upload employee data and generate headcount, attrition, demographic, tenure, and compensation charts.",
    schema: hrDashboardInputSchema,
    defaultInputs: {
      employees: [
        { employeeId: "E001", name: "Amina Okafor", department: "Engineering", role: "Frontend Engineer", level: "Senior", gender: "Female", ethnicity: "Black", startDate: "2022-01-10", endDate: "active", salary: 135_000, country: "NG", managerId: "M001" },
        { employeeId: "E002", name: "James Miller", department: "Sales", role: "Account Executive", level: "Manager", gender: "Male", ethnicity: "White", startDate: "2021-04-12", endDate: "active", salary: 120_000, country: "US", managerId: "M002" },
        { employeeId: "E003", name: "Priya Shah", department: "Engineering", role: "Engineering Manager", level: "Manager", gender: "Female", ethnicity: "Asian", startDate: "2020-06-01", endDate: "active", salary: 165_000, country: "IN", managerId: "M003" },
        { employeeId: "E004", name: "Daniel Reed", department: "People", role: "Recruiter", level: "Mid", gender: "Male", ethnicity: "White", startDate: "2024-02-15", endDate: "2026-02-15", salary: 82_000, country: "UK", managerId: "M004" },
      ],
      departmentFilter: "",
      countryFilter: "",
      levelFilter: "",
    },
    fields: [
      { kind: "csv", name: "employees", label: "CSV upload", helper: "Expected columns: employee_id, name, department, role, level, gender, ethnicity, start_date, end_date, salary, country, manager_id." },
      {
        kind: "table",
        name: "employees",
        label: "Employee data",
        addLabel: "Add employee",
        columns: [
          { key: "employeeId", label: "ID", type: "text" },
          { key: "name", label: "Name", type: "text" },
          { key: "department", label: "Department", type: "text" },
          { key: "role", label: "Role", type: "text" },
          { key: "level", label: "Level", type: "text" },
          { key: "gender", label: "Gender", type: "text" },
          { key: "ethnicity", label: "Ethnicity", type: "text" },
          { key: "startDate", label: "Start", type: "date" },
          { key: "endDate", label: "End/active", type: "text" },
          { key: "salary", label: "Salary", type: "number" },
          { key: "country", label: "Country", type: "text" },
          { key: "managerId", label: "Manager", type: "text" },
        ],
      },
    ],
    compute: (inputs) => computeHrDashboard(inputs as HrDashboardInputs),
  },
];

export function getCalculator(slug: string) {
  return CALCULATORS.find((calculator) => calculator.slug === slug);
}
