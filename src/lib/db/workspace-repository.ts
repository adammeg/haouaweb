import { getDb } from "./mongo";
import type {
  ConsultationEntry,
  PatientSnapshot,
  UserProfile,
} from "@/types/domain";

const COL = "workspaces";

export type WorkspacePersisted = {
  users: UserProfile[];
  currentUserId: string | null;
  patientsByUser: Record<string, Record<string, PatientSnapshot>>;
  historyByUser: Record<string, Record<string, ConsultationEntry[]>>;
  setupDone: boolean;
  workspaceSavedAt: string | null;
};

export async function getWorkspaceByDoctorId(
  doctorId: string,
): Promise<{ updatedAt: string; workspace: WorkspacePersisted } | null> {
  const db = await getDb();
  const doc = await db.collection(COL).findOne({ doctorId });
  if (!doc || !doc.updatedAt) return null;
  const updatedAt = doc.updatedAt instanceof Date ? doc.updatedAt : new Date(doc.updatedAt);
  return {
    updatedAt: updatedAt.toISOString(),
    workspace: {
      users: Array.isArray(doc.users) ? doc.users : [],
      currentUserId: typeof doc.currentUserId === "string" ? doc.currentUserId : null,
      patientsByUser:
        doc.patientsByUser && typeof doc.patientsByUser === "object"
          ? (doc.patientsByUser as WorkspacePersisted["patientsByUser"])
          : {},
      historyByUser:
        doc.historyByUser && typeof doc.historyByUser === "object"
          ? (doc.historyByUser as WorkspacePersisted["historyByUser"])
          : {},
      setupDone: Boolean(doc.setupDone),
      workspaceSavedAt:
        typeof doc.workspaceSavedAt === "string" ? doc.workspaceSavedAt : null,
    },
  };
}

export async function upsertWorkspace(
  doctorId: string,
  workspace: WorkspacePersisted,
): Promise<string> {
  const db = await getDb();
  const now = new Date();
  await db.collection(COL).updateOne(
    { doctorId },
    {
      $set: {
        doctorId,
        ...workspace,
        updatedAt: now,
      },
    },
    { upsert: true },
  );
  return now.toISOString();
}
