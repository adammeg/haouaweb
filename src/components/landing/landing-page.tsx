import Link from "next/link";
import { HawaeLogo } from "@/components/brand/hawae-logo";
import "@/styles/landing.css";

type IconName = "record" | "spark" | "chart" | "calendar" | "document" | "shield";

function ProductIcon({ name }: { name: IconName }) {
  const paths: Record<IconName, React.ReactNode> = {
    record: <><path d="M7 3h10a2 2 0 0 1 2 2v16H5V5a2 2 0 0 1 2-2Z"/><path d="M9 8h6M9 12h6M9 16h4"/></>,
    spark: <><path d="m12 3 1.3 3.7L17 8l-3.7 1.3L12 13l-1.3-3.7L7 8l3.7-1.3L12 3Z"/><path d="m18 14 .8 2.2L21 17l-2.2.8L18 20l-.8-2.2L15 17l2.2-.8L18 14ZM5 13l.8 2.2L8 16l-2.2.8L5 19l-.8-2.2L2 16l2.2-.8L5 13Z"/></>,
    chart: <><path d="M4 19V9M10 19V5M16 19v-7M22 19H2"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01"/></>,
    document: <><path d="M6 2h9l4 4v16H6V2Z"/><path d="M14 2v5h5M9 12h6M9 16h6"/></>,
    shield: <><path d="M12 22s8-3.5 8-10V5l-8-3-8 3v7c0 6.5 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></>,
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>{paths[name]}</svg>;
}

const FEATURES: Array<{ icon: IconName; index: string; title: string; text: string }> = [
  { icon: "record", index: "01", title: "Dossier clinique unifié", text: "Anamnèse, examens, bilans et historique adaptés à la gynécologie, l’obstétrique et la fertilité." },
  { icon: "spark", index: "02", title: "Intelligence clinique Hawae", text: "Scores déterministes, alertes et analyse structurée avec validation du praticien." },
  { icon: "chart", index: "03", title: "Outils spécialisés", text: "Partogramme, morphologie T2, PMA/FIV, courbes et scores accessibles dans le contexte patient." },
  { icon: "calendar", index: "04", title: "Cabinet synchronisé", text: "Agenda hebdomadaire, salle d’attente, rappels et suivi de l’activité au même endroit." },
  { icon: "document", index: "05", title: "Documents professionnels", text: "Ordonnances, certificats, comptes rendus et courriers construits depuis le dossier." },
  { icon: "shield", index: "06", title: "Accès maîtrisés", text: "Sessions authentifiées, espaces praticien et clinique, rôles et sauvegarde des données." },
];

export function LandingPage() {
  return (
    <div className="pro-landing">
      <div className="pro-ambient" aria-hidden />

      <header className="pro-nav-wrap">
        <nav className="pro-nav" aria-label="Navigation principale">
          <Link href="/" className="pro-brand" aria-label="HawaeMD — Accueil">
            <HawaeLogo size={46} rounded="xl" className="pro-brand-mark" priority />
            <span className="pro-brand-copy"><strong>HawaeMD</strong><small>Women’s health technology</small></span>
          </Link>
          <div className="pro-nav-links">
            <a href="#plateforme">Plateforme</a>
            <a href="#securite">Sécurité</a>
            <Link href="/clinic-login">Espace clinique</Link>
          </div>
          <div className="pro-nav-actions">
            <Link href="/login" className="pro-link-login">Connexion</Link>
            <Link href="/signup" className="pro-button pro-button-small">Commencer <span aria-hidden>↗</span></Link>
          </div>
        </nav>
      </header>

      <main>
        <section className="pro-hero">
          <div className="pro-hero-copy">
            <div className="pro-kicker"><span /> Intelligence clinique pour la santé de la femme</div>
            <h1>Une pratique plus claire.<br/><em>Une décision mieux éclairée.</em></h1>
            <p>HawaeMD réunit le dossier patient, les outils métier et l’assistance clinique dans un espace conçu pour les équipes de gynécologie-obstétrique et de médecine de la reproduction.</p>
            <div className="pro-hero-actions">
              <Link href="/signup" className="pro-button">Créer mon espace <span aria-hidden>→</span></Link>
              <Link href="/login" className="pro-button-secondary"><span className="pro-play" aria-hidden>→</span> Accéder à la plateforme</Link>
            </div>
            <div className="pro-proof-row" aria-label="Points forts">
              <span><i>✓</i> 19 scores cliniques</span>
              <span><i>✓</i> 3 parcours spécialisés</span>
              <span><i>✓</i> Assistance sous contrôle médical</span>
            </div>
          </div>

          <div className="pro-product-stage" aria-label="Aperçu de l’interface HawaeMD">
            <div className="pro-stage-ring" aria-hidden />
            <div className="pro-app-window">
              <aside className="pro-app-sidebar">
                <div className="pro-mini-brand"><HawaeLogo size={28} rounded="lg" /><span>HawaeMD</span></div>
                <div className="pro-side-label">ESPACE CLINIQUE</div>
                {[["▦","Salle d’attente"],["◇","Dossier patient"],["○","Agenda"],["⌁","Hawae"]].map(([icon,label], i) => <div key={label} className={`pro-side-item ${i === 1 ? "active" : ""}`}><span>{icon}</span>{label}</div>)}
                <div className="pro-side-label second">OUTILS</div>
                {[["＋","Nouveau dossier"],["□","Documents"],["△","Protocoles"]].map(([icon,label]) => <div key={label} className="pro-side-item muted"><span>{icon}</span>{label}</div>)}
                <div className="pro-side-user"><b>DA</b><span>Dr Amira<small>Gynécologue</small></span></div>
              </aside>
              <div className="pro-app-main">
                <div className="pro-app-topbar"><div><small>DOSSIER PATIENT</small><strong>Consultation obstétrique</strong></div><span className="pro-live"><i/> Sauvegardé</span></div>
                <div className="pro-app-content">
                  <div className="pro-patient-head">
                    <span className="pro-avatar">FM</span>
                    <div><strong>Patiente démonstration</strong><small>32 ans · G2P1 · 28 SA + 4 j</small></div>
                    <span className="pro-status">Suivi grossesse</span>
                  </div>
                  <div className="pro-tabs"><b>Anamnèse</b><span>Examen</span><span>Bilans</span><span>Scores</span><span>Hawae</span></div>
                  <div className="pro-metric-grid">
                    <div><small>TERME</small><strong>28+4 <i>SA</i></strong><span>2e trimestre</span></div>
                    <div><small>TENSION</small><strong>118/72</strong><span className="good">Dans la norme</span></div>
                    <div><small>CROISSANCE</small><strong>48e <i>pct</i></strong><span>Courbe harmonieuse</span></div>
                  </div>
                  <div className="pro-clinical-grid">
                    <div className="pro-form-card">
                      <div className="pro-card-title"><span>Paramètres cliniques</span><small>Complétude 84%</small></div>
                      {["Motif de consultation","Antécédents obstétricaux","Suivi biologique"].map((x,i) => <div className="pro-form-row" key={x}><span>{x}<small>{i === 0 ? "Consultation prénatale" : i === 1 ? "G2P1, sans complication" : "Bilans à jour"}</small></span><i>✓</i></div>)}
                    </div>
                    <div className="pro-ai-card">
                      <div className="pro-ai-title"><span className="pro-ai-symbol">✦</span><div><strong>Hawae Assist</strong><small>Analyse clinique structurée</small></div></div>
                      <div className="pro-ai-alert"><i/> Aucun signal d’alerte majeur</div>
                      <p>Suivi obstétrical cohérent avec le terme. Les paramètres disponibles sont rassurants.</p>
                      <button type="button" tabIndex={-1}>Voir l’analyse <span>→</span></button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="pro-float-card pro-float-one"><span>✓</span><div><strong>Dossier sauvegardé</strong><small>Synchronisation terminée</small></div></div>
            <div className="pro-float-card pro-float-two"><span>✦</span><div><strong>Analyse disponible</strong><small>7 éléments vérifiés</small></div></div>
          </div>
        </section>

        <section className="pro-specialties" aria-label="Spécialités couvertes">
          <span>Une plateforme pensée pour</span><strong>Gynécologie</strong><i/> <strong>Obstétrique</strong><i/> <strong>Fertilité &amp; AMP</strong><i/> <strong>Échographie</strong>
        </section>

        <section className="pro-section" id="plateforme">
          <div className="pro-section-head"><div><span className="pro-overline">UNE PLATEFORME, TOUTE VOTRE PRATIQUE</span><h2>Du premier accueil au suivi clinique.</h2></div><p>Chaque outil s’inscrit dans le contexte du dossier pour réduire les ruptures de parcours et garder l’information utile à portée de main.</p></div>
          <div className="pro-feature-grid">{FEATURES.map((f) => <article className="pro-feature" key={f.title}><div className="pro-feature-top"><span className="pro-feature-icon"><ProductIcon name={f.icon}/></span><small>{f.index}</small></div><h3>{f.title}</h3><p>{f.text}</p><span className="pro-feature-more" aria-hidden>Découvrir <b>→</b></span></article>)}</div>
        </section>

        <section className="pro-workflow">
          <div className="pro-workflow-copy"><span className="pro-overline light">CONÇU POUR LE TEMPS CLINIQUE</span><h2>Un fil de travail continu,<br/>sans perdre le contexte.</h2><p>HawaeMD accompagne la consultation sans imposer un parcours rigide. Les données saisies alimentent les scores, les documents et le suivi.</p><Link href="/signup" className="pro-text-link">Découvrir l’espace praticien <span>→</span></Link></div>
          <ol className="pro-steps"><li><span>01</span><div><strong>Accueillir</strong><p>Agenda et salle d’attente organisent la journée.</p></div></li><li><span>02</span><div><strong>Documenter</strong><p>Le dossier s’adapte à la spécialité et au motif.</p></div></li><li><span>03</span><div><strong>Analyser</strong><p>Scores, alertes et Hawae enrichissent la lecture clinique.</p></div></li><li><span>04</span><div><strong>Suivre</strong><p>Documents, rappels et historique assurent la continuité.</p></div></li></ol>
        </section>

        <section className="pro-security" id="securite">
          <div className="pro-security-icon"><ProductIcon name="shield" /></div>
          <div><span className="pro-overline">CONFIDENTIALITÉ PAR CONCEPTION</span><h2>Le contrôle reste entre les mains du praticien.</h2><p>Accès authentifiés, séparation des espaces, contexte IA pseudonymisé et validation humaine des analyses générées.</p></div>
          <div className="pro-security-points"><span><i>✓</i> Accès par rôle</span><span><i>✓</i> Sauvegarde serveur</span><span><i>✓</i> IA sur demande</span><span><i>✓</i> Traçabilité des générations</span></div>
        </section>

        <section className="pro-final-cta">
          <div><span className="pro-overline light">HAWAEMD</span><h2>Donnez à votre pratique<br/>un espace à sa mesure.</h2><p>Créez votre compte praticien ou configurez un espace pour votre clinique.</p></div>
          <div className="pro-final-actions"><Link href="/signup" className="pro-button pro-button-gold">Créer un compte praticien <span>→</span></Link><Link href="/clinic-signup" className="pro-button-darkline">Créer une clinique</Link></div>
        </section>
      </main>

      <footer className="pro-footer"><div className="pro-footer-brand"><HawaeLogo size={34} rounded="lg"/><span><strong>HawaeMD</strong><small>Intelligence clinique</small></span></div><p>© {new Date().getFullYear()} HawaeMD. Plateforme destinée aux professionnels autorisés.</p><nav aria-label="Liens secondaires"><Link href="/login">Praticien</Link><Link href="/clinic-login">Clinique</Link><Link href="/admin-login">Administration</Link></nav></footer>
    </div>
  );
}
