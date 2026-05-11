import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";

export default async function Home() {
  const session = await getSession();
  if (session) {
    if (session.role === "app_admin") redirect("/admin");
    if (session.role === "clinic_admin") redirect("/clinic");
    redirect("/dossier");
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--cream)]">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.45]"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(10, 92, 92, 0.18), transparent), radial-gradient(ellipse 60% 40% at 100% 50%, rgba(201, 168, 76, 0.12), transparent)",
        }}
      />

      <div className="relative mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 py-16 text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#C9A84C] to-[#E8D28A] text-3xl shadow-lg shadow-[rgba(201,168,76,0.4)]">
          ✦
        </div>
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-[var(--ink)] sm:text-5xl">
          HawaeMD
        </h1>
        <p className="mt-2 text-xs font-bold uppercase tracking-[2px] text-[var(--muted)]">
          Intelligence clinique
        </p>
        <p className="mt-8 max-w-lg text-base leading-relaxed text-[var(--ink-mid)]">
          Dossiers patientes, consultations, ordonnances et assistant clinique — accès réservé aux
          comptes autorisés (médecin, clinique ou administration).
        </p>

        <div className="mt-10 grid w-full max-w-xl gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-[var(--border)] bg-white/90 p-5 text-left shadow-sm">
            <h2 className="text-xs font-bold uppercase tracking-wide text-[var(--teal)]">
              Praticien
            </h2>
            <p className="mt-1 text-sm text-[var(--muted)]">Compte médecin — dossiers et Hawae IA.</p>
            <div className="mt-4 flex flex-col gap-2">
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-xl bg-[var(--teal)] px-4 py-3 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-95"
              >
                Connexion
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-xl border-2 border-[var(--teal)] bg-white px-4 py-3 text-sm font-bold text-[var(--teal)] transition-colors hover:bg-[var(--teal-pale)]"
              >
                Créer un compte
              </Link>
            </div>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-white/90 p-5 text-left shadow-sm">
            <h2 className="text-xs font-bold uppercase tracking-wide text-[var(--teal)]">
              Clinique
            </h2>
            <p className="mt-1 text-sm text-[var(--muted)]">Gestion cabinet et équipe médicale.</p>
            <div className="mt-4 flex flex-col gap-2">
              <Link
                href="/clinic-login"
                className="inline-flex items-center justify-center rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm font-semibold text-[var(--ink)] transition-colors hover:bg-[var(--teal-pale)]/40"
              >
                Connexion clinique
              </Link>
              <Link
                href="/clinic-signup"
                className="inline-flex items-center justify-center rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm font-semibold text-[var(--ink)] transition-colors hover:bg-[var(--teal-pale)]/40"
              >
                Créer une clinique
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <Link
            href="/admin-login"
            className="text-xs font-semibold text-[var(--muted)] underline underline-offset-2 hover:text-[var(--ink)]"
          >
            Accès administration
          </Link>
        </div>

        <p className="mt-10 max-w-md text-xs leading-relaxed text-[var(--muted)]">
          Les sessions utilisent un jeton sécurisé ; les données sont stockées côté serveur (MongoDB)
          selon la configuration de l&apos;instance.
        </p>
      </div>
    </div>
  );
}
