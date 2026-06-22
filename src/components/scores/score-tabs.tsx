import type { ReactElement } from "react";
import { MFMUScore } from "./mfmu-score";
import { FlammScore } from "./flamm-score";
import { BishopScore } from "./bishop-score";
import { ManningScore } from "./manning-score";
import { ApgarScore } from "./apgar-score";
import { HPPScore } from "./hpp-score";
import { FigoScore } from "./figo-score";
import { RASRMScore } from "./rasrm-score";
import { MenopauseScorePanel } from "./menopause-score-panel";
import { BreastCancerScore } from "./breast-cancer-score";
import { RCIUScore } from "./rciu-score";
import { AnnexeScore } from "./annexe-score";
import { LUSScore } from "./lus-score";
import { CTGScore } from "./ctg-score";
import { RPMScore } from "./rpm-score";
import { HRPScore } from "./hrp-score";
import { GEUScore } from "./geu-score";

export type ScoreGroup = "obst" | "gyn" | "menop" | "figo";

export type ScoreTab = {
  id: string;
  label: string;
  group: ScoreGroup;
  render: () => ReactElement;
};

/** 19 onglets scores — parité v51 */
export const SCORE_TABS: ScoreTab[] = [
  { id: "mfmu", label: "🏥 Score AVAC — MFMU", group: "obst", render: () => <MFMUScore /> },
  { id: "flamm", label: "📋 Flamm & Geiger", group: "obst", render: () => <FlammScore /> },
  { id: "bishop", label: "🔵 Score de Bishop", group: "obst", render: () => <BishopScore /> },
  { id: "manning", label: "👶 Score de Manning", group: "obst", render: () => <ManningScore /> },
  { id: "apgar", label: "⭐ Score d'Apgar", group: "obst", render: () => <ApgarScore /> },
  { id: "hpp", label: "🩸 Risque HPP", group: "obst", render: () => <HPPScore /> },
  { id: "rciu", label: "📈 Croissance fœtale", group: "obst", render: () => <RCIUScore /> },
  { id: "lus", label: "📏 LUS Cicatriciel", group: "obst", render: () => <LUSScore /> },
  { id: "ctg", label: "🫀 CTG — FIGO 2015", group: "obst", render: () => <CTGScore /> },
  { id: "rpm", label: "💧 RPM", group: "obst", render: () => <RPMScore /> },
  { id: "hrp", label: "🩸 HRP", group: "obst", render: () => <HRPScore /> },
  { id: "geu", label: "⚠️ GEU", group: "obst", render: () => <GEUScore /> },
  { id: "rasrm", label: "🧬 rASRM Endométriose", group: "gyn", render: () => <RASRMScore /> },
  { id: "annexe", label: "🔵 Masse Annexielle", group: "gyn", render: () => <AnnexeScore /> },
  { id: "menopause", label: "💊 Ménopause", group: "menop", render: () => <MenopauseScorePanel /> },
  { id: "figo-col", label: "🔬 FIGO Col", group: "figo", render: () => <FigoScore type="col" /> },
  { id: "figo-endo", label: "🔬 FIGO Endomètre", group: "figo", render: () => <FigoScore type="endo" /> },
  { id: "figo-ovaire", label: "🔬 FIGO Ovaire", group: "figo", render: () => <FigoScore type="ovaire" /> },
  { id: "sein", label: "🎗️ Cancer du sein", group: "figo", render: () => <BreastCancerScore /> },
];

export const SCORE_GROUP_LABELS: Record<ScoreGroup, string> = {
  obst: "Obstétrique",
  gyn: "Gynécologie",
  menop: "Ménopause",
  figo: "FIGO oncologie",
};
