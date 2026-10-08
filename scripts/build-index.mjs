#!/usr/bin/env node
/**
 * Build apps/web/data-dictionaries/index.json from awesome-wu-dicts sources
 * plus generated entry JSON files / chunk dirs.
 */
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  statSync,
  writeFileSync,
  unlinkSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = join(root, "apps/web/data-dictionaries");
const cataloguePath =
  process.env.WULAM_CATALOGUE ||
  join(root, "../awesome-wu-dicts/data/sources.json");
const CHUNK_THRESHOLD = 20_000;
const CHUNK_SIZE = 5_000;

const catalogue = JSON.parse(readFileSync(cataloguePath, "utf8"));
const byId = new Map(catalogue.sources.map((s) => [s.id, s]));

/** Generated dictionary files (id → relative path or chunk_dir) */
const GENERATED = [
  { id: "ionkaon-dictionary", file: "ionkaon-dictionary.json" },
  { id: "ionkaon-data", file: "ionkaon-data.json" },
  { id: "dinishing-vocabulary", file: "dinishing-vocabulary.json" },
  { id: "dinishing-sucieu", file: "dinishing-sucieu.json", parent: "dinishing-vocabulary-dialects" },
  { id: "dinishing-vusik", file: "dinishing-vusik.json", parent: "dinishing-vocabulary-dialects" },
  { id: "dinishing-ningpou-thong", file: "dinishing-ningpou-thong.json", parent: "dinishing-vocabulary-dialects" },
  { id: "dinishing-shanghai-pott", file: "dinishing-shanghai-pott.json", parent: "dinishing-vocabulary-dialects" },
  { id: "wiktionary-wu", file: "wiktionary-wu.json", parent: "kaikki-en" },
];

function countEntries(filePath) {
  if (!existsSync(filePath)) return 0;
  const raw = readFileSync(filePath, "utf8");
  const data = JSON.parse(raw);
  return Array.isArray(data) ? data.length : 0;
}

function readChunkCount(chunkDir) {
  const manifestPath = join(dataDir, chunkDir, "manifest.json");
  if (!existsSync(manifestPath)) return 0;
  try {
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    if (typeof manifest.total === "number") return manifest.total;
    return Object.values(manifest.chunks || {}).reduce(
      (sum, chunk) => sum + (chunk.count || 0),
      0,
    );
  } catch {
    return 0;
  }
}

function maybeChunk(id, file) {
  const chunkDir = `${id}`;
  const existingCount = readChunkCount(chunkDir);
  if (existingCount > 0 && !existsSync(join(dataDir, file))) {
    return { chunk_dir: chunkDir, chunked: true, count: existingCount };
  }

  const full = join(dataDir, file);
  if (!existsSync(full)) return { file, chunked: false, count: 0 };
  const count = countEntries(full);
  if (count < CHUNK_THRESHOLD) {
    return { file, chunked: false, count };
  }
  const dir = join(dataDir, chunkDir);
  mkdirSync(dir, { recursive: true });
  const entries = JSON.parse(readFileSync(full, "utf8"));
  const chunks = {};
  for (let i = 0; i < entries.length; i += CHUNK_SIZE) {
    const n = Math.floor(i / CHUNK_SIZE);
    const name = `chunk-${String(n).padStart(4, "0")}.json`;
    writeFileSync(join(dir, name), JSON.stringify(entries.slice(i, i + CHUNK_SIZE)));
    chunks[String(n)] = { file: name, count: Math.min(CHUNK_SIZE, entries.length - i) };
  }
  writeFileSync(
    join(dir, "manifest.json"),
    JSON.stringify({ chunks, total: entries.length }, null, 2) + "\n",
  );
  unlinkSync(full);
  console.log(`Chunked ${id}: ${count} → ${Object.keys(chunks).length} files`);
  return { chunk_dir: chunkDir, chunked: true, count };
}

function dialectLabel(src) {
  const codes = src?.dialect_codes || ["WUU"];
  return codes[0];
}

function localizeName(src) {
  return {
    en: src?.title || src?.id,
    "zh-Hant": src?.title || src?.id,
    "zh-Hans": src?.title || src?.id,
  };
}

const dictionaries = [];

for (const gen of GENERATED) {
  const src = byId.get(gen.parent || gen.id) || byId.get(gen.id) || {
    id: gen.id,
    title: gen.id,
    dialect_codes: ["WUU"],
    license: "unknown",
    url: null,
    status: "importable",
  };
  const layout = maybeChunk(gen.id, gen.file);
  if (!layout.count && !existsSync(join(dataDir, gen.file)) && !layout.chunked) {
    console.warn(`skip missing ${gen.file}`);
    continue;
  }
  dictionaries.push({
    id: gen.id,
    name: localizeName({ ...src, title: src.title || gen.id }),
    dialect: dialectLabel(src),
    entries_count: layout.count,
    author: src.author || undefined,
    year: src.year || undefined,
    file: layout.chunked ? undefined : layout.file,
    chunked: layout.chunked || undefined,
    chunk_dir: layout.chunk_dir,
    description: src.notes || undefined,
    license: src.license,
    source: src.tier === 1 ? "published_book" : src.tier === 4 ? "community_contributed" : "community_contributed",
    attribution: src.repo ? `https://github.com/${src.repo}` : src.url || undefined,
    derived_from: src.derived_from?.length ? src.derived_from : undefined,
    upstream_commit: src.upstream_commit || undefined,
    catalogue_id: src.id,
  });
}

const index = {
  dictionaries,
  last_updated: new Date().toISOString().slice(0, 10),
  schema_version: "1",
  readings_manifest: existsSync(join(dataDir, "readings/manifest.json"))
    ? "readings/manifest.json"
    : undefined,
};

writeFileSync(join(dataDir, "index.json"), JSON.stringify(index, null, 2) + "\n");
console.log(
  `index.json: ${dictionaries.length} dictionaries, ${dictionaries.reduce((a, d) => a + d.entries_count, 0)} entries`,
);
