import { getDb } from "./mongo";
import type { DoctorClinicalBundle } from "@/types/clinical-bundle";
import { EMPTY_CLINICAL_BUNDLE } from "@/types/clinical-bundle";

const COL = "doctor_clinical_bundles";

export async function getClinicalBundleByDoctorId(
  doctorId: string,
): Promise<{ updatedAt: string; bundle: DoctorClinicalBundle } | null> {
  const db = await getDb();
  const doc = await db.collection(COL).findOne({ doctorId });
  if (!doc) return null;
  const updatedAt =
    doc.updatedAt instanceof Date
      ? doc.updatedAt.toISOString()
      : new Date().toISOString();
  const bundle = doc.bundle as DoctorClinicalBundle | undefined;
  return {
    updatedAt,
    bundle: bundle ?? EMPTY_CLINICAL_BUNDLE,
  };
}

export async function upsertClinicalBundle(
  doctorId: string,
  bundle: DoctorClinicalBundle,
): Promise<string> {
  const db = await getDb();
  const now = new Date();
  await db.collection(COL).updateOne(
    { doctorId },
    {
      $set: {
        doctorId,
        bundle,
        updatedAt: now,
      },
    },
    { upsert: true },
  );
  return now.toISOString();
}
