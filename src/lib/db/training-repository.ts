import { nanoid } from "nanoid";
import { getDb } from "./mongo";
import type { ClinicalTrainingSample, TrainingDatasetStats } from "@/types/training";
import type { AnonymizedClinicalRecord } from "@/types/training";

const COL = "clinical_training_samples";

export async function upsertTrainingSample(input: {
  doctorId: string;
  record: AnonymizedClinicalRecord;
  contentHash: string;
  consentVersion: string;
  sourceUpdatedAt: string;
}): Promise<"inserted" | "updated" | "unchanged"> {
  const db = await getDb();
  const existing = await db.collection(COL).findOne({
    doctorId: input.doctorId,
    patientRef: input.record.patientRef,
  });

  if (existing && existing.contentHash === input.contentHash) {
    return "unchanged";
  }

  const now = new Date();
  const doc: ClinicalTrainingSample = {
    id: existing?.id ?? "cts_" + nanoid(12),
    doctorId: input.doctorId,
    patientRef: input.record.patientRef,
    workspaceUserId: input.record.workspaceUserId,
    specialty: input.record.specialty,
    ageBand: input.record.ageBand,
    ageYears: input.record.ageYears,
    contentHash: input.contentHash,
    clinical: input.record.clinical,
    clinicalText: input.record.clinicalText,
    historyConsultationCount: input.record.historyConsultationCount,
    consentVersion: input.consentVersion,
    sourceUpdatedAt: input.sourceUpdatedAt,
    ingestedAt: now.toISOString(),
  };

  await db.collection(COL).updateOne(
    { doctorId: input.doctorId, patientRef: input.record.patientRef },
    { $set: doc },
    { upsert: true },
  );

  return existing ? "updated" : "inserted";
}

export async function getTrainingDatasetStats(): Promise<TrainingDatasetStats> {
  const db = await getDb();
  const col = db.collection(COL);

  const [totalSamples, doctors, last, bySpec] = await Promise.all([
    col.countDocuments(),
    col.distinct("doctorId"),
    col.findOne({}, { sort: { ingestedAt: -1 }, projection: { ingestedAt: 1 } }),
    col
      .aggregate<{ _id: string; count: number }>([
        { $group: { _id: "$specialty", count: { $sum: 1 } } },
      ])
      .toArray(),
  ]);

  const bySpecialty: Record<string, number> = {};
  for (const row of bySpec) {
    bySpecialty[row._id || "unknown"] = row.count;
  }

  return {
    totalSamples,
    totalDoctors: doctors.length,
    bySpecialty,
    lastIngestedAt:
      typeof last?.ingestedAt === "string" ? last.ingestedAt : null,
  };
}

export async function exportTrainingSamplesForMl(limit = 5000): Promise<
  Omit<ClinicalTrainingSample, "doctorId">[]
> {
  const db = await getDb();
  const rows = await db
    .collection(COL)
    .find(
      {},
      {
        projection: {
          _id: 0,
          doctorId: 0,
        },
      },
    )
    .sort({ ingestedAt: -1 })
    .limit(limit)
    .toArray();
  return rows as unknown as Omit<ClinicalTrainingSample, "doctorId">[];
}
