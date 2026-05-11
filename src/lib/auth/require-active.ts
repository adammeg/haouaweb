import { getDb } from "@/lib/db/mongo";

export async function isDoctorActive(doctorId: string): Promise<boolean> {
  const db = await getDb();
  const row = await db.collection("doctors").findOne(
    { id: doctorId },
    { projection: { _id: 0, active: 1 } },
  );
  if (!row) return false;
  return row.active !== false;
}

