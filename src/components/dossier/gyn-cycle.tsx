"use client";

import type { PatientSnapshot } from "@/types/domain";
import { Field, SelectInput, TextInput } from "@/components/dossier/form-primitives";
import { AnaCard, PillGroup, type AnaPatch } from "@/components/dossier/anamnese-shared";
import { GYN_LEUCO } from "@/lib/dossier/anamnese-config";
import { socleValue } from "@/lib/dossier/socle";
import { CYCLE_SYMPTOMS, LEUCO_SIGNS, cycleStatus, splitList, toggleInList } from "@/lib/dossier/cycle";

function Chips({
  items,
  value,
  onToggle,
  label,
}: {
  items: readonly string[];
  value?: string;
  onToggle: (item: string) => void;
  label: string;
}) {
  const selected = new Set(splitList(value));
  return (
    <div className="cycle-chips" role="group" aria-label={label}>
      {items.map((item) => (
        <button
          key={item}
          type="button"
          aria-pressed={selected.has(item)}
          className={selected.has(item) ? "on" : ""}
          onClick={() => onToggle(item)}
        >
          {item}
        </button>
      ))}
    </div>
  );
}

/** Cycle en cours : ce qui change d'une consultation à l'autre (le cycle habituel est dans l'anamnèse commune). */
export function GynCycleCard({ draft, patch }: { draft: PatientSnapshot; patch: AnaPatch }) {
  const status = cycleStatus(draft.g_ddr, socleValue(draft, "g_cycle"));
  const menopause = socleValue(draft, "g_meno") === "oui";

  return (
    <AnaCard title="🔵 Cycle actuel et symptômes" ar="الدورة الحالية">
      <div className="dossier-form-grid triple">
        <Field label="Date des dernières règles (DDR)">
          <TextInput type="date" value={draft.g_ddr} onChange={(v) => patch("g_ddr", v)} />
        </Field>
        <div className="cycle-status span2" role="status">
          {status ? (
            <>
              <strong>J{status.day} du cycle</strong>
              {status.usual ? <span> · cycle habituel de {status.usual} jours</span> : null}
              {status.lateBy > 0 && !menopause ? (
                <p className="cycle-late">
                  Retard de règles de {status.lateBy} jour{status.lateBy > 1 ? "s" : ""} : penser à éliminer une grossesse.
                </p>
              ) : null}
            </>
          ) : (
            <span>Renseignez la DDR pour situer la patiente dans son cycle.</span>
          )}
        </div>
        <Field label="Durée des dernières règles (j)">
          <TextInput type="number" value={draft.g_regles_act_duree} placeholder="5" onChange={(v) => patch("g_regles_act_duree", v)} />
        </Field>
        <Field label="Abondance des dernières règles">
          <SelectInput
            value={draft.g_regles_act_abond}
            onChange={(v) => patch("g_regles_act_abond", v)}
            options={[
              { value: "faibles", label: "Faibles" },
              { value: "normales", label: "Normales" },
              { value: "abondantes", label: "Abondantes" },
              { value: "caillots", label: "Abondantes avec caillots" },
            ]}
          />
        </Field>
        <Field label="Saignements en dehors des règles">
          <PillGroup
            name="g-metro"
            value={draft.g_metro || "non"}
            options={[
              { value: "non", label: "Non" },
              { value: "oui", label: "Oui" },
              { value: "contact", label: "Après rapport" },
            ]}
            onChange={(v) => patch("g_metro", v)}
          />
        </Field>
        <Field label="Leucorrhées">
          <SelectInput value={draft.g_leuco} onChange={(v) => patch("g_leuco", v)} options={GYN_LEUCO} />
        </Field>
        <Field label="Signes associés aux leucorrhées" className="span2">
          <Chips
            label="Signes associés aux leucorrhées"
            items={LEUCO_SIGNS}
            value={draft.g_leuco_signes}
            onToggle={(i) => patch("g_leuco_signes", toggleInList(draft.g_leuco_signes, i))}
          />
        </Field>
        <Field label="Activité sexuelle">
          <PillGroup
            name="g-sex"
            value={draft.g_sex || "oui"}
            options={[
              { value: "oui", label: "Active" },
              { value: "non", label: "Non active" },
            ]}
            onChange={(v) => patch("g_sex", v)}
          />
        </Field>
        <Field label="Grossesse possible" className="span2">
          <PillGroup
            name="g-grossesse"
            value={draft.g_grossesse_possible}
            options={[
              { value: "non", label: "Non" },
              { value: "possible", label: "Possible" },
              { value: "test_neg", label: "Test négatif" },
              { value: "test_pos", label: "Test positif" },
            ]}
            onChange={(v) => patch("g_grossesse_possible", v)}
          />
        </Field>
        <Field label="Symptômes du cycle" className="span3">
          <Chips
            label="Symptômes du cycle"
            items={CYCLE_SYMPTOMS}
            value={draft.g_symptomes_cycle}
            onToggle={(i) => patch("g_symptomes_cycle", toggleInList(draft.g_symptomes_cycle, i))}
          />
        </Field>
      </div>
    </AnaCard>
  );
}
