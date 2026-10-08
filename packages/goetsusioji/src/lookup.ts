import { normalizeBuffer } from "./normalize";
import type { GoetsusiojiCandidate, GoetsusiojiLexicon } from "./types";

/** Binary search lower bound on sorted syllable keys. */
export function lowerBoundKey(keys: string[], prefix: string): number {
  let lo = 0;
  let hi = keys.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (keys[mid]! < prefix) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

function candidatesForKey(
  lex: GoetsusiojiLexicon,
  syllable: string,
  out: GoetsusiojiCandidate[],
  limit: number,
  seenInPass: Set<string>,
): void {
  const entries = lex.map[syllable];
  if (!Array.isArray(entries)) return;

  for (let index = 0; index < entries.length && out.length < limit; index++) {
    const entry = entries[index];
    const glyph = entry?.glyph ?? null;
    const han = typeof entry?.han === "string" ? entry.han : "";
    if (!glyph && !han) continue;

    const dedupeKey = `${syllable}\0${glyph ?? ""}\0${han}`;
    if (seenInPass.has(dedupeKey)) continue;
    seenInPass.add(dedupeKey);

    out.push({ syllable, glyph, han, index });
  }
}

/**
 * Prefix match on normalized syllable keys → flattened candidates.
 * Exact key matches are listed before other prefix extensions.
 * Includes Han-only rows (null glyph).
 */
export function prefixCandidates(
  lex: GoetsusiojiLexicon,
  buffer: string,
  limit = 50,
): GoetsusiojiCandidate[] {
  const prefix = normalizeBuffer(buffer);
  if (!prefix) return [];

  const out: GoetsusiojiCandidate[] = [];
  const seenInPass = new Set<string>();

  if (lex.keySet.has(prefix)) {
    candidatesForKey(lex, prefix, out, limit, seenInPass);
  }

  const lo = lowerBoundKey(lex.keys, prefix);
  for (let i = lo; i < lex.keys.length && out.length < limit; i++) {
    const key = lex.keys[i]!;
    if (!key.startsWith(prefix)) break;
    if (key === prefix) continue;
    candidatesForKey(lex, key, out, limit, seenInPass);
  }

  return out;
}

/** Siauzy glyphs for an exact normalized syllable (skips nulls). */
export function exactGlyphs(lex: GoetsusiojiLexicon, buffer: string): string[] {
  const key = normalizeBuffer(buffer);
  if (!key) return [];
  const entries = lex.map[key];
  if (!Array.isArray(entries)) return [];

  const out: string[] = [];
  const seen = new Set<string>();
  for (const entry of entries) {
    const glyph = entry?.glyph;
    if (typeof glyph !== "string" || !glyph.trim()) continue;
    if (seen.has(glyph)) continue;
    seen.add(glyph);
    out.push(glyph);
  }
  return out;
}

/** Whether the normalized syllable is a known lexicon key. */
export function isKnownSyllable(
  lex: GoetsusiojiLexicon,
  buffer: string,
): boolean {
  return lex.keySet.has(normalizeBuffer(buffer));
}

/** Whether a known syllable has at least one Siauzy glyph. */
export function hasSiauzyGlyph(
  lex: GoetsusiojiLexicon,
  buffer: string,
): boolean {
  const key = normalizeBuffer(buffer);
  if (!key) return false;
  const entries = lex.map[key];
  if (!Array.isArray(entries)) return false;
  return entries.some(
    (e) => typeof e?.glyph === "string" && e.glyph.trim().length > 0,
  );
}
