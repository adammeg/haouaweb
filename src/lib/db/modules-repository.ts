import { getDb } from "./mongo";
import type { ModulesWorkspace } from "@/types/modules";

const COL = "doctor_modules";

export type ModulesPersisted = {
  doctorId: string;
  workspaceByUser: Record<string, ModulesWorkspace>;
  updatedAt: Date;
};

export async function getModulesByDoctorId(
  doctorId: string,
): Promise<{ updatedAt: string; workspaceByUser: Record<string, ModulesWorkspace> } | null> {
  const db = await getDb();
  const doc = await db.collection(COL).findOne({ doctorId });
  if (!doc) return null;
  const updatedAt =
    doc.updatedAt instanceof Date ? doc.updatedAt : new Date(doc.updatedAt);
  const workspaceByUser =
    doc.workspaceByUser && typeof doc.workspaceByUser === "object"
      ? (doc.workspaceByUser as Record<string, ModulesWorkspace>)
      : {};
  return { updatedAt: updatedAt.toISOString(), workspaceByUser };
}

export async function upsertModules(
  doctorId: string,
  workspaceByUser: Record<string, ModulesWorkspace>,
): Promise<string> {
  const db = await getDb();
  const now = new Date();
  await db.collection(COL).updateOne(
    { doctorId },
    { $set: { doctorId, workspaceByUser, updatedAt: now } },
    { upsert: true },
  );
  return now.toISOString();
}
