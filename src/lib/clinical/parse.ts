/** Strict parsers shared by clinical input adapters. Unknown/invalid stays null. */
export function clinicalNumber(value: string | number | null | undefined, min = 0, max = Infinity): number | null {
  if (value == null || value === "") return null;
  const raw = typeof value === "number" ? String(value) : value.trim().replace(",", ".");
  if (!/^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/.test(raw)) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n >= min && n <= max ? n : null;
}

export function gestationalWeeks(value?: string): number | null {
  if (!value?.trim()) return null;
  const match = value.trim().match(/^(\d{1,2})\s*(?:SA|semaines?|weeks?|w)?\s*\+\s*([0-6])\s*(?:j(?:ours?)?|d(?:ays?)?)?$/i);
  if (match) return clinicalNumber(Number(match[1]) + Number(match[2]) / 7, 0, 45);
  return clinicalNumber(value.trim().replace(/\s*(SA|semaines?|weeks?|w)$/i, ""), 0, 45);
}

export function clinicalInteger(value?: string, min = 0, max = Infinity): number | null {
  const n = clinicalNumber(value, min, max);
  return n != null && Number.isInteger(n) ? n : null;
}

export function clinicalBoolean(value?: string): boolean | null {
  if (value == null || !value.trim()) return null;
  const normalized = value.trim().toLowerCase();
  if (["oui", "yes", "1", "true"].includes(normalized)) return true;
  if (["non", "no", "0", "false"].includes(normalized)) return false;
  return null;
}

export function bloodPressure(value?: string): { systolic: number; diastolic: number } | null {
  const parts = value?.split("/");
  if (parts?.length !== 2) return null;
  const systolic = clinicalNumber(parts[0], 40, 300);
  const diastolic = clinicalNumber(parts[1], 20, 200);
  return systolic != null && diastolic != null && systolic > diastolic ? { systolic, diastolic } : null;
}

export function ageYears(birthDate?: string, now = new Date()): number | null {
  if (!birthDate || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) return null;
  const birth = new Date(`${birthDate}T00:00:00Z`);
  if (!Number.isFinite(birth.getTime()) || birth.toISOString().slice(0, 10) !== birthDate) return null;
  let age = now.getUTCFullYear() - birth.getUTCFullYear();
  if (now.getUTCMonth() < birth.getUTCMonth() || (now.getUTCMonth() === birth.getUTCMonth() && now.getUTCDate() < birth.getUTCDate())) age--;
  return age >= 0 && age <= 120 ? age : null;
}
