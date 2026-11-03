/** POSEIDON 2016, AMH in ng/mL; age defines group, observed yield defines subgroup. */
export function poseidonClassification(input: {
  age: number | null;
  amhNgml: number | null;
  afc: number | null;
  previousOocytes?: number | null;
  previousPoorResponse?: boolean | null;
}) {
  const { age, amhNgml, afc, previousOocytes } = input;
  const lowReserve = (amhNgml != null && amhNgml < 1.2) || (afc != null && afc < 5);
  const reserveKnown = lowReserve || (amhNgml != null && afc != null);
  const poor = input.previousPoorResponse === true || (previousOocytes != null && previousOocytes < 4);
  if (age == null || !reserveKnown) return { group: null, subgroup: null, lowReserve, adequateReserve: false, poorPrevResponse: poor };
  const group = lowReserve ? (age < 35 ? 3 : 4) : (poor || (previousOocytes != null && previousOocytes < 10)) ? (age < 35 ? 1 : 2) : null;
  const subgroup = group != null && group <= 2 && previousOocytes != null ? `${group}${previousOocytes < 4 ? "a" : "b"}` : null;
  return { group, subgroup, lowReserve, adequateReserve: !lowReserve, poorPrevResponse: poor };
}
