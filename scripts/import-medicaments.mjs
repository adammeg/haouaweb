import XLSX from "xlsx";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const xlsPath = path.resolve(
  root,
  "..",
  "LISTE DES MEDICAMENTS CLASSES EN V E I COUVERTS PAR LE REGIME DE BASE 27-11-2024.xls",
);
const outPath = path.resolve(root, "src/data/medicaments-vei.json");

const wb = XLSX.readFile(xlsPath);
const sheet = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(sheet);

const meds = rows
  .map((r) => ({
    code: String(r.CODE_PCT ?? ""),
    nom: String(r.NOM_COMMERCIAL ?? "").trim(),
    dci: String(r.DCI ?? "").trim(),
    categorie: String(r.CATEGORIE ?? "").trim(),
    prix: typeof r.PRIX_PUBLIC === "number" ? r.PRIX_PUBLIC : undefined,
    ap: String(r.AP ?? "").trim(),
  }))
  .filter((m) => m.nom.length > 0);

fs.writeFileSync(outPath, JSON.stringify(meds));
console.log("Written", meds.length, "medicaments to", outPath);
const doli = meds.filter((m) => m.nom.toLowerCase().includes("doli"));
console.log("Doli matches:", doli.slice(0, 5).map((m) => m.nom));
