import type {
  DictionaryEntry,
  Example,
  LiteraryReference,
  Reference,
  Sense,
  SubSense,
} from "./dictionary-types";
import { toTraditional } from "./converter";

function trad(value: string | undefined | null): string {
  if (!value) return value ?? "";
  return toTraditional(value);
}

function tradMaybe(value: string | undefined | null): string | undefined {
  if (value == null || value === "") return value ?? undefined;
  return toTraditional(value);
}

function traditionalizeExample(example: Example): Example {
  return {
    ...example,
    text: trad(example.text),
    translation: tradMaybe(example.translation),
  };
}

function traditionalizeSubSense(sub: SubSense): SubSense {
  return {
    ...sub,
    label: trad(sub.label),
    definition: trad(sub.definition),
    examples: sub.examples?.map(traditionalizeExample),
  };
}

function traditionalizeSense(sense: Sense): Sense {
  return {
    ...sense,
    definition: trad(sense.definition),
    label: tradMaybe(sense.label),
    examples: sense.examples?.map(traditionalizeExample),
    sub_senses: sense.sub_senses?.map(traditionalizeSubSense),
  };
}

function traditionalizeRef(ref: Reference): Reference {
  return {
    ...ref,
    target: trad(ref.target),
  };
}

function traditionalizeLiteraryRef(ref: LiteraryReference): LiteraryReference {
  return {
    ...ref,
    author: tradMaybe(ref.author ?? undefined) ?? null,
    work: tradMaybe(ref.work ?? undefined) ?? null,
    quote: tradMaybe(ref.quote ?? undefined) ?? null,
    source: tradMaybe(ref.source ?? undefined) ?? null,
  };
}

/**
 * Convert user-facing Chinese fields on a dictionary entry to Traditional (HK OpenCC).
 * Search keys keep both original and traditional forms via catalog indexing.
 */
export function traditionalizeEntry(entry: DictionaryEntry): DictionaryEntry {
  const meta = entry.meta ? { ...entry.meta } : entry.meta;
  if (meta) {
    if (typeof meta.category === "string") meta.category = trad(meta.category);
    if (typeof meta.usage === "string") meta.usage = trad(meta.usage);
    if (typeof meta.etymology === "string") meta.etymology = trad(meta.etymology);
    if (typeof meta.notes === "string") meta.notes = trad(meta.notes);
    if (typeof meta.region === "string") meta.region = trad(meta.region);
    if (typeof meta.register === "string") {
      meta.register = trad(meta.register) as typeof meta.register;
    }
    if (Array.isArray(meta.subcategories)) {
      meta.subcategories = meta.subcategories.map((item) =>
        typeof item === "string" ? trad(item) : item,
      );
    }
    if (Array.isArray(meta.references)) {
      meta.references = meta.references.map(traditionalizeLiteraryRef);
    }
  }

  return {
    ...entry,
    source_book: trad(entry.source_book),
    dialect: {
      ...entry.dialect,
      name: trad(entry.dialect?.name || ""),
    },
    headword: {
      ...entry.headword,
      display: trad(entry.headword.display),
      search: trad(entry.headword.search),
      normalized: trad(entry.headword.normalized),
    },
    senses: (entry.senses || []).map(traditionalizeSense),
    refs: entry.refs?.map(traditionalizeRef),
    keywords: (() => {
      const out = new Set<string>();
      for (const kw of entry.keywords || []) {
        if (typeof kw !== "string" || !kw) continue;
        out.add(kw);
        out.add(trad(kw));
      }
      return [...out];
    })(),
    meta: meta || entry.meta,
  };
}
