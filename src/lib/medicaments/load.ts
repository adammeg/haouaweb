import type { MedicamentVei } from "./types";
import { setMedicamentIndex } from "./search";

let cache: MedicamentVei[] | null = null;
let loading: Promise<MedicamentVei[]> | null = null;

/** Charge la liste VEI (lazy, une seule fois par session). */
export async function loadMedicamentsVei(): Promise<MedicamentVei[]> {
  if (cache) return cache;
  if (loading) return loading;

  loading = import("@/data/medicaments-vei.json").then((mod) => {
    const list = mod.default as MedicamentVei[];
    cache = list;
    setMedicamentIndex(list);
    return list;
  });

  return loading;
}

export function getMedicamentsCache(): MedicamentVei[] | null {
  return cache;
}
