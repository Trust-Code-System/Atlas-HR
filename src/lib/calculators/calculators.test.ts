import { describe, expect, it } from "vitest";
import {
  computeAbsenteeism,
  computeCostPerHire,
  computeHeadcountPlanner,
  computeHrDashboard,
  computePayEquity,
  computeSalaryBenchmark,
  computeTimeToHire,
  computeTurnoverRate,
} from ".";

describe("turnover rate calculator", () => {
  const result = computeTurnoverRate({
    period: "year",
    startingHeadcount: 100,
    endingHeadcount: 120,
    voluntaryLeavers: 11,
    involuntaryLeavers: 5,
    industry: "technology",
    departments: [{ department: "Sales", startingHeadcount: 20, endingHeadcount: 22, voluntaryLeavers: 3, involuntaryLeavers: 1 }],
  });

  it("calculates average headcount", () => expect(result.averageHeadcount).toBe(110));
  it("calculates total leavers", () => expect(result.totalLeavers).toBe(16));
  it("calculates total turnover rate", () => expect(result.totalTurnoverRate).toBe(14.5));
  it("calculates voluntary turnover rate", () => expect(result.voluntaryTurnoverRate).toBe(10));
  it("uses the industry benchmark", () => expect(result.benchmark).toBe(13));
  it("calculates department breakdown", () => expect(result.departmentBreakdown[0].turnoverRate).toBe(19));
});

describe("cost-per-hire calculator", () => {
  const result = computeCostPerHire({
    numberOfHires: 10,
    internalRecruiterCosts: 20_000,
    externalRecruiterFees: 10_000,
    jobBoardSpend: 2_000,
    atsCost: 1_000,
    backgroundCheckCosts: 500,
    signOnBonuses: 5_000,
    otherCosts: 1_500,
    periods: [{ period: "Q1", totalCost: 40_000, hires: 10 }],
  });

  it("adds all costs", () => expect(result.totalCost).toBe(40_000));
  it("calculates cost per hire", () => expect(result.costPerHire).toBe(4_000));
  it("keeps benchmark", () => expect(result.benchmark).toBe(4_700));
  it("calculates benchmark delta", () => expect(result.benchmarkDelta).toBe(-700));
  it("builds spend breakdown", () => expect(result.breakdown.length).toBe(7));
  it("builds period trend", () => expect(result.trend[0].costPerHire).toBe(4_000));
});

describe("time-to-hire tracker", () => {
  const result = computeTimeToHire({
    hires: [
      {
        roleTitle: "Engineer",
        datePosted: "2026-01-01",
        dateApplied: "2026-01-05",
        dateFirstInterview: "2026-01-10",
        dateOfferExtended: "2026-01-20",
        dateOfferAccepted: "2026-01-25",
        dateStarted: "2026-02-10",
      },
      {
        roleTitle: "Designer",
        datePosted: "2026-01-01",
        dateApplied: "2026-01-03",
        dateFirstInterview: "2026-01-06",
        dateOfferExtended: "2026-01-16",
        dateOfferAccepted: "2026-01-20",
        dateStarted: "2026-02-01",
      },
    ],
  });

  it("calculates average time to hire", () => expect(result.averageTimeToHire).toBe(35.5));
  it("calculates average time to fill", () => expect(result.averageTimeToFill).toBe(21.5));
  it("calculates median time to hire", () => expect(result.medianTimeToHire).toBe(35.5));
  it("calculates p90 time to hire", () => expect(result.p90TimeToHire).toBe(39.1));
  it("calculates stage averages", () => expect(result.stageAverages).toHaveLength(5));
  it("identifies a bottleneck", () => expect(result.bottleneck.stage).toBeTruthy());
});

describe("headcount planner", () => {
  const result = computeHeadcountPlanner({
    departments: [
      { department: "Engineering", currentHeadcount: 20, targetHeadcount: 30, attritionRate: 10, timeToHireDays: 60, productiveQuarter: "Q4", historicalQuarterlyVelocity: 2 },
      { department: "Sales", currentHeadcount: 10, targetHeadcount: 12, attritionRate: 20, timeToHireDays: 120, productiveQuarter: "Q3", historicalQuarterlyVelocity: 5 },
    ],
  });

  it("calculates total hires", () => expect(result.totalHires).toBe(16));
  it("calculates departmental growth hires", () => expect(result.departments[0].growthHires).toBe(10));
  it("calculates attrition backfill", () => expect(result.departments[0].attritionBackfill).toBe(2));
  it("creates quarterly totals", () => expect(result.quarterlyTotals).toHaveLength(4));
  it("creates stacked chart data", () => expect(result.stackedByQuarter[0]).toHaveProperty("Engineering"));
  it("flags velocity risks", () => expect(result.risks.length).toBeGreaterThan(0));
});

describe("absenteeism calculator", () => {
  const result = computeAbsenteeism({
    totalWorkDays: 20,
    absentDays: 30,
    headcount: 50,
    absenceInstances: 5,
    averageDailyWage: 100,
    departments: [{ name: "Ops", days: 20 }],
    absenceTypes: [{ name: "Sick", days: 25 }],
  });

  it("calculates total possible work days", () => expect(result.totalPossibleWorkDays).toBe(1000));
  it("calculates absenteeism rate", () => expect(result.absenteeismRate).toBe(3));
  it("calculates Bradford Factor", () => expect(result.bradfordFactor).toBe(750));
  it("calculates cost", () => expect(result.cost).toBe(3000));
  it("keeps benchmark", () => expect(result.benchmark).toBe(3));
  it("flags patterns", () => expect(result.patternFlags.length).toBeGreaterThan(0));
});

describe("salary benchmark calculator", () => {
  const result = computeSalaryBenchmark({
    role: "HRBP",
    location: "London",
    currency: "GBP",
    salaries: [50_000, 60_000, 70_000, 80_000, 90_000],
    yourOffer: 75_000,
  });

  it("counts comparison salaries", () => expect(result.count).toBe(5));
  it("calculates p25", () => expect(result.percentiles.p25).toBe(60_000));
  it("calculates p50", () => expect(result.percentiles.p50).toBe(70_000));
  it("calculates p75", () => expect(result.percentiles.p75).toBe(80_000));
  it("calculates offer percentile", () => expect(result.offerPercentile).toBe(60));
  it("creates a histogram", () => expect(result.histogram.length).toBeGreaterThan(0));
});

describe("pay equity calculator", () => {
  const employees = Array.from({ length: 36 }, (_, index) => {
    const female = index % 2 === 0;
    const level = index % 3 === 0 ? "Manager" : "Senior";
    const department = index % 4 < 2 ? "Sales" : "Engineering";
    const base = level === "Manager" ? 100_000 : 80_000;
    return {
      id: `E${index}`,
      gender: female ? "Female" : "Male",
      ethnicity: index % 5 === 0 ? "Black" : "White",
      department,
      level,
      tenureYears: 2 + (index % 6),
      performanceRating: 3 + (index % 3),
      salary: base + (index % 6) * 2_000 + (female ? -5_000 : 0),
    };
  });
  const result = computePayEquity({ employees });

  it("counts employees", () => expect(result.employeeCount).toBe(36));
  it("calculates male median", () => expect(result.medianMale).toBeGreaterThan(0));
  it("calculates female median", () => expect(result.medianFemale).toBeGreaterThan(0));
  it("calculates raw gap", () => expect(Number.isFinite(result.rawGap)).toBe(true));
  it("calculates department gaps", () => expect(result.byDepartment.length).toBeGreaterThan(0));
  it("returns employees for review", () => expect(result.unexplained.length).toBe(5));
});

describe("hr dashboard calculator", () => {
  const result = computeHrDashboard({
    employees: [
      { employeeId: "1", name: "A", department: "Engineering", role: "Engineer", level: "Senior", gender: "Female", ethnicity: "Black", startDate: "2023-01-01", endDate: "active", salary: 100_000, country: "US", managerId: "M1" },
      { employeeId: "2", name: "B", department: "Engineering", role: "Manager", level: "Manager", gender: "Male", ethnicity: "White", startDate: "2022-01-01", endDate: "active", salary: 120_000, country: "US", managerId: "M2" },
      { employeeId: "3", name: "C", department: "Sales", role: "AE", level: "Mid", gender: "Female", ethnicity: "Asian", startDate: "2026-01-01", endDate: "active", salary: 80_000, country: "UK", managerId: "M3" },
      { employeeId: "4", name: "D", department: "Sales", role: "AE", level: "Mid", gender: "Male", ethnicity: "White", startDate: "2024-01-01", endDate: "2026-03-01", salary: 82_000, country: "UK", managerId: "M3" },
    ],
    departmentFilter: "",
    countryFilter: "",
    levelFilter: "",
  });

  it("calculates active headcount", () => expect(result.totalHeadcount).toBe(3));
  it("calculates gender split", () => expect(result.genderSplit.length).toBeGreaterThan(0));
  it("builds headcount trend", () => expect(result.headcountTrend).toHaveLength(12));
  it("builds tenure distribution", () => expect(result.tenureDistribution).toHaveLength(4));
  it("builds compensation by level", () => expect(result.compensationByLevel.length).toBeGreaterThan(0));
  it("builds hires and exits", () => expect(result.hiresAndExits).toHaveLength(12));
});
