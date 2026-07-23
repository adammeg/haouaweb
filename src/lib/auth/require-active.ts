import { getDb } from "@/lib/db/mongo";

export async function isDoctorActive(doctorId: string): Promise<boolean> {
  const db = await getDb();
  const row = await db.collection("doctors").findOne(
    { id: doctorId },
    { projection: { _id: 0, active: 1, role: 1, doctorId: 1 } },
  );
  if (!row) return false;
  if (row.active === false) return false;
  if (row.role === "secretary" && typeof row.doctorId === "string") {
    const owner = await db.collection("doctors").findOne(
      { id: row.doctorId },
      { projection: { _id: 0, active: 1 } },
    );
    return Boolean(owner && owner.active !== false);
  }
  return true;
}
