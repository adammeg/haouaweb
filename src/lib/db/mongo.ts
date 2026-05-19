import { MongoClient, type Db } from "mongodb";

const globalForMongo = globalThis as unknown as {
  _hawaeMongoClient?: MongoClient;
};

function requireUri(): string {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) {
    throw new Error(
      "MONGODB_URI is not set. Example: mongodb://127.0.0.1:27017/hawae_md",
    );
  }
  return uri;
}

export function getMongoDbName(): string {
  return process.env.MONGODB_DB_NAME?.trim() || "hawae_md";
}

export async function getMongoClient(): Promise<MongoClient> {
  if (globalForMongo._hawaeMongoClient) {
    return globalForMongo._hawaeMongoClient;
  }
  // Avoid optional native deps being pulled into bundles (kerberos/snappy/etc).
  const client = new MongoClient(requireUri(), {
    autoEncryption: undefined,
  } as unknown as ConstructorParameters<typeof MongoClient>[1]);
  await client.connect();
  globalForMongo._hawaeMongoClient = client;
  return client;
}

let indexesPromise: Promise<void> | null = null;

async function ensureIndexes(db: Db): Promise<void> {
  await Promise.all([
    db.collection("doctors").createIndex({ email: 1 }, { unique: true }),
    db.collection("doctors").createIndex({ id: 1 }, { unique: true }),
    db.collection("doctors").createIndex({ clinicId: 1 }),
    db.collection("doctors").createIndex({ clinicId: 1, role: 1 }),
    db.collection("doctors").createIndex({ active: 1 }),
    db.collection("doctors").createIndex({ role: 1 }),
    db.collection("clinics").createIndex({ id: 1 }, { unique: true }),
    db.collection("clinics").createIndex({ slug: 1 }, { unique: true }),
    db.collection("workspaces").createIndex({ doctorId: 1 }, { unique: true }),
    db
      .collection("doctor_clinical_bundles")
      .createIndex({ doctorId: 1 }, { unique: true }),
    db.collection("doctor_modules").createIndex({ doctorId: 1 }, { unique: true }),
    db
      .collection("ivf_records")
      .createIndex({ doctorId: 1, patientId: 1 }, { unique: true }),
    db
      .collection("ai_training_full_records")
      .createIndex({ doctorId: 1, patientId: 1 }, { unique: true }),
    db.collection("ai_training_full_records").createIndex({ ingestedAt: -1 }),
    db.collection("doctor_settings").createIndex({ doctorId: 1 }, { unique: true }),
  ]);
}

export async function getDb(): Promise<Db> {
  const client = await getMongoClient();
  const db = client.db(getMongoDbName());
  if (!indexesPromise) {
    indexesPromise = ensureIndexes(db).catch((e) => {
      indexesPromise = null;
      throw e;
    });
  }
  await indexesPromise;
  return db;
}
