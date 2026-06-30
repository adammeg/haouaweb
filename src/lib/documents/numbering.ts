/** Numérotation automatique DOC-YYYY-NNNN */

export function nextDocumentNumber(
  year: number,
  seq: number,
): { year: number; seq: number; number: string } {
  const y = new Date().getFullYear();
  const nextSeq = year === y ? seq + 1 : 1;
  const number = `DOC-${y}-${String(nextSeq).padStart(4, "0")}`;
  return { year: y, seq: nextSeq, number };
}
