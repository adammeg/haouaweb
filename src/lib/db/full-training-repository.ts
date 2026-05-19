import { nanoid } from "nanoid";
import { getDb } from "./mongo";
import type {
  FullPatientTrainingRecord,
  TrainingDatasetStats,
} from "@/types/training";

const COL = "ai_training_full_records";

export async function upsertFullTrainingRecord(input: {
  doctorId: string;
  patientId: string;
  workspaceUserId: string;
  record: Omit<
    FullPatientTrainingRecord,
    | "id"
    | "doctorId"
    | "patientId"
    | "workspaceUserId"
    | "contentHash"
    | "consentVersion"
    | "sourceUpdatedAt"
    | "ingestedAt"
  >;
  contentHash: string;
  consentVersion: string;
  sourceUpdatedAt: string;
}): Promise<"inserted" | "updated" | "unchanged"> {
  const db = await getDb();
  const existing = await db.collection(COL).findOne({
    doctorId: input.doctorId,
    patientId: input.patientId,
  });

  if (existing && existing.contentHash === input.contentHash) {
    return "unchanged";
  }

  const now = new Date().toISOString();
  const doc: FullPatientTrainingRecord = {
    id: existing?.id ?? "ftf_" + nanoid(12),
    doctorId: input.doctorId,
    patientId: input.patientId,
    workspaceUserId: input.workspaceUserId,
    contentHash: input.contentHash,
    consentVersion: input.consentVersion,
    sourceUpdatedAt: input.sourceUpdatedAt,
    ingestedAt: now,
    ...input.record,
  };

  await db.collection(COL).updateOne(
    { doctorId: input.doctorId, patientId: input.patientId },
    { $set: doc },
    { upsert: true },
  );

  return existing ? "updated" : "inserted";
}

export async function getFullTrainingDatasetStats(): Promise<TrainingDatasetStats> {
  const db = await getDb();
  const col = db.collection(COL);

  const [totalSamples, doctors, last, bySpec] = await Promise.all([
    col.countDocuments(),
    col.distinct("doctorId"),
    col.findOne({}, { sort: { ingestedAt: -1 }, projection: { ingestedAt: 1 } }),
    col
      .aggregate<{ _id: string; count: number }>([
        {
          $group: {
            _id: "$patient.specialite",
            count: { $sum: 1 },
          },
        },
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

export async function exportFullTrainingRecords(limit = 2000): Promise<
  Omit<FullPatientTrainingRecord, "doctorId">[]
> {
  const db = await getDb();
  const rows = await db
    .collection(COL)
    .find({}, { projection: { _id: 0, doctorId: 0 } })
    .sort({ ingestedAt: -1 })
    .limit(limit)
    .toArray();
  return rows as unknown as Omit<FullPatientTrainingRecord, "doctorId">[];
}
