import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { evaluateLearningPredictions } from "../src/lib/training/learning-evaluation.ts";

const [datasetPath, predictionsPath, reportPath] = process.argv.slice(2);
if (!datasetPath || !predictionsPath || !reportPath) {
  throw new Error("Usage: npm run eval:ai -- reviewed-cases.ndjson predictions.ndjson evaluation-report.json");
}
const output = resolve(reportPath);
if ([resolve(datasetPath), resolve(predictionsPath)].includes(output)) throw new Error("The report must not replace its input files");
const ndjson = (path) => readFileSync(path, "utf8").replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim()).map((line) => JSON.parse(line));
const report = evaluateLearningPredictions(ndjson(datasetPath), ndjson(predictionsPath));
writeFileSync(output, JSON.stringify(report, null, 2) + "\n", { flag: "wx" });
console.log(JSON.stringify({ report: output, heldOutCases: report.heldOutCases, models: report.metrics.length }));
