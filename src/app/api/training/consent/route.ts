import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";
import { withCors, optionsResponse } from "@/lib/api/cors";
import { isDoctorActive } from "@/lib/auth/require-active";
import {
  getDoctorAiTrainingSettings,
  setDoctorAiTrainingConsent,
} from "@/lib/db/doctor-settings-repository";
import { AI_TRAINING_CONSENT_VERSION } from "@/types/training";
import { dbError } from "@/lib/api/error-response";
import { deleteFullTrainingRecordsForDoctor } from "@/lib/db/full-training-repository";
import { deleteLearningRecordsForDoctor } from "@/lib/db/ai-learning-repository";
import { getDb } from "@/lib/db/mongo";

export const dynamic = "force-dynamic";

export function OPTIONS(req: Request) {
  return optionsResponse(req);
}

export async function GET(req: Request) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return withCors(
        NextResponse.json({ error: "unauthorized" }, { status: 401 }),
        req,
      );
    }
    if (!(await isDoctorActive(session.sub))) {
      return withCors(
        NextResponse.json({ error: "account_disabled" }, { status: 403 }),
        req,
      );
    }
    if (session.role === "secretary") return withCors(NextResponse.json({ error: "forbidden" }, { status: 403 }), req);
    const settings = await getDoctorAiTrainingSettings(session.doctorId);
    return withCors(
      NextResponse.json({
        settings,
        consentVersion: AI_TRAINING_CONSENT_VERSION,
      }),
      req,
    );
  } catch (e) {
    return withCors(dbError("training.consent.GET", e), req);
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return withCors(
        NextResponse.json({ error: "unauthorized" }, { status: 401 }),
        req,
      );
    }
    if (!(await isDoctorActive(session.sub))) {
      return withCors(
        NextResponse.json({ error: "account_disabled" }, { status: 403 }),
        req,
      );
    }
    if (session.role === "secretary") return withCors(NextResponse.json({ error: "forbidden" }, { status: 403 }), req);
    let body: { enabled?: boolean } | null;
    try {
      body = await req.json();
    } catch {
      return withCors(
        NextResponse.json({ error: "bad_json" }, { status: 400 }),
        req,
      );
    }
    if (!body || typeof body.enabled !== "boolean") {
      return withCors(
        NextResponse.json({ error: "missing_enabled" }, { status: 400 }),
        req,
      );
    }
    const settings = await setDoctorAiTrainingConsent(
      session.doctorId,
      body.enabled,
    );
    const deletedRecords = body.enabled
      ? 0
      : await deleteFullTrainingRecordsForDoctor(session.doctorId);
    let deletedLearningRecords = 0;
    if (!body.enabled) {
      deletedLearningRecords = await deleteLearningRecordsForDoctor(session.doctorId);
      const db = await getDb();
      await db.collection("clinical_training_samples").deleteMany({ doctorId: session.doctorId });
    }
    return withCors(
      NextResponse.json({
        settings,
        consentVersion: AI_TRAINING_CONSENT_VERSION,
        deletedRecords,
        deletedLearningRecords,
      }),
      req,
    );
  } catch (e) {
    return withCors(dbError("training.consent.PATCH", e), req);
  }
}
