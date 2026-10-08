import type { DictionaryEntry } from "./dictionary-types";
import { expandQueryVariants } from "./converter";
import { getCatalog } from "./catalog";

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

export async function relatedWords(headword: string, limit = 12) {
  const catalog = await getCatalog();
  const seed = headword.trim().toLowerCase();
  if (!seed) return [];
  const matches: DictionaryEntry[] = [];
  const seen = new Set<string>();
  for (const [key, entries] of catalog.byHeadword) {
    if (key === seed || !key.startsWith(seed)) continue;
    for (const entry of entries) {
      const display = entry.headword.normalized || entry.headword.display;
      if (seen.has(display)) continue;
      seen.add(display);
      matches.push(entry);
      if (matches.length >= limit) return matches;
    }
  }
  return matches;
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
