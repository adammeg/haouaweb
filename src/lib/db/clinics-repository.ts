import { MongoServerError } from "mongodb";
import { nanoid } from "nanoid";
import { getDb } from "./mongo";

export type ClinicRecord = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
};

const COL = "clinics";

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export async function createClinic(input: {
  name: string;
  slug?: string;
}): Promise<
  { ok: true; clinic: ClinicRecord } | { ok: false; error: "slug_taken" }
> {
  const desired = (input.slug?.trim() || slugify(input.name)) || "clinique";
  const suffix = nanoid(6).toLowerCase();
  const slug = `${desired}-${suffix}`;

  const clinic: ClinicRecord = {
    id: `cl_${nanoid(12)}`,
    name: input.name.trim(),
    slug,
    createdAt: new Date().toISOString(),
  };

  try {
    const db = await getDb();
    await db.collection(COL).insertOne(clinic);
    return { ok: true, clinic };
  } catch (e) {
    if (e instanceof MongoServerError && e.code === 11000) {
      return { ok: false, error: "slug_taken" };
    }
    throw e;
  }
}

export async function findClinicById(id: string): Promise<ClinicRecord | null> {
  const db = await getDb();
  return await db.collection(COL).findOne<ClinicRecord>({ id });
}

export async function findClinicBySlug(
  slug: string,
): Promise<ClinicRecord | null> {
  const db = await getDb();
  return await db.collection(COL).findOne<ClinicRecord>({ slug });
}

export async function listClinics(): Promise<ClinicRecord[]> {
  const db = await getDb();
  const rows = await db
    .collection(COL)
    .find(
      {},
      {
        projection: { _id: 0, id: 1, name: 1, slug: 1, createdAt: 1 },
      },
    )
    .sort({ createdAt: -1 })
    .toArray();
  return rows as unknown as ClinicRecord[];
}

