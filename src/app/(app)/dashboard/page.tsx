"use client";

import { ClinicalDashboard } from "@/components/dashboard/clinical-dashboard";
import { PageHeader, QuickLink } from "@/components/ui/page-header";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Tableau de bord"
        description="Statistiques interactives de votre activité — dossiers, consultations, agenda et indicateurs cliniques."
        actions={
          <>
            <QuickLink href="/dossier" primary>
              Mes dossiers
            </QuickLink>
            <QuickLink href="/salle-attente">Salle d&apos;attente</QuickLink>
            <QuickLink href="/agenda">Agenda</QuickLink>
          </>
        }
      />

      <ClinicalDashboard />
    </div>
  );
}
