import type { DictionaryEntry } from "./dictionary-types";
import { expandQueryVariants } from "./converter";
import {
  bareHeadword,
  getCatalog,
  normalizeNgvenPhrase,
  type HeadwordSummary,
} from "./catalog";
import type { RelatedGroups, RelatedItem } from "./related-types";

export type { RelatedGroups, RelatedItem } from "./related-types";

const DEFAULT_RELATED_LIMIT = 8;
const PER_CHARACTER_CAP = 3;

function toRelatedItem(summary: HeadwordSummary): RelatedItem {
  return {
    headword: summary.display || summary.key,
    display: summary.display || summary.key,
    ngven: summary.ngven,
  };
}

function resolveSeedKey(
  catalog: Awaited<ReturnType<typeof getCatalog>>,
  headword: string,
): string | null {
  const variants = expandQueryVariants(headword);
  for (const variant of variants) {
    if (catalog.headwordSummaries.has(variant)) return variant;
    const entries = catalog.byHeadword.get(variant);
    if (entries?.length) {
      const display =
        entries[0]?.headword.normalized || entries[0]?.headword.display || "";
      const key = display.trim().toLowerCase();
      if (key && catalog.headwordSummaries.has(key)) return key;
    }
  }
  const seed = headword.trim().toLowerCase();
  return catalog.headwordSummaries.has(seed) ? seed : null;
}

export async function resolveWord(headword: string): Promise<{
  canonicalHeadword: string;
  entries: DictionaryEntry[];
} | null> {
  const catalog = await getCatalog();
  const variants = expandQueryVariants(headword);
  const seen = new Set<string>();
  const entries: DictionaryEntry[] = [];
  for (const variant of variants) {
    for (const entry of catalog.byHeadword.get(variant) || []) {
      if (seen.has(entry.id)) continue;
      seen.add(entry.id);
      entries.push(entry);
    }
  }
  if (entries.length === 0) return null;
  const canonical =
    entries[0]?.headword.normalized ||
    entries[0]?.headword.display ||
    headword;
  return { canonicalHeadword: canonical, entries };
}

/**
 * Related headwords: compound family, shared characters, and full-reading
 * homophones. One row per headword; up to `limit` per group.
 */
export async function relatedWords(
  headword: string,
  limit = DEFAULT_RELATED_LIMIT,
): Promise<RelatedGroups> {
  const empty: RelatedGroups = {
    compounds: [],
    shared_characters: [],
    homophones: [],
  };
  const catalog = await getCatalog();
  const seedKey = resolveSeedKey(catalog, headword);
  if (!seedKey) return empty;

  const seed = catalog.headwordSummaries.get(seedKey);
  if (!seed) return empty;

  const seedBare = seed.bare || bareHeadword(seed.display);
  const exclude = new Set<string>([seedKey]);
  const perGroup = Math.max(1, Math.min(limit, 24));

  const candidateKeys = new Set<string>();
  for (const ch of seedBare) {
    if (!/\p{Script=Han}/u.test(ch)) continue;
    for (const key of catalog.byCharacter.get(ch) || []) {
      if (!exclude.has(key)) candidateKeys.add(key);
    }
  }

  const compounds: RelatedItem[] = [];
  const compoundKeys = new Set<string>();
  const compoundSummaries: HeadwordSummary[] = [];

  for (const key of candidateKeys) {
    const summary = catalog.headwordSummaries.get(key);
    if (!summary) continue;
    const otherBare = summary.bare || bareHeadword(summary.display);
    if (!otherBare || otherBare === seedBare) continue;
    if (otherBare.includes(seedBare) || seedBare.includes(otherBare)) {
      compoundSummaries.push(summary);
    }
  }

  compoundSummaries.sort((a, b) => {
    const aBare = a.bare.length;
    const bBare = b.bare.length;
    // Longer compounds that contain the seed first, then shorter roots.
    const aContains = a.bare.includes(seedBare) ? 0 : 1;
    const bContains = b.bare.includes(seedBare) ? 0 : 1;
    if (aContains !== bContains) return aContains - bContains;
    if (aContains === 0) return bBare - aBare;
    return aBare - bBare;
  });

  for (const summary of compoundSummaries) {
    if (compounds.length >= perGroup) break;
    if (compoundKeys.has(summary.key)) continue;
    compoundKeys.add(summary.key);
    compounds.push(toRelatedItem(summary));
  }

  const shared: RelatedItem[] = [];
  const sharedKeys = new Set<string>(compoundKeys);
  const perCharCount = new Map<string, number>();
  const sharedPool: Array<{ summary: HeadwordSummary; char: string }> = [];

  for (const ch of [...new Set([...seedBare].filter((c) => /\p{Script=Han}/u.test(c)))]) {
    for (const key of catalog.byCharacter.get(ch) || []) {
      if (exclude.has(key) || sharedKeys.has(key) || compoundKeys.has(key)) {
        continue;
      }
      const summary = catalog.headwordSummaries.get(key);
      if (!summary) continue;
      sharedPool.push({ summary, char: ch });
    }
  }

  sharedPool.sort((a, b) => {
    const aLen = a.summary.bare.length || a.summary.display.length;
    const bLen = b.summary.bare.length || b.summary.display.length;
    if (aLen !== bLen) return aLen - bLen;
    return a.summary.display.localeCompare(b.summary.display, "zh-Hant");
  });

  for (const { summary, char } of sharedPool) {
    if (shared.length >= perGroup) break;
    if (sharedKeys.has(summary.key)) continue;
    const used = perCharCount.get(char) || 0;
    if (used >= PER_CHARACTER_CAP) continue;
    sharedKeys.add(summary.key);
    perCharCount.set(char, used + 1);
    shared.push(toRelatedItem(summary));
  }

  const homophones: RelatedItem[] = [];
  const homoKeys = new Set<string>([seedKey, ...compoundKeys, ...sharedKeys]);
  const readings = new Set<string>();
  for (const entry of catalog.byHeadword.get(seedKey) || []) {
    for (const reading of entry.phonetic?.ngven || []) {
      const phrase = normalizeNgvenPhrase(String(reading || ""));
      if (phrase) readings.add(phrase);
    }
  }
  if (seed.ngven) {
    const phrase = normalizeNgvenPhrase(seed.ngven);
    if (phrase) readings.add(phrase);
  }

  for (const phrase of readings) {
    for (const key of catalog.byNgven.get(phrase) || []) {
      if (homoKeys.has(key) || exclude.has(key)) continue;
      const summary = catalog.headwordSummaries.get(key);
      if (!summary) continue;
      homoKeys.add(key);
      homophones.push(toRelatedItem(summary));
      if (homophones.length >= perGroup) break;
    }
    if (homophones.length >= perGroup) break;
  }

  return {
    compounds,
    shared_characters: shared,
    homophones,
  };
}

export async function browseHeadwords(options: {
  page: number;
  size: number;
  dict: string;
  sort: "headword" | "ngven";
}) {
  const catalog = await getCatalog();
  const page = Math.max(1, options.page);
  const size = Math.min(Math.max(1, options.size), 200);
  let entries = catalog.entries;
  if (options.dict && options.dict !== "all") {
    const bookName = catalog.sourceBookByDictId.get(options.dict);
    entries = entries.filter(
      (entry) =>
        entry.source_book === options.dict ||
        (bookName ? entry.source_book === bookName : false),
    );
  }

  const unique = new Map<
    string,
    { headword: string; ngven: string; id: string }
  >();
  for (const entry of entries) {
    const headword = entry.headword.normalized || entry.headword.display;
    const key = headword.toLowerCase();
    if (unique.has(key)) continue;
    unique.set(key, {
      headword,
      ngven: entry.phonetic?.ngven?.[0] || "",
      id: entry.id,
    });
  }

  const rows = [...unique.values()].sort((a, b) => {
    if (options.sort === "ngven") {
      return a.ngven.localeCompare(b.ngven) || a.headword.localeCompare(b.headword);
    }
    return a.headword.localeCompare(b.headword, "zh-Hant");
  });

  const total = rows.length;
  const pages = Math.max(1, Math.ceil(total / size));
  const current = Math.min(page, pages);
  const start = (current - 1) * size;
  return {
    page: current,
    size,
    total,
    pages,
    dict: options.dict,
    sort: options.sort,
    headwords: rows.slice(start, start + size).map((row) => row.headword),
    items: rows.slice(start, start + size),
  };
}

export async function randomEntries(count: number) {
  const catalog = await getCatalog();
  const pool = catalog.entries.filter((entry) => {
    const definition = entry.senses?.[0]?.definition || "";
    return definition.length >= 3 && !/NO DATA/i.test(definition);
  });
  const source = pool;
  const picks: typeof source = [];
  const used = new Set<number>();
  while (picks.length < Math.min(count, source.length)) {
    const index = Math.floor(Math.random() * source.length);
    if (used.has(index)) continue;
    used.add(index);
    picks.push(source[index]!);
  }
  return picks;
}

export async function suggestHeadwords(query: string, limit = 10) {
  const catalog = await getCatalog();
  const seed = query.trim().toLowerCase();
  if (seed.length < 2) return [];
  const variants = expandQueryVariants(seed);
  const suggestions: string[] = [];
  const seen = new Set<string>();
  for (const [key, entries] of catalog.byHeadword) {
    if (!variants.some((variant) => key.startsWith(variant) || key.includes(variant))) {
      continue;
    }
    const headword =
      entries[0]?.headword.normalized || entries[0]?.headword.display || key;
    if (seen.has(headword)) continue;
    seen.add(headword);
    suggestions.push(headword);
    if (suggestions.length >= limit) break;
  }
  return suggestions;
}
