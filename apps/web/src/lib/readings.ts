/**
 * Pronunciation layer loader (CjangCjengh + future Rime fills).
 * Readings stay keyed by headword + dialect + scheme — never merged across dialects.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";

export interface ReadingItem {
  ipa?: string;
  scheme: string;
  source?: string;
  form?: string;
}

export interface DialectReadingsFile {
  dialect: string;
  region_code: string;
  lexicon_file?: string;
  scheme_default?: string;
  unique_headwords?: number;
  readings: Record<string, ReadingItem[]>;
}

export interface HeadwordReadingGroup {
  dialect: string;
  region_code: string;
  scheme: string;
  forms: string[];
  source?: string;
}

let readingsPromise: Promise<DialectReadingsFile[]> | null = null;

function readingsRoot(): string {
  return (
    process.env.WULAM_DATA_DIR ||
    path.resolve(process.cwd(), "data-dictionaries")
  );
}

async function loadAll(): Promise<DialectReadingsFile[]> {
  const root = path.join(readingsRoot(), "readings");
  try {
    const manifestRaw = await readFile(path.join(root, "manifest.json"), "utf8");
    const manifest = JSON.parse(manifestRaw) as {
      lexicons?: Array<{ file: string }>;
    };
    const files = (manifest.lexicons || []).map((l) => l.file);
    const out: DialectReadingsFile[] = [];
    for (const file of files) {
      try {
        const raw = await readFile(path.join(root, file), "utf8");
        out.push(JSON.parse(raw) as DialectReadingsFile);
      } catch (e) {
        console.error(`Failed to load readings ${file}:`, e);
      }
    }
    return out;
  } catch {
    return [];
  }
}

export function getReadingsCatalog(): Promise<DialectReadingsFile[]> {
  if (!readingsPromise) readingsPromise = loadAll();
  return readingsPromise;
}

export async function lookupReadingsForHeadword(
  headword: string,
): Promise<HeadwordReadingGroup[]> {
  const needle = String(headword || "").trim();
  if (!needle) return [];
  const catalogs = await getReadingsCatalog();
  const groups: HeadwordReadingGroup[] = [];

  for (const cat of catalogs) {
    const items = cat.readings?.[needle];
    if (!items?.length) continue;
    const byScheme = new Map<string, ReadingItem[]>();
    for (const item of items) {
      const scheme = item.scheme || cat.scheme_default || "ipa";
      const bucket = byScheme.get(scheme) || [];
      bucket.push(item);
      byScheme.set(scheme, bucket);
    }
    for (const [scheme, list] of byScheme) {
      groups.push({
        dialect: cat.dialect,
        region_code: cat.region_code,
        scheme,
        forms: list.map((r) => r.ipa || r.form || "").filter(Boolean),
        source: list[0]?.source,
      });
    }
  }
  return groups;
}
