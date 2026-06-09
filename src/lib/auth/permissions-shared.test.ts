import { describe, it, expect } from "vitest";
import {
  permissionsForRoles,
  roleCan,
  ROLE_PERMISSIONS,
} from "@/lib/auth/permissions-shared";

describe("RBAC — permissionsForRoles", () => {
  it("resolves an HR admin's granted permissions", () => {
    const perms = permissionsForRoles(["hr_admin"]);
    expect(perms.has("all_hr")).toBe(true);
    expect(perms.has("view_compensation")).toBe(true);
    expect(perms.has("billing")).toBe(false);
  });

  it("unions permissions across multiple roles", () => {
    const perms = permissionsForRoles(["employee", "people_manager"]);
    expect(perms.has("view_self")).toBe(true);
    expect(perms.has("view_team")).toBe(true);
  });

  it("defaults unknown/empty roles to employee", () => {
    const perms = permissionsForRoles([]);
    expect(perms.has("view_self")).toBe(true);
    expect(perms.has("all_hr")).toBe(false);
  });
});

describe("RBAC — roleCan capability gates", () => {
  it("an employee cannot view other employees' confidential data", () => {
    expect(roleCan(["employee"], "canViewAllEmployees")).toBe(false);
    expect(roleCan(["employee"], "canViewSalaryData")).toBe(false);
    expect(roleCan(["employee"], "canViewDisciplinaryCases")).toBe(false);
    expect(roleCan(["employee"], "canExecuteRestrictedActions")).toBe(false);
  });

  it("a people manager can view team data but not company-wide salary", () => {
    expect(roleCan(["people_manager"], "canViewTeamData")).toBe(true);
    expect(roleCan(["people_manager"], "canViewSalaryData")).toBe(false);
    expect(roleCan(["people_manager"], "canViewAllEmployees")).toBe(false);
  });

  it("an HR admin can view permitted employee data and manage policies", () => {
    expect(roleCan(["hr_admin"], "canViewAllEmployees")).toBe(true);
    expect(roleCan(["hr_admin"], "canViewSalaryData")).toBe(true);
    expect(roleCan(["hr_admin"], "canManagePolicies")).toBe(true);
    expect(roleCan(["hr_admin"], "canViewMedicalData")).toBe(true);
  });

  it("only owner-level roles can execute restricted actions", () => {
    expect(roleCan(["workspace_owner"], "canExecuteRestrictedActions")).toBe(true);
    expect(roleCan(["hr_admin"], "canExecuteRestrictedActions")).toBe(false);
    expect(roleCan(["hr_manager"], "canExecuteRestrictedActions")).toBe(false);
  });

  it("finance can see compensation but not run HR workflows", () => {
    expect(roleCan(["finance"], "canViewSalaryData")).toBe(true);
    expect(roleCan(["finance"], "canManageOnboarding")).toBe(false);
  });

  it("the role map stays in sync with the eight workspace roles", () => {
    expect(Object.keys(ROLE_PERMISSIONS)).toHaveLength(8);
  });
});
