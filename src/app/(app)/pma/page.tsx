import { redirect } from "next/navigation";

/** Ancienne route outils — PMA est dans le dossier (spécialité Infertilité / AMP). */
export default function PmaPage() {
  redirect("/dossier");
}
