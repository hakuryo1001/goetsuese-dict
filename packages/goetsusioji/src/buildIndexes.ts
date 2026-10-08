import type { CharactersMap, GoetsusiojiLexicon } from "./types";

function hasGlyph(entries: unknown): boolean {
  if (!Array.isArray(entries) || entries.length === 0) return false;
  return entries.some(
    (e) =>
      e &&
      typeof e === "object" &&
      typeof (e as { glyph?: unknown }).glyph === "string" &&
      String((e as { glyph: string }).glyph).trim().length > 0,
  );
}

/** Build lookup indexes from a loaded characters map. */
export function buildIndexes(map: CharactersMap): GoetsusiojiLexicon {
  const keys = Object.keys(map).sort();
  const keySet = new Set(keys);
  const charToSyllables = new Map<string, string[]>();
  let filledCount = 0;

  for (const syllable of keys) {
    if (hasGlyph(map[syllable])) filledCount += 1;

    const entries = map[syllable];
    if (!Array.isArray(entries)) continue;

    const seen = new Set<string>();
    for (const entry of entries) {
      const glyph = entry?.glyph;
      if (typeof glyph !== "string" || !glyph.trim()) continue;
      if (seen.has(glyph)) continue;
      seen.add(glyph);

      const existing = charToSyllables.get(glyph);
      if (existing) existing.push(syllable);
      else charToSyllables.set(glyph, [syllable]);
    }
  }

  return { map, keys, keySet, charToSyllables, filledCount };
}
