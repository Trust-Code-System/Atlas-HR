import type { Document } from "docx";
import type { TemplateVariables, TemplateVariant } from "./variables";
import { buildTemplate as annualPerformanceReview } from "./generators/performance/annual-performance-review";
import { buildTemplate as antiHarassmentPolicy } from "./generators/policies/anti-harassment-policy";
import { buildTemplate as codeOfConduct } from "./generators/policies/code-of-conduct";
import { buildTemplate as dataPrivacyPolicyEmployee } from "./generators/policies/data-privacy-policy-employee";
import { buildTemplate as employeeHandbookTemplate } from "./generators/policies/employee-handbook-template";
import { buildTemplate as employmentContractFixedTerm } from "./generators/contracts/employment-contract-fixed-term";
import { buildTemplate as employmentContractPermanent } from "./generators/contracts/employment-contract-permanent";
import { buildTemplate as independentContractorAgreement } from "./generators/contracts/independent-contractor-agreement";
import { buildTemplate as ndaConfidentiality } from "./generators/contracts/nda-confidentiality";
import { buildTemplate as offerLetter } from "./generators/contracts/offer-letter";
import { buildTemplate as remoteWorkPolicy } from "./generators/policies/remote-work-policy";
import { buildTemplate as socialMediaPolicy } from "./generators/policies/social-media-policy";
import { buildTemplate as travelAndExpensePolicy } from "./generators/policies/travel-and-expense-policy";
import { buildTemplate as whistleblowerPolicy } from "./generators/policies/whistleblower-policy";
import { buildTemplate as quarterlyCheckIn } from "./generators/performance/quarterly-check-in";
import { buildTemplate as probationReview } from "./generators/performance/probation-review";
import { buildTemplate as pip } from "./generators/performance/performance-improvement-plan-pip";
import { buildTemplate as feedback360 } from "./generators/performance/360-feedback-form";
import { buildTemplate as jobDescription } from "./generators/recruitment/job-description";
import { buildTemplate as interviewScorecard } from "./generators/recruitment/interview-scorecard";
import { buildTemplate as referenceCheckForm } from "./generators/recruitment/reference-check-form";
import { buildTemplate as offerLetterAcceptanceForm } from "./generators/onboarding/offer-letter-acceptance-form";
import { buildTemplate as newHireChecklist } from "./generators/onboarding/new-hire-checklist";
import { buildTemplate as employeeInformationForm } from "./generators/onboarding/employee-information-form";
import { buildTemplate as resignationAcceptanceLetter } from "./generators/offboarding/resignation-acceptance-letter";
import { buildTemplate as terminationLetter } from "./generators/offboarding/termination-letter";
import { buildTemplate as exitInterviewForm } from "./generators/offboarding/exit-interview-form";
import { buildTemplate as verbalWarningRecord } from "./generators/discipline/verbal-warning-record";
import { buildTemplate as writtenWarning } from "./generators/discipline/written-warning";
import { buildTemplate as finalSettlementStatement } from "./generators/payroll/final-settlement-statement";

export type TemplateBuilder = (vars?: TemplateVariables, variant?: TemplateVariant) => Document;

export const TEMPLATE_BUILDERS: Record<string, TemplateBuilder> = {
  "employment-contract-permanent": employmentContractPermanent,
  "employment-contract-fixed-term": employmentContractFixedTerm,
  "independent-contractor-agreement": independentContractorAgreement,
  "nda-confidentiality": ndaConfidentiality,
  "offer-letter": offerLetter,
  "employee-handbook-template": employeeHandbookTemplate,
  "remote-work-policy": remoteWorkPolicy,
  "anti-harassment-policy": antiHarassmentPolicy,
  "code-of-conduct": codeOfConduct,
  "data-privacy-policy-employee": dataPrivacyPolicyEmployee,
  "social-media-policy": socialMediaPolicy,
  "travel-and-expense-policy": travelAndExpensePolicy,
  "whistleblower-policy": whistleblowerPolicy,
  "annual-performance-review": annualPerformanceReview,
  "quarterly-check-in": quarterlyCheckIn,
  "probation-review": probationReview,
  "performance-improvement-plan-pip": pip,
  "360-feedback-form": feedback360,
  "job-description": jobDescription,
  "interview-scorecard": interviewScorecard,
  "reference-check-form": referenceCheckForm,
  "offer-letter-acceptance-form": offerLetterAcceptanceForm,
  "new-hire-checklist": newHireChecklist,
  "employee-information-form": employeeInformationForm,
  "resignation-acceptance-letter": resignationAcceptanceLetter,
  "termination-letter": terminationLetter,
  "exit-interview-form": exitInterviewForm,
  "verbal-warning-record": verbalWarningRecord,
  "written-warning": writtenWarning,
  "final-settlement-statement": finalSettlementStatement,
};

export function getTemplateBuilder(slug: string) {
  return TEMPLATE_BUILDERS[slug];
}
