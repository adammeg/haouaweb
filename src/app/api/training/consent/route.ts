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
    const settings = await getDoctorAiTrainingSettings(session.sub);
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
    let body: { enabled?: boolean };
    try {
      body = await req.json();
    } catch {
      return withCors(
        NextResponse.json({ error: "bad_json" }, { status: 400 }),
        req,
      );
    }
    if (typeof body.enabled !== "boolean") {
      return withCors(
        NextResponse.json({ error: "missing_enabled" }, { status: 400 }),
        req,
      );
    }
    const settings = await setDoctorAiTrainingConsent(
      session.sub,
      body.enabled,
    );
    return withCors(
      NextResponse.json({
        settings,
        consentVersion: AI_TRAINING_CONSENT_VERSION,
      }),
      req,
    );
  } catch (e) {
    return withCors(dbError("training.consent.PATCH", e), req);
  }
}
