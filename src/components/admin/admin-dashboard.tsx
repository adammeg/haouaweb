"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type ClinicRow = { id: string; name: string; slug: string; createdAt: string };
type DoctorRow = {
  id: string;
  email: string;
  name: string;
  role?: "doctor" | "clinic_admin" | "app_admin";
  clinicId?: string | null;
  active?: boolean;
  createdAt: string;
};

export function AdminDashboard({ adminName }: { adminName: string }) {
  const [clinics, setClinics] = useState<ClinicRow[]>([]);
  const [doctors, setDoctors] = useState<DoctorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/admin/overview");
      const data = (await res.json()) as {
        clinics?: ClinicRow[];
        doctors?: DoctorRow[];
        error?: string;
      };
      if (!res.ok) throw new Error(data.error || res.statusText);
      setClinics(data.clinics ?? []);
      setDoctors(data.doctors ?? []);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const clinicNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of clinics) m.set(c.id, c.name);
    return m;
  }, [clinics]);

  const stats = useMemo(() => {
    const totalDocs = doctors.length;
    const disabled = doctors.filter((d) => d.active === false).length;
    const clinicsCount = clinics.length;
    const independents = doctors.filter((d) => !d.clinicId).length;
    return { totalDocs, disabled, clinicsCount, independents };
  }, [clinics.length, doctors]);

  async function setActive(doctorId: string, active: boolean) {
    setBusyId(doctorId);
    try {
      const res = await fetch("/api/admin/overview", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctorId, active }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) throw new Error(data.error || res.statusText);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--ink)]">
            Administration
          </h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Bonjour <span className="font-semibold">{adminName}</span> — gestion globale
            (cliniques, médecins, activation).
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/"
            className="rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--ink)] hover:bg-[var(--teal-pale)]/30"
          >
            Accueil
          </Link>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
          <div className="text-3xl font-bold text-[var(--teal)]">{stats.totalDocs}</div>
          <div className="text-xs font-semibold text-[var(--muted)]">Comptes médecins</div>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
          <div className="text-3xl font-bold text-[var(--ink)]">{stats.clinicsCount}</div>
          <div className="text-xs font-semibold text-[var(--muted)]">Cliniques</div>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
          <div className="text-3xl font-bold text-[var(--ink)]">{stats.independents}</div>
          <div className="text-xs font-semibold text-[var(--muted)]">Indépendants</div>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
          <div className="text-3xl font-bold text-red-600">{stats.disabled}</div>
          <div className="text-xs font-semibold text-[var(--muted)]">Désactivés</div>
        </div>
      </div>

      {err ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {err}
        </div>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-[var(--ink)]">Cliniques</h2>
            <button
              type="button"
              onClick={() => void load()}
              className="text-sm font-semibold text-[var(--teal)] hover:underline"
            >
              Rafraîchir
            </button>
          </div>
          {loading ? (
            <p className="mt-4 text-sm text-[var(--muted)]">Chargement…</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {clinics.length === 0 ? (
                <li className="text-sm text-[var(--muted)]">Aucune clinique.</li>
              ) : (
                clinics.map((c) => (
                  <li
                    key={c.id}
                    className="rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3"
                  >
                    <div className="text-sm font-semibold text-[var(--ink)]">{c.name}</div>
                    <div className="mt-1 text-xs text-[var(--muted)]">
                      ID: <span className="font-mono">{c.id}</span> · slug{" "}
                      <span className="font-mono">{c.slug}</span>
                    </div>
                  </li>
                ))
              )}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-[var(--ink)]">Médecins</h2>
            <button
              type="button"
              onClick={() => void load()}
              className="text-sm font-semibold text-[var(--teal)] hover:underline"
            >
              Rafraîchir
            </button>
          </div>

          {loading ? (
            <p className="mt-4 text-sm text-[var(--muted)]">Chargement…</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {doctors.length === 0 ? (
                <li className="text-sm text-[var(--muted)]">Aucun compte.</li>
              ) : (
                doctors.map((d) => {
                  const clinicName = d.clinicId ? clinicNameById.get(d.clinicId) : null;
                  const isDisabled = d.active === false;
                  return (
                    <li
                      key={d.id}
                      className={`rounded-xl border px-4 py-3 ${
                        isDisabled
                          ? "border-red-200 bg-red-50"
                          : "border-[var(--border)] bg-[var(--surface-raised)]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-[var(--ink)]">
                            {d.name}
                          </div>
                          <div className="truncate text-xs text-[var(--muted)]">{d.email}</div>
                          <div className="mt-1 text-[11px] text-[var(--muted)]">
                            {d.role ?? "doctor"} ·{" "}
                            {clinicName ? `Clinique: ${clinicName}` : "Indépendant"} ·{" "}
                            {isDisabled ? "Désactivé" : "Actif"}
                          </div>
                        </div>
                        <div className="shrink-0">
                          <button
                            type="button"
                            disabled={busyId === d.id || d.role === "app_admin"}
                            onClick={() => void setActive(d.id, isDisabled)}
                            className={`rounded-lg px-3 py-2 text-xs font-semibold ${
                              isDisabled
                                ? "bg-[var(--teal)] text-white"
                                : "border border-red-200 bg-white text-red-700"
                            } disabled:opacity-50`}
                            title={
                              d.role === "app_admin"
                                ? "Sécurité : pas de désactivation depuis l'UI"
                                : ""
                            }
                          >
                            {busyId === d.id
                              ? "…"
                              : isDisabled
                                ? "Réactiver"
                                : "Désactiver"}
                          </button>
                        </div>
                      </div>
                      <div className="mt-2 text-[11px] text-[var(--muted)]">
                        ID: <span className="font-mono">{d.id}</span> · Créé{" "}
                        {new Date(d.createdAt).toLocaleDateString("fr-FR")}
                      </div>
                    </li>
                  );
                })
              )}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

