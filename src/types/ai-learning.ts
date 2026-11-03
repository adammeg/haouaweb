import type { Specialty } from "./domain";

export const LEARNING_VERSION = "reviewed-cases-v1";
export type LearningSplit = "train" | "validation" | "test";
export type LearningFeatures = { specialty: Specialty | ""; values: Record<string, number | boolean | string> };
export type LearningReview = {
  verdict: "helpful" | "rejected" | "corrected";
  outcome: "pending" | "confirmed";
  confirmedDiagnosis: string;
  correctedResponse: string;
  rationale: string;
  confirmedByClinician: boolean;
  reviewedAt: string;
  reviewerId: string;
};

export interface AiLearningRecord {
  id: string;
  doctorId: string;
  patientRef: string;
  consentToken: string;
  schemaVersion: typeof LEARNING_VERSION;
  revision: string;
  mode: "diagnostic" | "question";
  question: string;
  features: LearningFeatures;
  featureHash: string;
  split: LearningSplit;
  generatedResponse: string;
  provider: string;
  model: string;
  promptVersion: string;
  knowledgeVersion: string;
  usedCaseIds: string[];
  evidenceIds: string[];
  createdAt: string;
  review: LearningReview | null;
}
export type AiLearningCase = Omit<AiLearningRecord, "generatedResponse">;

export type ReviewedCaseExample = {
  id: string;
  features: LearningFeatures;
  confirmedDiagnosis: string;
  correctedResponse: string;
  rationale: string;
  similarity: number;
};

export type LearningStatus = {
  enabled: boolean;
  captured: number;
  reviewed: number;
  confirmed: number;
  memoryEligible: number;
  rejected: number;
  helpfulRatings: number;
  validationCases: number;
  testCases: number;
  evaluationReady: boolean;
};
