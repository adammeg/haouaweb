"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type DoctorRow = {
  id: string;
  email: string;
  name: string;
  role?: "doctor" | "clinic_admin";
  createdAt: string;
};

export function ClinicDashboard({
  clinicId,
  adminName,
}: {
  clinicId: string;
  adminName: string;
}) {
  const [rows, setRows] = useState<DoctorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPass, setNewPass] = useState("");
  const [creating, setCreating] = useState(false);
  const [createErr, setCreateErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/clinic/doctors");
      const data = (await res.json()) as { doctors?: DoctorRow[]; error?: string };
      if (!res.ok) throw new Error(data.error || res.statusText);
      setRows(data.doctors ?? []);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const stats = useMemo(() => {
    const doctors = rows.filter((r) => r.role !== "clinic_admin").length;
    const admins = rows.filter((r) => r.role === "clinic_admin").length;
    return { doctors, admins, total: rows.length };
  }, [rows]);

  async function createDoctor() {
    setCreateErr(null);
    setCreating(true);
    try {
      const res = await fetch("/api/clinic/doctors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, email: newEmail, password: newPass }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) {
        if (data.error === "email_taken") {
          throw new Error("Cet e-mail est déjà utilisé.");
        }
        if (data.error === "password_too_short") {
          throw new Error("Mot de passe trop court (min. 8).");
        }
        throw new Error(data.error || "Création impossible");
      }
      setNewName("");
      setNewEmail("");
      setNewPass("");
      await load();
    } catch (e) {
      setCreateErr(e instanceof Error ? e.message : "Erreur");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--ink)]">
            Dashboard clinique
          </h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Clinique <span className="font-mono text-xs">{clinicId}</span> · Admin{" "}
            <span className="font-semibold">{adminName}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/dossier"
            className="rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--ink)] hover:bg-[var(--teal-pale)]/30"
          >
            Ouvrir l&apos;app médecin
          </Link>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
          <div className="text-3xl font-bold text-[var(--teal)]">{stats.doctors}</div>
          <div className="text-xs font-semibold text-[var(--muted)]">Médecins</div>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
          <div className="text-3xl font-bold text-[var(--ink)]">{stats.admins}</div>
          <div className="text-xs font-semibold text-[var(--muted)]">Admins</div>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
          <div className="text-3xl font-bold text-[var(--ink)]">{stats.total}</div>
          <div className="text-xs font-semibold text-[var(--muted)]">Comptes</div>
        </div>
      </div>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
          <h2 className="font-display text-lg font-bold text-[var(--ink)]">
            Ajouter un médecin
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Le médecin pourra se connecter sur <code>/login</code> et aura son espace propre.
          </p>

          {createErr ? (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {createErr}
            </div>
          ) : null}

          <div className="mt-4 grid gap-3">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nom du médecin"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--cream)] px-3 py-2.5 text-sm outline-none ring-[var(--teal)] focus:ring-2"
            />
            <input
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="E-mail"
              type="email"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--cream)] px-3 py-2.5 text-sm outline-none ring-[var(--teal)] focus:ring-2"
            />
            <input
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              placeholder="Mot de passe (min. 8)"
              type="password"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--cream)] px-3 py-2.5 text-sm outline-none ring-[var(--teal)] focus:ring-2"
            />
            <button
              type="button"
              onClick={createDoctor}
              disabled={creating || !newName.trim() || !newEmail.trim() || newPass.length < 8}
              className="rounded-xl bg-[var(--teal)] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
            >
              {creating ? "Création…" : "Créer le compte médecin"}
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-[var(--ink)]">
              Médecins
            </h2>
            <button
              type="button"
              onClick={() => void load()}
              className="text-sm font-semibold text-[var(--teal)] hover:underline"
            >
              Rafraîchir
            </button>
          </div>

          {err ? (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {err}
            </div>
          ) : null}

          {loading ? (
            <p className="mt-4 text-sm text-[var(--muted)]">Chargement…</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {rows.length === 0 ? (
                <li className="text-sm text-[var(--muted)]">Aucun compte.</li>
              ) : (
                rows.map((d) => (
                  <li
                    key={d.id}
                    className="rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-[var(--ink)]">
                          {d.name}
                        </div>
                        <div className="truncate text-xs text-[var(--muted)]">
                          {d.email}
                        </div>
                      </div>
                      <span className="shrink-0 rounded-full border border-[var(--border)] bg-white px-2 py-1 text-[11px] font-semibold text-[var(--ink-mid)]">
                        {d.role === "clinic_admin" ? "Admin" : "Médecin"}
                      </span>
                    </div>
                    <div className="mt-2 text-[11px] text-[var(--muted)]">
                      ID: <span className="font-mono">{d.id}</span> · Créé{" "}
                      {new Date(d.createdAt).toLocaleDateString("fr-FR")}
                    </div>
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

