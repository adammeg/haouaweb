/** Médicament — liste VEI régime de base (Algérie, 27-11-2024) */

export type MedicamentVei = {
  code: string;
  /** Nom commercial complet */
  nom: string;
  dci: string;
  categorie: string;
  prix?: number;
  /** Avec prescription (O/N) */
  ap: string;
};

export type MedicamentSearchHit = {
  med: MedicamentVei;
  score: number;
  /** Extrait mis en évidence pour l'UI */
  matchField: "nom" | "dci";
};
