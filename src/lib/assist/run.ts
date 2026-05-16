import { detectContradictions } from "./contradictions";
import { generateQuestions } from "./questions";
import { Norm } from "./norm";
import {
  scoreFMFT21,
  scoreFMFPE,
  scoreMiniPIERS,
  scoreCPR,
  scoreFGR,
  scoreCL,
} from "./scores-obst";
import { scoreROMA, scoreADNEX, scorePOPQ, scorePFDI20 } from "./scores-gyn";
import { scorePOSEIDON, scoreOHSS, scoreIVFPrognosis } from "./scores-pma";
import { scoreBMI, scoreGDM, scoreVTE } from "./scores-cross";
import type {
  AssistProfile,
  AssistReport,
  AssistRunResult,
  MetaRisk,
  RiskLevel,
  ScoreOutput,
} from "./types";
import { RISK, RISK_NUM } from "./types";

type ScoreFn = (p: AssistProfile) => ScoreOutput | null;

const SCORE_RUNNERS: ScoreFn[] = [
  scoreFMFT21,
  scoreFMFPE,
  scoreMiniPIERS,
  scoreCPR,
  scoreFGR,
  scoreCL,
  scoreROMA,
  scoreADNEX,
  scorePOPQ,
  scorePFDI20,
  scorePOSEIDON,
  scoreOHSS,
  scoreIVFPrognosis,
  scoreBMI,
  scoreGDM,
  scoreVTE,
];

function enrichProfile(p: AssistProfile): AssistProfile {
  const ep = { ...p };
  if (ep.weight_kg && ep.height_cm) {
    ep.bmi_computed = Norm.bmi(ep.weight_kg, ep.height_cm);
  }
  if (ep.amh_ngml && !ep.amh_pmol) {
    ep.amh_normalized_pmol = Norm.amhNgmlToPmol(ep.amh_ngml);
  } else if (ep.amh_pmol) {
    ep.amh_normalized_pmol = ep.amh_pmol;
  }
  return ep;
}

function computeMetaRisk(scores: ScoreOutput[]): MetaRisk {
  if (!scores.length) {
    return {
      overall: RISK.UNKNOWN,
      critical_count: 0,
      high_count: 0,
      domains: {},
    };
  }
  const domMax: Record<string, number> = {};
  scores.forEach((s) => {
    domMax[s.domain] = Math.max(
      domMax[s.domain] || 0,
      RISK_NUM[s.risk_level] || 0,
    );
  });
  const numToStr: Record<number, RiskLevel> = {
    0: RISK.UNKNOWN,
    1: RISK.LOW,
    2: RISK.INTERMEDIATE,
    3: RISK.HIGH,
    4: RISK.CRITICAL,
  };
  const overall = Math.max(...Object.values(domMax));
  return {
    overall: numToStr[overall],
    domains: Object.fromEntries(
      Object.entries(domMax).map(([d, v]) => [d, numToStr[v]]),
    ),
    critical_count: scores.filter((s) => s.risk_level === RISK.CRITICAL).length,
    high_count: scores.filter((s) => s.risk_level === RISK.HIGH).length,
  };
}

function buildReport(
  scores: ScoreOutput[],
  alerts: ScoreOutput[],
  contras: { message: string; severity: string }[],
): AssistReport {
  const meta = computeMetaRisk(scores);
  const icons: Record<string, string> = {
    low: "🟢",
    intermediate: "🟡",
    high: "🔴",
    critical: "⛔",
    unknown: "⚪",
  };
  const msgs: Record<string, string> = {
    low: "Profil de risque global FAIBLE — Suivi standard",
    intermediate: "Profil de risque INTERMÉDIAIRE — Surveillance renforcée",
    high: `Profil de risque ÉLEVÉ (${meta.high_count} score(s))`,
    critical: `ALERTE CRITIQUE (${meta.critical_count} score(s))`,
    unknown: "Données insuffisantes",
  };
  const lv = meta.overall;
  const priorityActions = alerts
    .sort(
      (a, b) =>
        (RISK_NUM[b.risk_level] || 0) - (RISK_NUM[a.risk_level] || 0),
    )
    .slice(0, 5)
    .map((s) => `[${s.score_name}] ${s.recommended_actions[0] || ""}`);

  const domainReports: AssistReport["domain_reports"] = {};
  scores.forEach((s) => {
    if (!domainReports[s.domain]) domainReports[s.domain] = [];
    domainReports[s.domain].push({
      score: s.score_name,
      value: s.value,
      risk: s.risk_level,
      summary: s.interpretation,
    });
  });

  return {
    summary: `${icons[lv] || "⚪"} ${msgs[lv] || ""}`,
    priority_actions: priorityActions,
    domain_reports: domainReports,
    contradictions_warnings: contras
      .filter((c) => c.severity === "error" || c.severity === "warning")
      .map((c) => c.message),
    disclaimer:
      "Outil d'aide à la décision — Ne remplace pas le jugement clinique",
  };
}

export function runAssist(rawProfile: AssistProfile): AssistRunResult {
  const p = enrichProfile(rawProfile);
  const executed: ScoreOutput[] = [];
  const allMissing: string[] = [];

  for (const fn of SCORE_RUNNERS) {
    let result: ScoreOutput | null;
    try {
      result = fn(p);
    } catch {
      continue;
    }
    if (!result) continue;
    if (
      result.risk_level === RISK.UNKNOWN &&
      result.missing_inputs?.length
    ) {
      allMissing.push(...result.missing_inputs);
    } else {
      executed.push(result);
    }
  }

  const uniqueMissing = [...new Set(allMissing)];
  const questions = generateQuestions(uniqueMissing, 8);
  const alerts = executed.filter(
    (s) => s.risk_level === RISK.HIGH || s.risk_level === RISK.CRITICAL,
  );
  const contras = detectContradictions(executed, p);
  const meta = computeMetaRisk(executed);
  const report = buildReport(executed, alerts, contras);

  return {
    executed,
    alerts,
    contradictions: contras,
    questions_needed: questions,
    meta_risk: meta,
    report,
  };
}
