import { nanoid } from "nanoid";
import { getDb } from "./mongo";
import type { ProtocolItem } from "@/lib/protocols/catalog";

export type ManagedProtocol = ProtocolItem & {
  source: "admin";
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

const COL = "admin_protocols";

export async function listManagedProtocols(includeInactive = false): Promise<ManagedProtocol[]> {
  const db = await getDb();
  const rows = await db.collection(COL).find(includeInactive ? {} : { active: true }, { projection: { _id: 0 } }).sort({ updatedAt: -1 }).toArray();
  return rows as unknown as ManagedProtocol[];
}

export async function createManagedProtocol(input: Omit<ProtocolItem, "id">): Promise<ManagedProtocol> {
  const now = new Date().toISOString();
  const item: ManagedProtocol = { ...input, id: `proto_${nanoid(10)}`, source: "admin", active: true, createdAt: now, updatedAt: now };
  const db = await getDb();
  await db.collection(COL).insertOne(item);
  return item;
}

export async function updateManagedProtocol(id: string, patch: Partial<Omit<ManagedProtocol, "id" | "source" | "createdAt">>): Promise<boolean> {
  const db = await getDb();
  const result = await db.collection(COL).updateOne({ id }, { $set: { ...patch, updatedAt: new Date().toISOString() } });
  return result.matchedCount === 1;
}

export async function deleteManagedProtocol(id: string): Promise<boolean> {
  const db = await getDb();
  const result = await db.collection(COL).deleteOne({ id, source: "admin" });
  return result.deletedCount === 1;
}
