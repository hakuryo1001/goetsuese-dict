import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { removeTone } from "@wulam/goetsusioji";
import type { DictionaryEntry } from "./dictionary-types";
import type { DictionaryIndex, DictionaryMeta } from "./catalog-types";
import { traditionalizeEntry } from "./traditionalize";

export type { DictionaryIndex, DictionaryMeta, LocalizedString } from "./catalog-types";
export { localizeField } from "./localize";

/** Unique headword summary for related-entry lookup. */
export interface HeadwordSummary {
  key: string;
  display: string;
  bare: string;
  ngven: string;
}

export interface Catalog {
  dictionaries: DictionaryMeta[];
  entries: DictionaryEntry[];
  byId: Map<string, DictionaryEntry>;
  byHeadword: Map<string, DictionaryEntry[]>;
  /** Normalized headword key → summary (first entry wins for display/ngven). */
  headwordSummaries: Map<string, HeadwordSummary>;
  /** Han character → normalized headword keys that contain it. */
  byCharacter: Map<string, Set<string>>;
  /** Tone-stripped full ngven phrase → normalized headword keys. */
  byNgven: Map<string, Set<string>>;
  sourceBookByDictId: Map<string, string>;
}

const HAN_CHAR = /\p{Script=Han}/u;

/** Strip parentheses, brackets, and spaces for compound containment. */
export function bareHeadword(text: string): string {
  return String(text || "")
    .replace(/[（）()【】\[\]「」『』\s·・．.]+/g, "")
    .trim();
}

/** Tone-stripped space-joined ngven phrase. */
export function normalizeNgvenPhrase(reading: string): string {
  return String(reading || "")
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((syl) => removeTone(syl))
    .filter(Boolean)
    .join(" ");
}

function addToIndex(map: Map<string, Set<string>>, key: string, headwordKey: string) {
  if (!key || !headwordKey) return;
  const bucket = map.get(key) || new Set<string>();
  bucket.add(headwordKey);
  map.set(key, bucket);
}

let catalogPromise: Promise<Catalog> | null = null;

function dictionariesRoot(): string {
  return (
    process.env.WULAM_DATA_DIR ||
    path.resolve(process.cwd(), "data-dictionaries")
  );
}

async function readJson<T>(filePath: string): Promise<T> {
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw) as T;
}

function pushEntry(catalog: Catalog, entry: DictionaryEntry) {
  if (!entry?.id || catalog.byId.has(entry.id)) return;

  // Keep original headword keys so simplified queries still resolve.
  const originalKeys = [
    entry.headword?.normalized,
    entry.headword?.display,
    entry.headword?.search,
  ]
    .map((value) => String(value || "").trim().toLowerCase())
    .filter(Boolean);

  const traditional = traditionalizeEntry(entry);
  catalog.entries.push(traditional);
  catalog.byId.set(traditional.id, traditional);

  const keys = [
    ...originalKeys,
    traditional.headword?.normalized,
    traditional.headword?.display,
    traditional.headword?.search,
  ]
    .map((value) => String(value || "").trim().toLowerCase())
    .filter(Boolean);

  for (const key of new Set(keys)) {
    const bucket = catalog.byHeadword.get(key) || [];
    bucket.push(traditional);
    catalog.byHeadword.set(key, bucket);
  }

  const display =
    traditional.headword?.normalized ||
    traditional.headword?.display ||
    "";
  const headwordKey = display.trim().toLowerCase();
  if (!headwordKey) return;

  const ngvenList = traditional.phonetic?.ngven || [];
  const firstNgven = ngvenList.map((v) => String(v || "").trim()).find(Boolean) || "";

  if (!catalog.headwordSummaries.has(headwordKey)) {
    catalog.headwordSummaries.set(headwordKey, {
      key: headwordKey,
      display,
      bare: bareHeadword(display),
      ngven: firstNgven,
    });
  }

  const bare = bareHeadword(display);
  for (const ch of bare) {
    if (HAN_CHAR.test(ch)) {
      addToIndex(catalog.byCharacter, ch, headwordKey);
    }
  }

  for (const reading of ngvenList) {
    const phrase = normalizeNgvenPhrase(String(reading || ""));
    if (phrase) addToIndex(catalog.byNgven, phrase, headwordKey);
  }
}

async function loadChunkedEntries(
  catalog: Catalog,
  chunkDir: string,
): Promise<void> {
  const dir = path.join(dictionariesRoot(), chunkDir);
  const manifestPath = path.join(dir, "manifest.json");
  try {
    const manifest = await readJson<{
      chunks?: Record<string, { file?: string }>;
    }>(manifestPath);
    const files = Object.values(manifest.chunks || {}).map(
      (chunk) => chunk.file || "",
    );
    const names =
      files.filter(Boolean).length > 0
        ? files
        : (await readdir(dir)).filter(
            (name) => name.endsWith(".json") && name !== "manifest.json",
          );
    for (const name of names) {
      const payload = await readJson<unknown>(path.join(dir, name));
      if (Array.isArray(payload)) {
        for (const entry of payload as DictionaryEntry[]) {
          pushEntry(catalog, entry);
        }
      }
    }
  } catch (error) {
    console.error(`Failed to load chunked dictionary ${chunkDir}:`, error);
  }
}

async function loadCatalog(): Promise<Catalog> {
  const root = dictionariesRoot();
  const index = await readJson<DictionaryIndex>(path.join(root, "index.json"));
  const catalog: Catalog = {
    dictionaries: index.dictionaries || [],
    entries: [],
    byId: new Map(),
    byHeadword: new Map(),
    headwordSummaries: new Map(),
    byCharacter: new Map(),
    byNgven: new Map(),
    sourceBookByDictId: new Map(),
  };

  for (const dict of catalog.dictionaries) {
    const before = catalog.entries.length;
    if (dict.chunked && dict.chunk_dir) {
      await loadChunkedEntries(catalog, dict.chunk_dir);
    } else if (dict.file) {
      const payload = await readJson<unknown>(path.join(root, dict.file));
      if (Array.isArray(payload)) {
        for (const entry of payload as DictionaryEntry[]) {
          pushEntry(catalog, entry);
        }
      }
    }
    const sample = catalog.entries[before];
    if (sample?.source_book) {
      catalog.sourceBookByDictId.set(dict.id, sample.source_book);
    }
  }

  console.info(
    `[wulam] loaded ${catalog.entries.length} entries from ${catalog.dictionaries.length} dictionaries`,
  );
  return catalog;
}

export function getCatalog(): Promise<Catalog> {
  if (!catalogPromise) {
    catalogPromise = loadCatalog();
  }
  return catalogPromise;
}
