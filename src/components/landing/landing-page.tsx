import Link from "next/link";
import "@/styles/landing.css";
import { HawaeLogo } from "@/components/brand/hawae-logo";

const FEATURES = [
  {
    icon: "📋",
    tone: "teal",
    title: "Dossier clinique",
    text: "Gynécologie, obstétrique et infertilité — anamnèse structurée, examens et bilans.",
  },
  {
    icon: "🌬️",
    tone: "gold",
    title: "Hawae",
    text: "Notre assistante clinique, scores validés (FMF, PE, POSEIDON…) et aide à la décision contextuelle.",
  },
  {
    icon: "📊",
    tone: "blush",
    title: "Scores & outils",
    text: "Bishop, Manning, partogramme, écho T2, PMA/FIV et courbes de croissance.",
  },
  {
    icon: "🔒",
    tone: "teal",
    title: "Sécurisé & moderne",
    text: "Sessions authentifiées, sauvegarde serveur et interface pensée pour le cabinet.",
  },
] as const;

export function LandingPage() {
  return (
    <div className="landing">
      <div className="landing-bg" aria-hidden>
        <div className="landing-bg-grid" />
      </div>

      <div className="landing-inner">
        <header className="landing-header">
          <Link href="/" className="landing-logo">
            <HawaeLogo
              size={44}
              rounded="xl"
              className="landing-logo-mark shadow-[0_4px_14px_rgba(0,112,112,0.2)]"
              priority
            />
            <div className="landing-logo-text">
              HawaeMD
              <span>Intelligence clinique</span>
            </div>
          </Link>
          <div className="landing-header-cta">
            <Link href="/clinic-login" className="landing-btn-ghost">
              Clinique
            </Link>
            <Link href="/login" className="landing-btn-primary-sm">
              Connexion
            </Link>
          </div>
        </header>

        <section className="landing-hero">
          <div>
            <div className="landing-badge">
              <span className="landing-badge-dot" />
              Plateforme médicale · Gynéco · Obst · AMP
            </div>
            <h1>
              Votre pratique clinique,{" "}
              <em>structurée et assistée</em>
            </h1>
            <p className="landing-hero-lead">
              HawaeMD centralise les dossiers patientes, les consultations, les
              ordonnances et l&apos;intelligence clinique Hawae — conçu pour les
              équipes de gynécologie-obstétrique et de fertilité.
            </p>
            <div className="landing-hero-actions">
              <Link href="/signup" className="landing-btn-primary">
                Créer un compte médecin
                <span aria-hidden>→</span>
              </Link>
              <Link href="/login" className="landing-btn-outline">
                Se connecter
              </Link>
            </div>
            <div className="landing-trust">
              <div className="landing-trust-item">
                <strong>16+</strong>
                <span>Scores cliniques</span>
              </div>
              <div className="landing-trust-item">
                <strong>3</strong>
                <span>Spécialités dossier</span>
              </div>
              <div className="landing-trust-item">
                <strong>Hawae</strong>
                <span>Assistante intégrée</span>
              </div>
            </div>
          </div>

          <div className="landing-preview" aria-hidden>
            <div className="landing-preview-card">
              <div className="landing-preview-bar">
                <span className="landing-preview-dot" />
                <span className="landing-preview-dot" />
                <span className="landing-preview-dot" />
              </div>
              <div className="landing-preview-body">
                <div className="landing-preview-patient">
                  <div className="landing-preview-avatar">FB</div>
                  <div>
                    <div className="landing-preview-name">Patiente · Dossier</div>
                    <div className="landing-preview-meta">
                      Obstétrique · 28 SA · Complétude 78%
                    </div>
                  </div>
                </div>
                <div className="landing-preview-tabs">
                  <span className="landing-preview-tab active">Anamnèse</span>
                  <span className="landing-preview-tab">Examen</span>
                  <span className="landing-preview-tab">Bilans</span>
                  <span className="landing-preview-tab">Hawae</span>
                </div>
                <div className="landing-preview-lines">
                  <div className="landing-preview-line w90 accent" />
                  <div className="landing-preview-line w80" />
                  <div className="landing-preview-line w60" />
                  <div className="landing-preview-line w90" />
                </div>
              </div>
            </div>
            <div className="landing-preview-float">
              <span aria-hidden>✨</span> Analyse Hawae prête
            </div>
          </div>
        </section>

        <section className="landing-features" aria-labelledby="landing-features-title">
          <h2 id="landing-features-title" className="landing-features-title">
            Tout ce dont votre cabinet a besoin
          </h2>
          <div className="landing-features-grid">
            {FEATURES.map((f) => (
              <article key={f.title} className="landing-feature">
                <div
                  className={`landing-feature-icon ${f.tone}`}
                  aria-hidden
                >
                  {f.icon}
                </div>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-access" aria-labelledby="landing-access-title">
          <h2 id="landing-access-title" className="sr-only">
            Accès à la plateforme
          </h2>
          <div className="landing-access-grid">
            <article className="landing-access-card highlight">
              <h2>
                <span aria-hidden>👩‍⚕️</span> Praticien
              </h2>
              <p>
                Compte médecin : dossiers, consultations, ordonnances, Hawae
                et outils cliniques. Inscription réservée aux professionnels
                autorisés.
              </p>
              <div className="landing-access-actions">
                <Link href="/login" className="landing-access-btn fill">
                  Connexion médecin
                </Link>
                <Link href="/signup" className="landing-access-btn line">
                  Créer un compte
                </Link>
              </div>
            </article>
            <article className="landing-access-card">
              <h2>
                <span aria-hidden>🏥</span> Clinique
              </h2>
              <p>
                Espace cabinet : gestion de l&apos;équipe, des praticiens et
                de l&apos;organisation. Idéal pour les structures multi-médecins.
              </p>
              <div className="landing-access-actions">
                <Link href="/clinic-login" className="landing-access-btn muted">
                  Connexion clinique
                </Link>
                <Link href="/clinic-signup" className="landing-access-btn muted">
                  Créer une clinique
                </Link>
              </div>
            </article>
          </div>
        </section>

        <footer className="landing-footer">
          <div className="landing-footer-inner">
            <p>
              © {new Date().getFullYear()} HawaeMD — Données sécurisées par session
              authentifiée (MongoDB selon configuration instance).
            </p>
            <nav className="landing-footer-links" aria-label="Liens secondaires">
              <Link href="/admin-login">Administration</Link>
              <Link href="/login">Connexion</Link>
              <Link href="/signup">Inscription</Link>
            </nav>
          </div>
        </footer>
      </div>
    </div>
  );
}
