import type { DictionaryEntry, EntryType } from "./dictionary-types";
import { expandQueryVariants } from "./converter";
import { isNgvenQuery, normalizeSearchQuery } from "./query-classify";
import {
  SEARCH_API_MAX_PAGE_SIZE,
  SEARCH_API_PAGE_SIZE,
  buildGroupedSearchResponse,
  type GroupedSearchResponse,
  type SearchSortOption,
} from "./search-result-groups";
import { getCatalog } from "./catalog";

function scoreEntry(
  entry: DictionaryEntry,
  queryVariants: string[],
  queryLength: number,
  reverse: boolean,
): number | null {
  let priority = 0;

  if (reverse) {
    const match = entry.senses?.some((sense) => {
      const definition = sense.definition?.toLowerCase() || "";
      return queryVariants.some((qv) => definition.includes(qv));
    });
    if (!match) return null;
    const exact = entry.senses?.some((sense) =>
      queryVariants.includes((sense.definition || "").toLowerCase().trim()),
    );
    priority = exact ? 100 : 80;
  } else {
    const headwordVariants = [
      entry.headword?.normalized,
      entry.headword?.display,
      entry.headword?.search,
    ]
      .map((value) => String(value || "").toLowerCase())
      .filter(Boolean);

    if (queryVariants.some((qv) => headwordVariants.includes(qv))) {
      priority = 100;
    } else if (
      queryVariants.some((qv) =>
        headwordVariants.some((hv) => hv.startsWith(qv)),
      )
    ) {
      priority = 90;
    } else if (
      queryVariants.some((qv) => headwordVariants.some((hv) => hv.includes(qv)))
    ) {
      priority = 80;
    } else if (entry.phonetic?.ngven?.length) {
      const ngven = entry.phonetic.ngven.map((nv) => nv.toLowerCase());
      if (queryVariants.some((qv) => ngven.includes(qv))) {
        priority = 70;
      } else if (
        queryVariants.some((qv) => ngven.some((nv) => nv.includes(qv)))
      ) {
        priority = 60;
      }
    }

    if (priority === 0 && entry.keywords?.length) {
      const keywords = entry.keywords.map((kw) => String(kw).toLowerCase());
      if (queryVariants.some((qv) => keywords.some((kw) => kw.includes(qv)))) {
        priority = 50;
      }
    }
  }

  if (priority === 0) return null;

  const lengthDiff = Math.abs(
    (entry.headword?.display?.length || 0) - queryLength,
  );
  const secondary = Math.max(0, 30 - lengthDiff * 3);
  return priority * 1000 + secondary;
}

export async function searchEntries(options: {
  q: string;
  limit?: number;
  offset?: number;
  dict?: string;
  dialect?: string;
  type?: EntryType;
  sort?: SearchSortOption;
  mode?: "normal" | "reverse";
}): Promise<GroupedSearchResponse> {
  const query = normalizeSearchQuery(options.q);
  const reverse = options.mode === "reverse";
  const limit = Math.min(
    Math.max(1, options.limit || SEARCH_API_PAGE_SIZE),
    SEARCH_API_MAX_PAGE_SIZE,
  );
  const offset = Math.max(0, options.offset || 0);
  if (!query) {
    return buildGroupedSearchResponse({
      query,
      mode: reverse ? "reverse" : "normal",
      sort: options.sort,
      filters: {
        dict: options.dict,
        dialect: options.dialect,
        type: options.type,
      },
      entries: [],
      offset,
      limit,
    });
  }

  const catalog = await getCatalog();
  const variants = expandQueryVariants(query);
  if (isNgvenQuery(query)) {
    variants.push(query.toLowerCase());
  }

  const scored: Array<{ entry: DictionaryEntry; score: number }> = [];
  for (const entry of catalog.entries) {
    if (options.dict) {
      const bookName = catalog.sourceBookByDictId.get(options.dict);
      if (
        entry.source_book !== options.dict &&
        entry.source_book !== bookName
      ) {
        continue;
      }
    }
    if (
      options.dialect &&
      (entry.dialect?.region_code || entry.dialect?.name) !== options.dialect
    ) {
      continue;
    }
    if (options.type && entry.entry_type !== options.type) continue;
    const score = scoreEntry(entry, variants, query.length, reverse);
    if (score == null) continue;
    scored.push({ entry, score });
  }

  scored.sort((a, b) => b.score - a.score || a.entry.id.localeCompare(b.entry.id));
  const entries = scored.slice(0, 1000).map((item) => item.entry);

  return buildGroupedSearchResponse({
    query,
    mode: reverse ? "reverse" : "normal",
    sort: options.sort,
    filters: {
      dict: options.dict,
      dialect: options.dialect,
      type: options.type,
    },
    entries,
    offset,
    limit,
  });
}

export async function resolveSearchLanding(query: string, reverse: boolean) {
  const normalized = normalizeSearchQuery(query);
  if (!normalized) {
    return { type: "search" as const, reason: "empty_query" as const };
  }
  if (reverse) {
    return { type: "search" as const, reason: "reverse_search" as const };
  }
  if (isNgvenQuery(normalized)) {
    return { type: "search" as const, reason: "ngven_query" as const };
  }

  const catalog = await getCatalog();
  const variants = expandQueryVariants(normalized);
  const matches = new Set<string>();
  let canonical = "";
  for (const variant of variants) {
    const bucket = catalog.byHeadword.get(variant);
    if (!bucket?.length) continue;
    for (const entry of bucket) {
      const headword = entry.headword.normalized || entry.headword.display;
      matches.add(headword);
      if (!canonical) canonical = headword;
    }
  }
  if (matches.size === 1) {
    return {
      type: "word" as const,
      reason: "exact_unique" as const,
      canonicalHeadword: canonical,
    };
  }
  if (matches.size > 1) {
    return { type: "search" as const, reason: "ambiguous_exact_match" as const };
  }
  return { type: "search" as const, reason: "no_exact_match" as const };
}
