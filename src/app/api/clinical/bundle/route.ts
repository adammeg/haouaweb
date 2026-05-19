import { NextResponse } from "next/server";
import { dbError } from "@/lib/api/error-response";
import { withCors, optionsResponse } from "@/lib/api/cors";
import { jsonError, requireDoctor } from "@/lib/api/require-doctor";
import {
  getClinicalBundleByDoctorId,
  upsertClinicalBundle,
} from "@/lib/db/clinical-bundle-repository";
import { upsertModules } from "@/lib/db/modules-repository";
import type { DoctorClinicalBundle } from "@/types/clinical-bundle";
import { EMPTY_CLINICAL_BUNDLE } from "@/types/clinical-bundle";
import { ingestAllFullTrainingData } from "@/lib/training/ingest-full";

export const dynamic = "force-dynamic";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function parseBundle(raw: unknown): DoctorClinicalBundle | null {
  if (!isRecord(raw)) return null;
  const modulesByUser = isRecord(raw.modulesByUser)
    ? (raw.modulesByUser as DoctorClinicalBundle["modulesByUser"])
    : {};
  const agendaRaw = isRecord(raw.agenda) ? raw.agenda : {};
  const rappelsRaw = isRecord(raw.rappels) ? raw.rappels : {};
  return {
    modulesByUser,
    agenda: {
      rdvList: Array.isArray(agendaRaw.rdvList) ? agendaRaw.rdvList : [],
      weekOffset:
        typeof agendaRaw.weekOffset === "number" ? agendaRaw.weekOffset : 0,
    },
    rappels: {
      list: Array.isArray(rappelsRaw.list) ? rappelsRaw.list : [],
      contacts: Array.isArray(rappelsRaw.contacts) ? rappelsRaw.contacts : [],
      readNotifs: Array.isArray(rappelsRaw.readNotifs)
        ? rappelsRaw.readNotifs
        : [],
    },
  };
}

export function OPTIONS(req: Request) {
  return optionsResponse(req);
}

export async function GET(req: Request) {
  const auth = await requireDoctor(req);
  if (auth instanceof NextResponse) return withCors(auth, req);

  try {
    const row = await getClinicalBundleByDoctorId(auth.doctor.sub);
    if (!row) {
      return withCors(
        NextResponse.json({ empty: true, bundle: EMPTY_CLINICAL_BUNDLE }),
        req,
      );
    }
    return withCors(
      NextResponse.json({
        empty: false,
        updatedAt: row.updatedAt,
        bundle: row.bundle,
      }),
      req,
    );
  } catch (e) {
    return withCors(dbError("clinical.bundle.GET", e), req);
  }
}

export async function PUT(req: Request) {
  const auth = await requireDoctor(req);
  if (auth instanceof NextResponse) return withCors(auth, req);

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return withCors(jsonError("bad_json", 400), req);
  }

  const bundle = parseBundle(isRecord(raw) ? raw.bundle ?? raw : raw);
  if (!bundle) {
    return withCors(jsonError("invalid_body", 400), req);
  }

  try {
    await upsertModules(auth.doctor.sub, bundle.modulesByUser);
    const updatedAt = await upsertClinicalBundle(auth.doctor.sub, bundle);
    void ingestAllFullTrainingData(auth.doctor.sub).catch((err) =>
      console.error("[training] bundle ingest failed", err),
    );
    return withCors(NextResponse.json({ ok: true, updatedAt }), req);
  } catch (e) {
    return withCors(dbError("clinical.bundle.PUT", e), req);
  }
}
