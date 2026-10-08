import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import type { DictionaryEntry } from "./dictionary-types";
import type { DictionaryIndex, DictionaryMeta } from "./catalog-types";
import { traditionalizeEntry } from "./traditionalize";

export type { DictionaryIndex, DictionaryMeta, LocalizedString } from "./catalog-types";
export { localizeField } from "./localize";

export interface Catalog {
  dictionaries: DictionaryMeta[];
  entries: DictionaryEntry[];
  byId: Map<string, DictionaryEntry>;
  byHeadword: Map<string, DictionaryEntry[]>;
  sourceBookByDictId: Map<string, string>;
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
