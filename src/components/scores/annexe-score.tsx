"use client";

import { useMemo, useState } from "react";
import {
  calcAnnexeUnified,
  type AnnexeInput,
  type IotaCriteria,
  type OradsInput,
} from "@/lib/scores/annexe";
import { SCORE_LEVEL_BG, SCORE_LEVEL_COLORS } from "@/lib/scores";
import { ScoreCriterion, ScoreInput } from "./score-shell";

const SELECT_CLS =
  "w-full rounded-lg border border-[var(--border)] bg-white px-2.5 py-1.5 text-sm";

const DEFAULT_IOTA: IotaCriteria = {
  b1: false,
  b2: false,
  b3: false,
  b4: false,
  b5: false,
  m1: false,
  m2: false,
  m3: false,
  m4: false,
  m5: false,
};

const DEFAULT_ORADS: OradsInput = {
  visComplete: true,
  ovariesNormal: false,
  type: "kyste_simple",
  solidComponent: false,
  doppler: "faible",
  ascite: false,
};

const DEFAULT: AnnexeInput = {
  age: 45,
  menopause: true,
  ca125: 0,
  he4: 0,
  dmax: 0,
  oncologyCenter: false,
  iota: DEFAULT_IOTA,
  adnex: {
    solidPct: 0,
    pap: "0",
    acousticShadows: false,
    ascites: false,
  },
  orads: DEFAULT_ORADS,
};

const IOTA_B: { key: keyof IotaCriteria; label: string }[] = [
  { key: "b1", label: "Lésion uniloculaire" },
  { key: "b2", label: "Composante solide < 7 mm (sans irrégularité)" },
  { key: "b3", label: "Ombres acoustiques présentes" },
  { key: "b4", label: "Masse multiloculaire lisse < 100 mm" },
  { key: "b5", label: "Absence de flux Doppler détectable" },
];

const IOTA_M: { key: keyof IotaCriteria; label: string }[] = [
  { key: "m1", label: "Tumeur solide irrégulière" },
  { key: "m2", label: "Ascite présente" },
  { key: "m3", label: "≥ 4 projections papillaires" },
  { key: "m4", label: "Masse multiloculaire-solide irrégulière ≥ 100 mm" },
  { key: "m5", label: "Flux Doppler très abondant (score 4)" },
];

export function AnnexeScore() {
  const [input, setInput] = useState<AnnexeInput>(DEFAULT);
  const result = useMemo(() => calcAnnexeUnified(input), [input]);

  function patch<K extends keyof AnnexeInput>(k: K, v: AnnexeInput[K]) {
    setInput((s) => ({ ...s, [k]: v }));
  }

  function patchIota(key: keyof IotaCriteria, v: boolean) {
    setInput((s) => ({ ...s, iota: { ...s.iota, [key]: v } }));
  }

  function patchAdnex<K extends keyof AnnexeInput["adnex"]>(
    k: K,
    v: AnnexeInput["adnex"][K],
  ) {
    setInput((s) => ({ ...s, adnex: { ...s.adnex, [k]: v } }));
  }

  function patchOrads<K extends keyof OradsInput>(k: K, v: OradsInput[K]) {
    setInput((s) => ({ ...s, orads: { ...s.orads, [k]: v } }));
  }

  const verdictLevel: "low" | "medium" | "high" | "critical" =
    result.verdictLevel === "critical" ? "critical" : result.verdictLevel;
  const verdictColor = SCORE_LEVEL_COLORS[verdictLevel];
  const verdictBg = SCORE_LEVEL_BG[verdictLevel];

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-xs)] sm:p-6">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-lg font-bold text-[var(--ink)]">
          🔵 Masse Annexielle — IOTA + ADNEX + ROMA + O-RADS
        </h2>
        <span className="rounded-full bg-[var(--teal-pale)] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[var(--teal)]">
          Van Calster · ACR 2022
        </span>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <ScoreCriterion label="Âge (ans)">
              <ScoreInput value={input.age} onChange={(v) => patch("age", v)} min={10} max={90} />
            </ScoreCriterion>
            <ScoreCriterion label="Ménopause">
              <select
                className={SELECT_CLS}
                value={input.menopause ? "1" : "0"}
                onChange={(e) => patch("menopause", e.target.value === "1")}
              >
                <option value="0">Préménopause</option>
                <option value="1">Post-ménopause</option>
              </select>
            </ScoreCriterion>
            <ScoreCriterion label="CA-125 (U/mL)">
              <ScoreInput value={input.ca125} onChange={(v) => patch("ca125", v)} min={0} max={5000} />
            </ScoreCriterion>
            <ScoreCriterion label="HE4 (pmol/L)">
              <ScoreInput value={input.he4} onChange={(v) => patch("he4", v)} min={0} max={2000} />
            </ScoreCriterion>
            <ScoreCriterion label="Diamètre max (mm)">
              <ScoreInput value={input.dmax} onChange={(v) => patch("dmax", v)} min={0} max={300} />
            </ScoreCriterion>
            <ScoreCriterion label="Centre oncologie">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={input.oncologyCenter}
                  onChange={(e) => patch("oncologyCenter", e.target.checked)}
                />
                Centre spécialisé
              </label>
            </ScoreCriterion>
          </div>

          <div className="rounded-xl border border-[var(--border)] p-4">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--teal)]">
              IOTA Simple Rules
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-2 text-[11px] font-semibold text-emerald-700">Critères B (bénins)</p>
                <div className="space-y-1.5">
                  {IOTA_B.map(({ key, label }) => (
                    <label key={key} className="flex gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={input.iota[key]}
                        onChange={(e) => patchIota(key, e.target.checked)}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-[11px] font-semibold text-red-700">Critères M (malins)</p>
                <div className="space-y-1.5">
                  {IOTA_M.map(({ key, label }) => (
                    <label key={key} className="flex gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={input.iota[key]}
                        onChange={(e) => patchIota(key, e.target.checked)}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border)] p-4">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--teal)]">
              ADNEX · ROMA · O-RADS
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <ScoreCriterion label="Composante solide (%)">
                <ScoreInput
                  value={input.adnex.solidPct}
                  onChange={(v) => patchAdnex("solidPct", v)}
                  min={0}
                  max={100}
                />
              </ScoreCriterion>
              <ScoreCriterion label="Proj. papillaires">
                <select
                  className={SELECT_CLS}
                  value={input.adnex.pap}
                  onChange={(e) =>
                    patchAdnex("pap", e.target.value as AnnexeInput["adnex"]["pap"])
                  }
                >
                  <option value="0">0</option>
                  <option value="1_3">1–3</option>
                  <option value="4plus">≥ 4</option>
                </select>
              </ScoreCriterion>
              <ScoreCriterion label="Ombres acoustiques">
                <input
                  type="checkbox"
                  checked={input.adnex.acousticShadows}
                  onChange={(e) => patchAdnex("acousticShadows", e.target.checked)}
                />
              </ScoreCriterion>
              <ScoreCriterion label="Ascite">
                <input
                  type="checkbox"
                  checked={input.adnex.ascites}
                  onChange={(e) => patchAdnex("ascites", e.target.checked)}
                />
              </ScoreCriterion>
              <ScoreCriterion label="Évaluation complète">
                <input
                  type="checkbox"
                  checked={input.orads.visComplete}
                  onChange={(e) => patchOrads("visComplete", e.target.checked)}
                />
              </ScoreCriterion>
              <ScoreCriterion label="Ovaires normaux">
                <input
                  type="checkbox"
                  checked={input.orads.ovariesNormal}
                  onChange={(e) => patchOrads("ovariesNormal", e.target.checked)}
                />
              </ScoreCriterion>
              <ScoreCriterion label="Type lésion">
                <select
                  className={SELECT_CLS}
                  value={input.orads.type}
                  onChange={(e) =>
                    patchOrads("type", e.target.value as OradsInput["type"])
                  }
                >
                  <option value="kyste_simple">Kyste simple</option>
                  <option value="corps_jaune">Corps jaune</option>
                  <option value="kyste_hemorragique_typique">Kyste hémorragique typique</option>
                  <option value="endometriome_typique">Endométriome typique</option>
                  <option value="autre">Autre</option>
                </select>
              </ScoreCriterion>
              <ScoreCriterion label="Composante solide">
                <input
                  type="checkbox"
                  checked={input.orads.solidComponent}
                  onChange={(e) => patchOrads("solidComponent", e.target.checked)}
                />
              </ScoreCriterion>
              <ScoreCriterion label="Doppler">
                <select
                  className={SELECT_CLS}
                  value={input.orads.doppler}
                  onChange={(e) =>
                    patchOrads("doppler", e.target.value as OradsInput["doppler"])
                  }
                >
                  <option value="faible">Faible</option>
                  <option value="modere">Modéré</option>
                  <option value="abondant">Abondant</option>
                </select>
              </ScoreCriterion>
            </div>
          </div>
        </div>

        <aside className="space-y-3">
          <div
            className="rounded-xl border p-4"
            style={{ background: verdictBg, borderColor: verdictColor }}
          >
            <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: verdictColor }}>
              Verdict unifié
            </div>
            <p className="mt-2 text-sm font-semibold leading-snug" style={{ color: verdictColor }}>
              {result.verdict}
            </p>
          </div>
          <SubScore
            title="IOTA"
            value={result.iota.verdict}
            level={result.iota.level}
          />
          {result.adnex ? (
            <SubScore
              title="ADNEX"
              value={`${result.adnex.pMalin.toFixed(1)} % malignité`}
              level={
                result.adnex.pMalin >= 30
                  ? "high"
                  : result.adnex.pMalin >= 10
                    ? "medium"
                    : "low"
              }
            />
          ) : null}
          {result.roma ? (
            <SubScore
              title="ROMA"
              value={`${result.roma.prob.toFixed(1)} % — ${result.roma.risk}`}
              level={result.roma.risk === "HAUT RISQUE" ? "high" : "low"}
            />
          ) : null}
          <SubScore
            title={`O-RADS ${result.orads.cat}`}
            value={result.orads.label}
            level={
              result.orads.cat >= 4 ? "high" : result.orads.cat === 3 ? "medium" : "low"
            }
            hint={`Risque : ${result.orads.risk}`}
          />
        </aside>
      </div>
    </section>
  );
}

function SubScore({
  title,
  value,
  level,
  hint,
}: {
  title: string;
  value: string;
  level: "low" | "medium" | "high";
  hint?: string;
}) {
  const color = SCORE_LEVEL_COLORS[level];
  const bg = SCORE_LEVEL_BG[level];
  return (
    <div className="rounded-xl border p-3" style={{ background: bg, borderColor: color }}>
      <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color }}>
        {title}
      </div>
      <div className="mt-1 text-sm font-semibold" style={{ color }}>
        {value}
      </div>
      {hint ? <p className="mt-1 text-[11px] text-[var(--ink-mid)]">{hint}</p> : null}
    </div>
  );
}
