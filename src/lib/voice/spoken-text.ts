/** Strip presentation markup without rewriting clinical numbers, units or negation. */
export function spokenText(text: string): string {
  return text.replace(/\[([^\]]+)\]\(https?:\/\/[^)]+\)/g, "$1")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s*[-*]\s+/gm, "")
    .replace(/\*\*|__|`/g, "").trim();
}

/** HeyGen consumes square brackets as control tags or silent text; retain their contents. */
export function heygenSpokenText(text: string): string {
  return spokenText(text).replace(/[\[\]]/g, "");
}
