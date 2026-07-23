import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { isDoctorActive } from "@/lib/auth/require-active";
import { createClinic, deleteEmptyClinic, listClinics } from "@/lib/db/clinics-repository";
import { deleteDoctorAndData, listDoctorsAll, setDoctorActiveById } from "@/lib/auth/doctor-store";
import { dbError } from "@/lib/api/error-response";
import { getDoctorPatientMetrics, getPlatformMetrics } from "@/lib/admin/platform-metrics";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!(await isDoctorActive(session.sub))) {
    return NextResponse.json({ error: "account_disabled" }, { status: 403 });
  }
  if (session.role !== "app_admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  try {
    const rawDays = new URL(req.url).searchParams.get("days") ?? "30";
    const days = rawDays === "all" ? null : Math.min(3650, Math.max(1, Number(rawDays) || 30));
    const from = days === null ? null : new Date(Date.now() - days * 86_400_000);
    const [clinics, doctors, metrics, patientMetrics] = await Promise.all([
      listClinics(),
      listDoctorsAll(),
      getPlatformMetrics(),
      getDoctorPatientMetrics(from),
    ]);
    return NextResponse.json({
      clinics,
      doctors,
      metrics,
      patientMetrics,
      patientPeriod: { days, from: from?.toISOString() ?? null },
    });
  } catch (e) {
    return dbError("admin.overview.GET", e);
  }
}

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!(await isDoctorActive(session.sub))) {
    return NextResponse.json({ error: "account_disabled" }, { status: 403 });
  }
  if (session.role !== "app_admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let body: { doctorId?: string; active?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  const doctorId = body.doctorId?.trim() ?? "";
  const active = body.active;
  if (!doctorId || typeof active !== "boolean") {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }
  if (doctorId === session.sub && active === false) {
    return NextResponse.json({ error: "cannot_disable_self" }, { status: 400 });
  }

  try {
    const ok = await setDoctorActiveById({ id: doctorId, active });
    if (!ok) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return dbError("admin.overview.PATCH", e);
  }
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!(await isDoctorActive(session.sub)) || session.role !== "app_admin") return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const body = await req.json().catch(() => null) as { type?: string; name?: string } | null;
  if (body?.type !== "clinic" || !body.name?.trim()) return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  try {
    const result = await createClinic({ name: body.name.trim().slice(0, 120) });
    return result.ok ? NextResponse.json({ clinic: result.clinic }, { status: 201 }) : NextResponse.json({ error: result.error }, { status: 409 });
  } catch (e) { return dbError("admin.overview.POST", e); }
}

export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!(await isDoctorActive(session.sub)) || session.role !== "app_admin") return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const body = await req.json().catch(() => null) as { type?: "doctor" | "clinic"; id?: string; confirm?: string } | null;
  const id = body?.id?.trim();
  if (!id || body?.confirm !== id) return NextResponse.json({ error: "confirmation_required" }, { status: 400 });
  if (id === session.sub) return NextResponse.json({ error: "cannot_delete_self" }, { status: 400 });
  try {
    if (body.type === "doctor") {
      const ok = await deleteDoctorAndData(id);
      return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "not_found_or_protected" }, { status: 404 });
    }
    if (body.type === "clinic") {
      const result = await deleteEmptyClinic(id);
      return result === "deleted" ? NextResponse.json({ ok: true }) : NextResponse.json({ error: result }, { status: result === "not_empty" ? 409 : 404 });
    }
    return NextResponse.json({ error: "invalid_type" }, { status: 400 });
  } catch (e) { return dbError("admin.overview.DELETE", e); }
}
