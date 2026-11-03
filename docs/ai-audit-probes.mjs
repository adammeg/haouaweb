/**
 * Read-only characterization probes for the AI review, 2026-11-02.
 * Run: node docs/ai-audit-probes.mjs (Node >= 22.15).
 * These report current behavior, including defects; they are not clinical validation.
 * No dependencies, database, provider credentials, or network requests are used.
 */
import { registerHooks, stripTypeScriptTypes } from "node:module";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/") || (specifier.startsWith(".") && context.parentURL?.endsWith(".ts"))) {
      const base = specifier.startsWith("@/")
        ? resolve(root, "src", specifier.slice(2))
        : fileURLToPath(new URL(specifier, context.parentURL));
      for (const candidate of [base, `${base}.ts`, resolve(base, "index.ts")]) {
        if (candidate.endsWith(".ts") && existsSync(candidate)) {
          return { url: pathToFileURL(candidate).href, shortCircuit: true };
        }
      }
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url.endsWith(".ts")) {
      const source = readFileSync(fileURLToPath(url), "utf8");
      return {
        format: "module",
        source: stripTypeScriptTypes(source),
        shortCircuit: true,
      };
    }
    return nextLoad(url, context);
  },
});

const { profileFromSnapshot } = await import("../src/lib/assist/profile.ts");
const { runAssist } = await import("../src/lib/assist/run.ts");
const { scoreFGR, scoreFMFPE, scoreCPR } = await import("../src/lib/assist/scores-obst.ts");
const { scoreGDM } = await import("../src/lib/assist/scores-cross.ts");
const { Norm } = await import("../src/lib/assist/norm.ts");
const { hadlockPfe4 } = await import("../src/lib/growth-curves/hadlock-pfe.ts");
const { buildDossierContextForIa, stableClinicalDataKey } = await import("../src/lib/ia/build-dossier-context.ts");
const { validateClinicalAiAnalysis } = await import("../src/lib/ia/clinical-analysis-schema.ts");
const { retrieveRagChunks, getRagChunkCount } = await import("../src/lib/rag/rag-engine.ts");
const { createChatCompletionsTextStream } = await import("../src/lib/ia/openai-chat-stream.ts");

const observations = {};
const base = { id: "synthetic-audit-only", specialite: "obst" };
const profile = (overrides = {}) => profileFromSnapshot({ ...base, ...overrides });
const score = (snapshot, name) => runAssist(profileFromSnapshot(snapshot)).executed.find((s) => s.score_name === name);

observations.kbChunkCount = getRagChunkCount();
observations.shortAcronyms = Object.fromEntries(["PE", "DV", "AO", "T21"].map((q) => [q, retrieveRagChunks(q).map((c) => c.id)]));
observations.frenchDecimalsAndGestation = {
  input: { o_terme: "13 SA + 6j", i_amh_ngml: "1,2" },
  parsedWeeks: profile({ o_terme: "13 SA + 6j" }).gestational_age_weeks,
  parsedAmh: profile({ i_amh_ngml: "1,2" }).amh_ngml,
};
const pma = { id: base.id, specialite: "inf", ddn: "1996-01-01", i_cfa: "8", i_amh_ngml: "0.5" };
observations.poseidonUnit = score(pma, "POSEIDON");
observations.poseidonPreviousResponse = score({ ...pma, i_amh_ngml: "2", i_mauvaise_reponse: "oui" }, "POSEIDON");
observations.ivfMapping = {
  mapped: profileFromSnapshot({ ...pma, i_cause_inf: "endometriose", i_spermo: "oui", i_spermo_res: "azoo" }),
  endometriosis: score({ ...pma, i_cause_inf: "endometriose" }, "HAWAE_IVF_Prognosis")?.value,
  unexplained: score({ ...pma, i_cause_inf: "inexpliquee" }, "HAWAE_IVF_Prognosis")?.value,
};
// Keep the output focused on the mismatched fields.
observations.ivfMapping.mapped = {
  infertility_cause: observations.ivfMapping.mapped.infertility_cause,
  sperm_quality: observations.ivfMapping.mapped.sperm_quality,
};
observations.partialBpp = scoreFGR(profile({ o_terme: "30", o_pfe: "900", o_bpp_nst: "1" }));
observations.gdmMissingFasting = scoreGDM(profile({ o_terme: "26", o_hgpo_t1: "2.0" }));
observations.gdmOnlyFasting = scoreGDM(profile({ o_terme: "26", o_gly: "0.8" }));
observations.emptyObstetricProfile = runAssist(profile());
observations.gynecologyMissingQuestions = runAssist(profileFromSnapshot({ ...base, specialite: "gyn" })).questions_needed;
observations.peOutsidePopulation = scoreFMFPE(profile({ specialite: "gyn", ddn: "1990-01-01", ec_poids: "65", o_terme: "30", ec_ta: "120/80", o_uta_ip_g: "1", o_uta_ip_d: "1" }));
observations.cprBelowOne = scoreCPR(profile({ o_terme: "32", o_ip_acm: "0.95", o_ip_ao: "1" }));
observations.hadlockDisagreement = { measurementsMm: [80, 290, 270, 60], assist: Norm.hadlockEfw(80, 290, 270, 60), growthCurves: hadlockPfe4(80, 290, 270, 60) };
const context = buildDossierContextForIa({ ...pma, o_atcd_pe: "oui", o_plgf_mom: "0.123", i_amh_ngml: "0.567", i_cause_inf: "endometriose" });
observations.contextMissingFields = { plgfValuePresent: context.includes("0.123"), amhValuePresent: context.includes("0.567"), causePresent: context.includes("endometriose") };
observations.cacheChangesOnAssistTimestamp = stableClinicalDataKey(base) !== stableClinicalDataKey({ ...base, hawaeAssistAt: "2026-11-02T00:00:00Z" });
const fabricated = { source: "Fabricated audit source", year: 2026, title: "Not in the supplied KB" };
try {
  validateClinicalAiAnalysis({ schemaVersion: "clinical-analysis-v1", summary: ["Synthetic case"], hypotheses: [], redFlags: [], missingInformation: [], suggestedInvestigations: [], followUp: [], citations: [fabricated], limitations: ["Synthetic data"] });
  observations.fabricatedCitationAccepted = true;
} catch {
  observations.fabricatedCitationAccepted = false;
}
const savedFetch = globalThis.fetch;
try {
  observations.sse = {};
  for (const [label, separator] of [["LF", "\n\n"], ["CRLF", "\r\n\r\n"]]) {
    globalThis.fetch = async () => new Response(`data: ${JSON.stringify({ choices: [{ delta: { content: "probe" } }] })}${separator}data: [DONE]${separator}`);
    const stream = await createChatCompletionsTextStream({ url: "https://invalid.example", headers: {}, model: "mock", temperature: 0, maxTokens: 64, messages: [] });
    observations.sse[label] = await new Response(stream).text();
  }
} finally {
  globalThis.fetch = savedFetch;
}
console.log(JSON.stringify(observations, null, 2));
