"use client";

import { useEffect, useState, type FormEvent } from "react";

type Secretary = { id: string; name: string; email: string; active?: boolean; createdAt: string };

export function SecretaryPanel() {
  const [rows, setRows] = useState<Secretary[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function load() {
    const res = await fetch("/api/secretaries", { cache: "no-store" });
    if (res.ok) setRows((await res.json()).secretaries);
  }
  useEffect(() => { void load(); }, []);
  async function create(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setMessage("");
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/secretaries", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: form.get("name"), email: form.get("email"), password: form.get("password") }),
    });
    setBusy(false);
    if (!res.ok) {
      const error = (await res.json().catch(() => null))?.error;
      setMessage(error === "email_taken" ? "Cette adresse e-mail est déjà utilisée." : "Vérifiez les champs (mot de passe : 8 caractères minimum).");
      return;
    }
    e.currentTarget.reset(); setMessage("Compte secrétaire créé. Il peut maintenant se connecter."); await load();
  }
  async function toggle(row: Secretary) {
    await fetch("/api/secretaries", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: row.id, active: row.active === false }) });
    await load();
  }
  async function remove(row: Secretary) {
    if (!window.confirm(`Supprimer définitivement le compte de ${row.name} ?`)) return;
    await fetch(`/api/secretaries?id=${encodeURIComponent(row.id)}`, { method: "DELETE" }); await load();
  }
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-xs)] sm:col-span-2">
      <h2 className="font-display text-base font-bold text-[var(--ink)]">Secrétariat</h2>
      <p className="mt-1 text-xs text-[var(--muted)]">Créez un accès lié à votre cabinet. La secrétaire peut gérer la salle d’attente, les rendez-vous et les rappels.</p>
      <form onSubmit={create} className="mt-4 grid gap-3 md:grid-cols-4">
        <input name="name" required minLength={2} placeholder="Nom complet" className="rounded-xl border border-[var(--border)] px-3 py-2 text-sm" />
        <input name="email" required type="email" placeholder="E-mail" className="rounded-xl border border-[var(--border)] px-3 py-2 text-sm" />
        <input name="password" required type="password" minLength={8} placeholder="Mot de passe (8+)" className="rounded-xl border border-[var(--border)] px-3 py-2 text-sm" />
        <button disabled={busy} className="rounded-xl bg-[var(--teal)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{busy ? "Création…" : "Créer le compte"}</button>
      </form>
      {message ? <p className="mt-3 text-xs font-medium text-[var(--teal)]" role="status">{message}</p> : null}
      <div className="mt-5 space-y-2">
        {rows.map((row) => <div key={row.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-[var(--border)] px-4 py-3">
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-[var(--ink)]">{row.name}</p><p className="truncate text-xs text-[var(--muted)]">{row.email}</p></div>
          <span className={`text-xs font-semibold ${row.active === false ? "text-red-600" : "text-emerald-700"}`}>{row.active === false ? "Désactivé" : "Actif"}</span>
          <button onClick={() => void toggle(row)} className="rounded-lg border px-3 py-1.5 text-xs font-semibold">{row.active === false ? "Réactiver" : "Désactiver"}</button>
          <button onClick={() => void remove(row)} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700">Supprimer</button>
        </div>)}
        {!rows.length ? <p className="text-sm text-[var(--muted)]">Aucun compte secrétaire.</p> : null}
      </div>
    </section>
  );
}
