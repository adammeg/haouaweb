import { getDb } from "./mongo";
import type { IvfAnalysis, IvfPatientProfile } from "@/lib/pma/ivf-types";
import type { IvfProfile } from "@/types/modules";

const COL = "ivf_records";

export type IvfPatientRecord = {
  doctorId: string;
  patientId: string;
  profile: IvfPatientProfile;
  analysis: IvfAnalysis | null;
  cycles: IvfProfile[];
  updatedAt: Date;
};

export async function getIvfRecord(
  doctorId: string,
  patientId: string,
): Promise<IvfPatientRecord | null> {
  const db = await getDb();
  const doc = await db.collection(COL).findOne({ doctorId, patientId });
  if (!doc) return null;
  return {
    doctorId,
    patientId,
    profile: doc.profile as IvfPatientProfile,
    analysis: (doc.analysis as IvfAnalysis | null) ?? null,
    cycles: Array.isArray(doc.cycles) ? (doc.cycles as IvfProfile[]) : [],
    updatedAt:
      doc.updatedAt instanceof Date ? doc.updatedAt : new Date(doc.updatedAt),
  };
}

export async function upsertIvfRecord(
  doctorId: string,
  patientId: string,
  patch: Partial<
    Pick<IvfPatientRecord, "profile" | "analysis" | "cycles">
  >,
): Promise<string> {
  const db = await getDb();
  const now = new Date();
  const $set: Record<string, unknown> = { updatedAt: now };
  if (patch.profile !== undefined) $set.profile = patch.profile;
  if (patch.analysis !== undefined) $set.analysis = patch.analysis;
  if (patch.cycles !== undefined) $set.cycles = patch.cycles;

  await db.collection(COL).updateOne(
    { doctorId, patientId },
    {
      $set: { doctorId, patientId, ...$set },
      $setOnInsert: { cycles: [] },
    },
    { upsert: true },
  );
  return now.toISOString();
}

export async function deleteIvfRecord(
  doctorId: string,
  patientId: string,
): Promise<void> {
  const db = await getDb();
  await db.collection(COL).deleteOne({ doctorId, patientId });
}

export async function listIvfCyclesForDoctor(
  doctorId: string,
): Promise<IvfProfile[]> {
  const db = await getDb();
  const cursor = db.collection(COL).find({ doctorId });
  const all: IvfProfile[] = [];
  for await (const doc of cursor) {
    if (Array.isArray(doc.cycles)) {
      all.push(...(doc.cycles as IvfProfile[]));
    }
  }
  return all.sort(
    (a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}
