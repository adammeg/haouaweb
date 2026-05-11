import { MongoServerError } from "mongodb";
import { nanoid } from "nanoid";
import { getDb } from "./mongo";

export type DoctorRecord = {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  /** null/undefined => independent doctor */
  clinicId?: string | null;
  /** doctor = normal member; clinic_admin = clinic owner/admin; app_admin = global admin */
  role?: "doctor" | "clinic_admin" | "app_admin";
  /** false => cannot login or access app */
  active?: boolean;
  createdAt: string;
};

const COL = "doctors";

export async function findDoctorByEmail(
  email: string,
): Promise<DoctorRecord | null> {
  const norm = email.trim().toLowerCase();
  const db = await getDb();
  const doc = await db.collection(COL).findOne<DoctorRecord>({ email: norm });
  return doc;
}

export async function listDoctorsAll(): Promise<
  Pick<
    DoctorRecord,
    "id" | "email" | "name" | "role" | "clinicId" | "createdAt" | "active"
  >[]
> {
  const db = await getDb();
  const rows = await db
    .collection(COL)
    .find(
      {},
      {
        projection: {
          _id: 0,
          id: 1,
          email: 1,
          name: 1,
          role: 1,
          clinicId: 1,
          createdAt: 1,
          active: 1,
        },
      },
    )
    .sort({ createdAt: -1 })
    .toArray();
  return rows as unknown as Pick<
    DoctorRecord,
    "id" | "email" | "name" | "role" | "clinicId" | "createdAt" | "active"
  >[];
}

export async function setDoctorActiveById(input: {
  id: string;
  active: boolean;
}): Promise<boolean> {
  const db = await getDb();
  const res = await db.collection(COL).updateOne(
    { id: input.id },
    {
      $set: { active: input.active },
    },
  );
  return res.matchedCount === 1;
}

export async function listDoctorsByClinicId(
  clinicId: string,
): Promise<Pick<DoctorRecord, "id" | "email" | "name" | "role" | "createdAt">[]> {
  const db = await getDb();
  const rows = await db
    .collection(COL)
    .find(
      { clinicId },
      {
        projection: {
          _id: 0,
          id: 1,
          email: 1,
          name: 1,
          role: 1,
          createdAt: 1,
        },
      },
    )
    .sort({ createdAt: -1 })
    .toArray();
  return rows as unknown as Pick<
    DoctorRecord,
    "id" | "email" | "name" | "role" | "createdAt"
  >[];
}

export async function createDoctor(input: {
  email: string;
  passwordHash: string;
  name: string;
  clinicId?: string | null;
  role?: "doctor" | "clinic_admin" | "app_admin";
  active?: boolean;
}): Promise<
  { ok: true; doctor: DoctorRecord } | { ok: false; error: "email_taken" }
> {
  const norm = input.email.trim().toLowerCase();
  const doctor: DoctorRecord = {
    id: `doc_${nanoid(12)}`,
    email: norm,
    passwordHash: input.passwordHash,
    name: input.name.trim(),
    clinicId: input.clinicId ?? null,
    role: input.role ?? "doctor",
    active: input.active ?? true,
    createdAt: new Date().toISOString(),
  };
  try {
    const db = await getDb();
    await db.collection(COL).insertOne(doctor);
    return { ok: true, doctor };
  } catch (e) {
    if (e instanceof MongoServerError && e.code === 11000) {
      return { ok: false, error: "email_taken" };
    }
    throw e;
  }
}
