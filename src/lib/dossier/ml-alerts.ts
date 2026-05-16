import type { PatientSnapshot } from "@/types/domain";
import { patientAgeYears } from "@/lib/patient-utils";

export type MlAlert = {
  level: "danger" | "warn" | "info";
  icon: string;
  title: string;
  sub: string;
};

export function computeMLAlerts(d: PatientSnapshot): MlAlert[] {
  const alerts: MlAlert[] = [];
  const spec = d.specialite || "";

  if (!d.motif) {
    alerts.push({
      level: "warn",
      icon: "📝",
      title: "Motif non renseigné",
      sub: "Obligatoire pour tout dossier médical",
    });
  }
  if (!d.ec_ta && (d.ec_poids || d.motif)) {
    alerts.push({
      level: "warn",
      icon: "💉",
      title: "Tension artérielle manquante",
      sub: "À mesurer à chaque consultation",
    });
  }

  if (spec === "obst") {
    if (d.ec_ta) {
      const parts = d.ec_ta.split("/");
      const sys = parseInt(parts[0], 10);
      const dia = parseInt(parts[1], 10);
      if (sys >= 160 || dia >= 110) {
        alerts.push({
          level: "danger",
          icon: "🔴",
          title: `TA ${d.ec_ta} — Critère de sévérité HTA`,
          sub: "Pré-éclampsie sévère à éliminer — voir fiche protocole",
        });
      } else if (sys >= 140 || dia >= 90) {
        alerts.push({
          level: "warn",
          icon: "⚠️",
          title: `TA ${d.ec_ta} — HTA gravidique`,
          sub: "Bilan pré-éclampsie : protéinurie, plaquettes, LDH, uricémie",
        });
      }
    }
    if ((d.o_grp ?? "").includes("-") && !d.o_rai) {
      alerts.push({
        level: "danger",
        icon: "🩸",
        title: "Rhésus négatif — RAI non documentée",
        sub: "Immunisation Rh : risque fœtal grave — RAI obligatoire",
      });
    }
    if (d.o_bcf === "abs") {
      alerts.push({
        level: "danger",
        icon: "🚨",
        title: "BCF absents",
        sub: "MFIU à éliminer en urgence — échographie immédiate",
      });
    }
    if (d.o_maf === "dim") {
      alerts.push({
        level: "warn",
        icon: "👶",
        title: "MAF diminués",
        sub: "Monitoring RCF + échographie de vitalité fœtale",
      });
    }
    const hb = parseFloat(d.o_hb ?? "0");
    if (hb > 0 && hb < 10) {
      alerts.push({
        level: "danger",
        icon: "🔴",
        title: `Anémie sévère — Hb ${hb} g/dL`,
        sub: "Fer IV à envisager — bilan étiologique",
      });
    } else if (hb > 0 && hb < 11) {
      alerts.push({
        level: "warn",
        icon: "🩸",
        title: `Anémie — Hb ${hb} g/dL`,
        sub: "Supplémentation fer orale + réévaluation NFS",
      });
    }
  }

  if (spec === "gyn") {
    if (!d.g_fcv || !d.g_fcv_res || d.g_fcv_res === "Jamais réalisé") {
      const age = patientAgeYears(d.ddn) ?? 0;
      if (age >= 25) {
        alerts.push({
          level: "warn",
          icon: "🔬",
          title: "FCV non documenté",
          sub: "Dépistage cancer col obligatoire dès 25 ans",
        });
      }
    }
    const fcv = (d.g_fcv_res ?? "").toLowerCase();
    if (fcv.match(/asc|lsil|hsil|agc|frottis anormal/)) {
      alerts.push({
        level: "danger",
        icon: "⚠️",
        title: `FCV anormal : ${d.g_fcv_res}`,
        sub: "Colposcopie à programmer — ne pas différer",
      });
    }
    if (d.g_dysmen === "Sévère (invalidante)") {
      alerts.push({
        level: "warn",
        icon: "🩸",
        title: "Dysménorrhée sévère",
        sub: "Endométriose à éliminer — écho pelvienne + IRM",
      });
    }
  }

  if (spec === "inf") {
    if (!d.i_hsg || d.i_hsg === "Non réalisée") {
      alerts.push({
        level: "warn",
        icon: "🔬",
        title: "HSG non réalisée",
        sub: "Perméabilité tubaire indispensable avant tout traitement",
      });
    }
    if (!d.i_spermo_res || d.i_spermo_res === "Non réalisé") {
      alerts.push({
        level: "warn",
        icon: "👨",
        title: "Spermogramme non documenté",
        sub: "Facteur masculin à éliminer en 1ère intention",
      });
    }
    if (!d.i_hormones) {
      alerts.push({
        level: "warn",
        icon: "🧪",
        title: "Bilan hormonal J3 manquant",
        sub: "FSH, LH, E2, AMH — indispensable",
      });
    }
  }

  if (
    (d.atcdMed ?? "").toLowerCase().includes("allergi") ||
    (d.allergies ?? "").length > 2
  ) {
    alerts.push({
      level: "info",
      icon: "💊",
      title: "Allergie documentée",
      sub: "Vérifier avant toute prescription",
    });
  }

  return alerts;
}
