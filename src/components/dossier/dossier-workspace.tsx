"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useHawaeStore } from "@/stores/hawae-store";
import {
  SPECIALTY_LABELS,
  type ConsultationEntry,
  type PatientSnapshot,
  type Specialty,
} from "@/types/domain";
import {
  EMPTY_CONSULT_LIST,
  EMPTY_HISTORY_MAP,
  EMPTY_PATIENTS_MAP,
} from "@/lib/empty-stable";
import {
  computeCompleteness,
  getPatientDisplayName,
  patientAgeYears,
} from "@/lib/patient-utils";
import { OrdonnanceModal } from "@/components/ordo/ordonnance-modal";
import { HawaePanel } from "@/components/ia/hawae-panel";
import { UserSwitcher } from "@/components/users/user-switcher";
import { AssistPanel } from "@/components/assist/assist-panel";
import {
  profileFromSnapshot,
  runAssist,
  type AssistRunResult,
} from "@/lib/assist";
import {
  BilansTab,
  GynExtendedFields,
  InfExtendedFields,
  ObstExtendedFields,
} from "@/components/dossier/clinical-sections";
import { T2MorphoTab } from "@/components/dossier/t2-morpho-tab";
import { generateDossierCompletPdf } from "@/lib/dossier/dossier-pdf";

const SPECS: Specialty[] = ["gyn", "obst", "inf"];

export function DossierWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [ordoOpen, setOrdoOpen] = useState(false);
  const [tab, setTab] = useState<
    | "anamnese"
    | "examen"
    | "bilans"
    | "t2"
    | "assist"
    | "scores"
    | "historique"
    | "hawae"
  >("anamnese");
  const [dossierPdfBusy, setDossierPdfBusy] = useState(false);
  const [listQuery, setListQuery] = useState("");

  const patientsMap = useHawaeStore((s) => {
    const id = s.currentUserId;
    if (!id) return EMPTY_PATIENTS_MAP;
    return s.patientsByUser[id] ?? EMPTY_PATIENTS_MAP;
  });
  const histMap = useHawaeStore((s) => {
    const id = s.currentUserId;
    if (!id) return EMPTY_HISTORY_MAP;
    return s.historyByUser[id] ?? EMPTY_HISTORY_MAP;
  });
  const currentPatientId = useHawaeStore((s) => s.currentPatientId);
  const draft = useHawaeStore((s) => s.draft);
  const sidebarSpecFilter = useHawaeStore((s) => s.sidebarSpecFilter);

  const openPatient = useHawaeStore((s) => s.openPatient);
  const closePatient = useHawaeStore((s) => s.closePatient);
  const createNewPatient = useHawaeStore((s) => s.createNewPatient);
  const deletePatient = useHawaeStore((s) => s.deletePatient);
  const patchDraft = useHawaeStore((s) => s.patchDraft);
  const saveDraft = useHawaeStore((s) => s.saveDraft);
  const startNewConsultation = useHawaeStore((s) => s.startNewConsultation);
  const pushConsultationSnapshot = useHawaeStore(
    (s) => s.pushConsultationSnapshot,
  );
  const loadConsultation = useHawaeStore((s) => s.loadConsultation);
  const deleteConsultation = useHawaeStore((s) => s.deleteConsultation);
  const setSidebarSpecFilter = useHawaeStore((s) => s.setSidebarSpecFilter);

  const currentUser = useHawaeStore((s) => {
    const u = s.users.find((x) => x.id === s.currentUserId);
    return u ?? s.users[0];
  });

  const handledQueryRef = useRef<string>("");

  useEffect(() => {
    const wantNew = searchParams.get("new") === "1";
    const patientId = searchParams.get("patient");
    const queryKey = `${wantNew ? "new=1" : ""}|${patientId ?? ""}`;
    if (handledQueryRef.current === queryKey) return;
    if (wantNew) {
      // Guard: store updates can re-trigger this effect before router.replace applies.
      handledQueryRef.current = queryKey;
      createNewPatient();
      setTab("hawae");
      router.replace("/dossier", { scroll: false });
      return;
    }
    if (patientId && patientsMap[patientId]) {
      handledQueryRef.current = queryKey;
      openPatient(patientId);
      router.replace("/dossier", { scroll: false });
    }
  }, [searchParams, patientsMap, openPatient, createNewPatient, router, setTab]);

  useEffect(() => {
    if (!draft?.id || !currentPatientId) return;
    const t = setTimeout(() => saveDraft(), 800);
    return () => clearTimeout(t);
  }, [draft, currentPatientId, saveDraft]);

  const patientEntries = useMemo(() => Object.values(patientsMap), [patientsMap]);

  const filteredList = useMemo(() => {
    const q = listQuery.toLowerCase().trim();
    return patientEntries.filter((p) => {
      if (sidebarSpecFilter !== "all" && p.specialite !== sidebarSpecFilter) {
        return false;
      }
      if (!q) return true;
      const blob = [
        p.nom,
        p.prenom,
        p.cin,
        p.motif,
        p.symptomes,
        p.tel,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return blob.includes(q);
    });
  }, [patientEntries, listQuery, sidebarSpecFilter]);

  const history: ConsultationEntry[] = useMemo(() => {
    if (!currentPatientId) return EMPTY_CONSULT_LIST;
    return histMap[currentPatientId] ?? EMPTY_CONSULT_LIST;
  }, [histMap, currentPatientId]);

  const completeness = draft ? computeCompleteness(draft) : 0;

  const onField = useCallback(
    (patch: Record<string, string | undefined>) => {
      patchDraft(patch);
    },
    [patchDraft],
  );

  const detailOpen = Boolean(currentPatientId && draft);

  return (
    <>
      <header className="sticky top-[var(--topbar-h)] z-[100] flex min-h-[52px] flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] bg-[var(--surface)]/95 px-4 py-2 backdrop-blur sm:px-0">
        <div className="flex min-w-0 items-start gap-2 sm:items-center">
          {detailOpen && (
            <button
              type="button"
              className="mt-0.5 shrink-0 rounded-xl border border-[var(--border)] bg-white px-2.5 py-1.5 text-sm font-semibold text-[var(--ink)] shadow-sm transition-colors hover:bg-[var(--cream)] lg:hidden"
              aria-label="Retour à la liste des dossiers"
              onClick={() => {
                closePatient();
                setTab("anamnese");
              }}
            >
              ←
            </button>
          )}
          <div className="min-w-0">
          <span className="font-display text-sm font-bold text-[var(--ink)]">
            {detailOpen ? "Consultation" : "Mes dossiers"}
          </span>
          {detailOpen && draft ? (
            <p className="truncate text-xs text-[var(--muted)]">
              {getPatientDisplayName(draft)}
            </p>
          ) : (
            <p className="text-xs text-[var(--muted)]">Recherche et filtres ci-dessous</p>
          )}
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <UserSwitcher
            triggerClassName="flex min-w-0 max-w-[min(100%,14rem)] cursor-pointer items-center gap-2 rounded-xl border border-transparent px-2 py-1.5 hover:border-[var(--border)] hover:bg-[var(--cream)] sm:max-w-none"
            avatar={
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold text-white"
                style={{ background: currentUser?.color }}
              >
                {currentUser?.initials}
              </div>
            }
            nameLine={
              <span className="hidden max-w-[120px] truncate text-xs font-medium text-[var(--ink)] sm:inline">
                {currentUser?.name}
              </span>
            }
          />
          {detailOpen && (
            <>
              <button
                type="button"
                className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-xs font-semibold text-[var(--ink)] shadow-sm transition-colors hover:bg-[var(--teal-pale)]/40"
                onClick={() => saveDraft()}
              >
                Enregistrer
              </button>
              <button
                type="button"
                disabled={dossierPdfBusy}
                className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-xs font-semibold text-[var(--ink)] shadow-sm hover:bg-[var(--teal-pale)]/40 disabled:opacity-60"
                onClick={() => {
                  if (!draft) return;
                  setDossierPdfBusy(true);
                  void generateDossierCompletPdf(draft).finally(() =>
                    setDossierPdfBusy(false),
                  );
                }}
              >
                {dossierPdfBusy ? "PDF…" : "PDF dossier"}
              </button>
              <button
                type="button"
                className="rounded-xl bg-[var(--teal)] px-3 py-2 text-xs font-semibold text-white shadow-sm transition-opacity hover:opacity-95"
                onClick={() => setOrdoOpen(true)}
              >
                Ordonnance
              </button>
            </>
          )}
        </div>
      </header>

      {!detailOpen ? (
        <div className="space-y-6 sm:space-y-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--ink)] sm:text-3xl">
                Liste des dossiers
              </h1>
              <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted)]">
                {filteredList.length} dossier{filteredList.length !== 1 ? "s" : ""}{" "}
                affiché{filteredList.length !== 1 ? "s" : ""} — utilisez la recherche
                et les filtres pour retrouver une patiente.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {(["all", ...SPECS] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setSidebarSpecFilter(f)}
                  className={`min-h-[44px] rounded-full px-3.5 py-2 text-xs font-semibold transition-colors sm:min-h-0 sm:py-1.5 ${
                    sidebarSpecFilter === f
                      ? "bg-[var(--teal)] text-white shadow-sm"
                      : "bg-white text-[var(--ink-mid)] ring-1 ring-[var(--border)] hover:ring-[var(--teal)]/30"
                  }`}
                >
                  {f === "all" ? "Tous" : SPECIALTY_LABELS[f]}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1">
              <label htmlFor="dossier-list-search" className="sr-only">
                Rechercher un dossier
              </label>
              <span
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-base opacity-40"
                aria-hidden
              >
                🔍
              </span>
              <input
                id="dossier-list-search"
                className="w-full rounded-xl border border-[var(--border)] bg-white py-3.5 pl-11 pr-4 text-sm shadow-sm outline-none ring-[var(--teal)]/30 transition-shadow focus:ring-2"
                placeholder="Rechercher par nom, motif, CIN, téléphone…"
                value={listQuery}
                onChange={(e) => setListQuery(e.target.value)}
                type="search"
                autoComplete="off"
              />
            </div>
            <button
              type="button"
              className="inline-flex min-h-[48px] shrink-0 items-center justify-center rounded-xl bg-[var(--teal)] px-5 py-3 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-95 sm:min-h-0"
              onClick={() => router.push("/dossier?new=1")}
            >
              + Nouvelle patiente
            </button>
          </div>
          <div className="rounded-2xl border border-[var(--border)]/80 bg-white/90 p-4 shadow-[var(--shadow-xs)] sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredList.length === 0 ? (
              <div className="col-span-full rounded-2xl border border-dashed border-[var(--border)] bg-white/90 px-6 py-14 text-center shadow-sm">
                <p className="text-sm font-medium text-[var(--ink-mid)]">
                  {patientEntries.length === 0
                    ? "Aucun dossier pour l’instant."
                    : "Aucun résultat pour ces filtres."}
                </p>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  Créez une fiche patiente pour démarrer une consultation.
                </p>
                <button
                  type="button"
                  className="mt-6 inline-flex rounded-xl bg-[var(--teal)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm"
                  onClick={() => router.push("/dossier?new=1")}
                >
                  Créer un dossier
                </button>
              </div>
            ) : (
              filteredList.map((p) => {
                const age = patientAgeYears(p.ddn);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => openPatient(p.id)}
                    className="rounded-2xl border border-[var(--border)] bg-white p-5 text-left shadow-sm transition hover:border-[var(--teal)]/50 hover:shadow-md"
                  >
                    <div className="font-semibold text-[var(--ink)]">
                      {getPatientDisplayName(p)}
                    </div>
                    <div className="mt-1 text-xs text-[var(--muted)]">
                      {p.specialite
                        ? SPECIALTY_LABELS[p.specialite as Specialty]
                        : "Spécialité ?"}
                      {age != null ? ` · ${age} ans` : ""}
                    </div>
                    {p.motif ? (
                      <div className="mt-2 line-clamp-2 text-xs text-[var(--ink-mid)]">
                        {p.motif}
                      </div>
                    ) : null}
                  </button>
                );
              })
            )}
          </div>
          </div>
        </div>
      ) : (
        <div className="flex min-h-[min(80vh,720px)] flex-col gap-4 lg:flex-row lg:gap-6">
          <aside className="hidden w-[272px] shrink-0 flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] shadow-sm lg:flex">
            <div className="border-b border-[var(--border)] p-4">
              <button
                type="button"
                className="mb-3 w-full rounded-xl border border-[var(--border)] bg-white py-2.5 text-xs font-semibold text-[var(--ink)] shadow-sm transition-colors hover:bg-[var(--cream)]"
                onClick={() => {
                  closePatient();
                  setTab("anamnese");
                }}
              >
                ← Liste des dossiers
              </button>
              <label className="sr-only" htmlFor="dossier-sidebar-filter">
                Filtrer la liste
              </label>
              <input
                id="dossier-sidebar-filter"
                className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-xs shadow-inner"
                placeholder="Filtrer…"
                value={listQuery}
                onChange={(e) => setListQuery(e.target.value)}
              />
            </div>
            <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto p-2">
              {filteredList.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => openPatient(p.id)}
                  className={`w-full rounded-xl px-3 py-2.5 text-left text-xs transition-colors ${
                    p.id === currentPatientId
                      ? "bg-[var(--teal-pale)] font-semibold text-[var(--teal)] shadow-sm"
                      : "hover:bg-white"
                  }`}
                >
                  {getPatientDisplayName(p)}
                </button>
              ))}
            </div>
          </aside>

          <main className="min-w-0 flex-1 rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm sm:p-6">
            <div className="mb-5 flex flex-col gap-4 border-b border-[var(--border)] pb-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="font-display text-xl font-bold text-[var(--ink)] sm:text-2xl">
                  {draft ? getPatientDisplayName(draft) : ""}
                </h1>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {draft?.specialite
                    ? SPECIALTY_LABELS[draft.specialite as Specialty]
                    : "Spécialité non renseignée"}
                  {draft?.ddn && patientAgeYears(draft.ddn) != null
                    ? ` · ${patientAgeYears(draft.ddn)} ans`
                    : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-xl border border-[var(--teal)] bg-[var(--teal)] px-3 py-2 text-xs font-semibold text-white shadow-sm"
                  onClick={() => startNewConsultation()}
                >
                  Nouvelle consultation
                </button>
                <button
                  type="button"
                  className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-xs font-semibold text-[var(--ink)] shadow-sm"
                  onClick={() => pushConsultationSnapshot()}
                >
                  Historique
                </button>
                <button
                  type="button"
                  className="rounded-xl border border-red-200 bg-red-50/80 px-3 py-2 text-xs font-semibold text-red-700"
                  onClick={() => {
                    if (
                      currentPatientId &&
                      confirm("Supprimer ce dossier définitivement ?")
                    ) {
                      deletePatient(currentPatientId);
                    }
                  }}
                >
                  Supprimer
                </button>
              </div>
            </div>

            <div className="mb-5 rounded-xl border border-[var(--border)] bg-[var(--teal-pale)]/40 px-4 py-3">
              <div className="mb-2 flex justify-between text-xs font-semibold text-[var(--teal)]">
                <span>Complétude du dossier</span>
                <span>{completeness}%</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-white shadow-inner">
                <div
                  className="h-full rounded-full bg-[var(--teal)] transition-all duration-300"
                  style={{ width: `${completeness}%` }}
                />
              </div>
            </div>

            <div
              className="mb-6 flex gap-1 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              role="tablist"
              aria-label="Sections du dossier"
            >
              {(
                [
                  ["anamnese", "Anamnèse"],
                  ["examen", "Examen"],
                  ["bilans", "Bilans"],
                  ...(draft?.specialite === "obst"
                    ? ([["t2", "Écho T2"]] as const)
                    : []),
                  ["assist", "Assist"],
                  ["scores", "Scores"],
                  ["historique", "Historique"],
                  ["hawae", "Hawae IA"],
                ] as const
              ).map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  role="tab"
                  aria-selected={tab === k}
                  onClick={() => setTab(k)}
                  className={`shrink-0 rounded-xl px-4 py-2.5 text-xs font-semibold transition-colors ${
                    tab === k
                      ? "bg-[var(--teal)] text-white shadow-sm"
                      : "text-[var(--ink-mid)] hover:bg-[var(--cream)]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {draft && tab === "anamnese" && (
              <AnamneseTab draft={draft} onField={onField} />
            )}
            {draft && tab === "examen" && (
              <ExamenTab draft={draft} onField={onField} />
            )}
            {draft && tab === "bilans" && (
              <BilansTab draft={draft} onField={onField} />
            )}
            {draft && tab === "t2" && draft.specialite === "obst" && (
              <T2MorphoTab draft={draft} onField={onField} />
            )}
            {draft && tab === "assist" && (
              <DossierAssistTab draft={draft} patchDraft={patchDraft} />
            )}
            {draft && tab === "scores" && <ScoresTab />}
            {draft && tab === "historique" && (
              <HistoriqueTab
                entries={history}
                onLoad={(id) => {
                  loadConsultation(id);
                  setTab("anamnese");
                }}
                onDelete={deleteConsultation}
              />
            )}
            {draft && tab === "hawae" && <HawaePanel draft={draft} />}
          </main>
        </div>
      )}

      <OrdonnanceModal
        open={ordoOpen}
        onClose={() => setOrdoOpen(false)}
        patient={draft}
        onPersistToDossier={(p) => {
          patchDraft({
            ordonnanceLines: p.lines,
            ordonnanceNote: p.note,
            ordonnanceValidite: p.validite,
          });
        }}
      />
    </>
  );
}

function AnamneseTab({
  draft,
  onField,
}: {
  draft: PatientSnapshot;
  onField: (p: Record<string, string | undefined>) => void;
}) {
  const spec = (draft.specialite as Specialty) || "gyn";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <span className="self-center text-xs font-bold text-[var(--muted)]">
          Spécialité active
        </span>
        {SPECS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onField({ specialite: s })}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              spec === s
                ? "bg-[var(--gold)] text-[#083F3F]"
                : "bg-white ring-1 ring-[var(--border)]"
            }`}
          >
            {SPECIALTY_LABELS[s]}
          </button>
        ))}
      </div>

      <section className="grid gap-3 sm:grid-cols-2">
        <Field
          label="Nom"
          value={draft.nom ?? ""}
          onChange={(v) => onField({ nom: v })}
        />
        <Field
          label="Prénom"
          value={draft.prenom ?? ""}
          onChange={(v) => onField({ prenom: v })}
        />
        <Field
          label="Date de naissance"
          type="date"
          value={draft.ddn ?? ""}
          onChange={(v) => onField({ ddn: v })}
        />
        <Field
          label="Téléphone"
          value={draft.tel ?? ""}
          onChange={(v) => onField({ tel: v })}
        />
        <Field
          label="CIN"
          value={draft.cin ?? ""}
          onChange={(v) => onField({ cin: v })}
        />
        <Field
          label="Profession"
          value={draft.profession ?? ""}
          onChange={(v) => onField({ profession: v })}
        />
      </section>

      <section>
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--teal)]">
          Motif & symptômes
        </h3>
        <Field
          label="Motif"
          value={draft.motif ?? ""}
          onChange={(v) => onField({ motif: v })}
        />
        <textarea
          className="mt-2 w-full rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
          rows={4}
          placeholder="Symptômes, HMA…"
          value={draft.symptomes ?? ""}
          onChange={(e) => onField({ symptomes: e.target.value })}
        />
      </section>

      {spec === "gyn" && (
        <section className="grid gap-3 sm:grid-cols-2">
          <Field
            label="DDR"
            type="date"
            value={draft.g_ddr ?? ""}
            onChange={(v) => onField({ g_ddr: v })}
          />
          <Field
            label="Cycle"
            value={draft.g_cycle ?? ""}
            onChange={(v) => onField({ g_cycle: v })}
          />
          <Field
            label="Contraception"
            value={draft.g_contra ?? ""}
            onChange={(v) => onField({ g_contra: v })}
          />
          <Field
            label="G (gestité)"
            value={draft.g_gest ?? ""}
            onChange={(v) => onField({ g_gest: v })}
          />
          <Field
            label="P (parité)"
            value={draft.g_par ?? ""}
            onChange={(v) => onField({ g_par: v })}
          />
          <Field
            label="A (IVG/FC)"
            value={draft.g_abort ?? ""}
            onChange={(v) => onField({ g_abort: v })}
          />
        </section>
      )}

      {spec === "obst" && (
        <section className="grid gap-3 sm:grid-cols-2">
          <Field
            label="G"
            value={draft.o_gest ?? ""}
            onChange={(v) => onField({ o_gest: v })}
          />
          <Field
            label="P"
            value={draft.o_par ?? ""}
            onChange={(v) => onField({ o_par: v })}
          />
          <Field
            label="A"
            value={draft.o_abort ?? ""}
            onChange={(v) => onField({ o_abort: v })}
          />
          <Field
            label="DDR"
            type="date"
            value={draft.o_ddr ?? ""}
            onChange={(v) => onField({ o_ddr: v })}
          />
          <Field
            label="Terme"
            value={draft.o_terme ?? ""}
            onChange={(v) => onField({ o_terme: v })}
          />
          <Field
            label="DPA"
            type="date"
            value={draft.o_dpa ?? ""}
            onChange={(v) => onField({ o_dpa: v })}
          />
          <Field
            label="Groupe sanguin"
            value={draft.o_grp ?? ""}
            onChange={(v) => onField({ o_grp: v })}
          />
        </section>
      )}

      {spec === "inf" && (
        <section className="grid gap-3 sm:grid-cols-2">
          <Field
            label="Durée infertilité"
            value={draft.i_duree ?? ""}
            onChange={(v) => onField({ i_duree: v })}
          />
          <Field
            label="DDR"
            type="date"
            value={draft.i_ddr ?? ""}
            onChange={(v) => onField({ i_ddr: v })}
          />
          <Field
            label="Cycle"
            value={draft.i_cycle ?? ""}
            onChange={(v) => onField({ i_cycle: v })}
          />
        </section>
      )}

      <section className="grid gap-3 sm:grid-cols-2">
        <Field
          label="ATCD médicaux"
          value={draft.atcdMed ?? ""}
          onChange={(v) => onField({ atcdMed: v })}
        />
        <Field
          label="Traitements en cours"
          value={draft.traitements ?? ""}
          onChange={(v) => onField({ traitements: v })}
        />
        <Field
          label="Allergies"
          value={draft.allergies ?? ""}
          onChange={(v) => onField({ allergies: v })}
        />
      </section>

      {spec === "gyn" && <GynExtendedFields draft={draft} onField={onField} />}
      {spec === "obst" && <ObstExtendedFields draft={draft} onField={onField} />}
      {spec === "inf" && <InfExtendedFields draft={draft} onField={onField} />}
    </div>
  );
}

function DossierAssistTab({
  draft,
  patchDraft,
}: {
  draft: PatientSnapshot;
  patchDraft: (p: Partial<PatientSnapshot>) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AssistRunResult | null>(() => {
    if (!draft.hawaeAssistResultJson) return null;
    try {
      return JSON.parse(draft.hawaeAssistResultJson) as AssistRunResult;
    } catch {
      return null;
    }
  });

  const run = () => {
    setLoading(true);
    setTimeout(() => {
      const profile = profileFromSnapshot(draft);
      const r = runAssist(profile);
      setResult(r);
      patchDraft({
        hawaeAssistResultJson: JSON.stringify(r),
        hawaeAssistAt: new Date().toISOString(),
      });
      setLoading(false);
    }, 80);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[var(--muted)]">
          Moteur clinique v2.2 — scores contextuels selon le dossier
        </p>
        <button
          type="button"
          disabled={loading}
          onClick={run}
          className="rounded-xl bg-[var(--teal)] px-4 py-2 text-xs font-bold text-white shadow-sm disabled:opacity-50"
        >
          {loading ? "Analyse…" : "Analyser"}
        </button>
      </div>
      <AssistPanel result={result} />
    </div>
  );
}

function ExamenTab({
  draft,
  onField,
}: {
  draft: PatientSnapshot;
  onField: (p: Record<string, string | undefined>) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field
        label="TA"
        value={draft.ec_ta ?? ""}
        onChange={(v) => onField({ ec_ta: v })}
      />
      <Field
        label="Pouls"
        value={draft.ec_pouls ?? ""}
        onChange={(v) => onField({ ec_pouls: v })}
      />
      <Field
        label="Température"
        value={draft.ec_temp ?? ""}
        onChange={(v) => onField({ ec_temp: v })}
      />
      <Field
        label="Poids (kg)"
        value={draft.ec_poids ?? ""}
        onChange={(v) => onField({ ec_poids: v })}
      />
      <Field
        label="Taille (cm)"
        value={draft.ec_taille ?? ""}
        onChange={(v) => onField({ ec_taille: v })}
      />
      <Field
        label="HU / SF"
        value={draft.ec_hu ?? ""}
        onChange={(v) => onField({ ec_hu: v })}
      />
      <Field
        label="Présentation"
        value={draft.ec_presentation ?? ""}
        onChange={(v) => onField({ ec_presentation: v })}
      />
      <Field
        label="BCF"
        value={draft.ec_bcf ?? ""}
        onChange={(v) => onField({ ec_bcf: v })}
      />
      <div className="sm:col-span-2">
        <label className="mb-1 block text-xs font-semibold text-[var(--muted)]">
          Conclusion examen
        </label>
        <textarea
          className="w-full rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
          rows={4}
          value={draft.ec_conclusion ?? ""}
          onChange={(e) => onField({ ec_conclusion: e.target.value })}
        />
      </div>
    </div>
  );
}

function ScoresTab() {
  const [dil, setDil] = useState(0);
  const [eff, setEff] = useState(0);
  const [cons, setCons] = useState(0);
  const [pos, setPos] = useState(0);
  const [haut, setHaut] = useState(0);
  const bishop = dil + eff + cons + pos + haut;
  let interp = "";
  if (bishop >= 9) {
    interp = "Col très favorable — déclenchement très probable de succès.";
  } else if (bishop >= 7) {
    interp = "Col favorable — déclenchement recommandable.";
  } else if (bishop >= 5) {
    interp = "Col moyennement favorable — maturation préalable conseillée.";
  } else {
    interp = "Col défavorable — maturation indispensable avant déclenchement.";
  }

  return (
    <div className="max-w-lg space-y-4">
      <h3 className="font-display text-sm font-bold text-[var(--ink)]">
        Score de Bishop (0–13)
      </h3>
      <ScoreSelect label="Dilatation" value={dil} onChange={setDil} max={3} />
      <ScoreSelect label="Effacement" value={eff} onChange={setEff} max={3} />
      <ScoreSelect
        label="Consistance"
        value={cons}
        onChange={setCons}
        max={2}
      />
      <ScoreSelect label="Position" value={pos} onChange={setPos} max={2} />
      <ScoreSelect
        label="Hauteur présentation"
        value={haut}
        onChange={setHaut}
        max={3}
      />
      <div className="rounded-xl border border-[var(--border)] bg-[var(--teal-pale)] p-4">
        <div className="text-2xl font-bold text-[var(--teal)]">{bishop}/13</div>
        <p className="mt-2 text-sm text-[var(--ink-mid)]">{interp}</p>
      </div>
    </div>
  );
}

function ScoreSelect({
  label,
  value,
  onChange,
  max,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  max: number;
}) {
  return (
    <label className="flex items-center justify-between gap-4 text-sm">
      <span className="text-[var(--ink-mid)]">{label}</span>
      <select
        className="rounded-lg border border-[var(--border)] px-2 py-1"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      >
        {Array.from({ length: max + 1 }, (_, i) => (
          <option key={i} value={i}>
            {i}
          </option>
        ))}
      </select>
    </label>
  );
}

function HistoriqueTab({
  entries,
  onLoad,
  onDelete,
}: {
  entries: ConsultationEntry[];
  onLoad: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  if (entries.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-[var(--muted)]">
        Aucune consultation archivée. Utilisez le bouton « Historique » dans l&apos;en-tête du
        dossier ou « Nouvelle consultation » pour en créer une.
      </p>
    );
  }
  return (
    <ul className="space-y-4">
      {entries.map((c) => {
        const d = new Date(c.date);
        return (
          <li
            key={c.id}
            className="rounded-xl border border-[var(--border)] bg-white p-4 shadow-sm"
          >
            <div className="text-xs font-semibold text-[var(--teal)]">
              {d.toLocaleString("fr-FR")}
            </div>
            <div className="mt-1 font-medium text-[var(--ink)]">{c.motif}</div>
            <p className="mt-1 line-clamp-3 text-xs text-[var(--muted)]">
              {c.symptomes || "—"}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-lg bg-[var(--teal-pale)] px-3 py-1 text-xs font-semibold text-[var(--teal)]"
                onClick={() => onLoad(c.id)}
              >
                Charger
              </button>
              <button
                type="button"
                className="rounded-lg px-3 py-1 text-xs text-red-600"
                onClick={() => {
                  if (confirm("Supprimer cette consultation ?")) {
                    onDelete(c.id);
                  }
                }}
              >
                Supprimer
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-[var(--muted)]">
        {label}
      </span>
      <input
        type={type}
        className="w-full rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
