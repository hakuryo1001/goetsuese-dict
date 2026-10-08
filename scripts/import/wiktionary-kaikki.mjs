#!/usr/bin/env node
/**
 * Adapter: Kaikki Wiktionary dumps → Wu DictionaryEntry[].
 *
 * Downloads (or reads cached) English + Chinese Kaikki extracts and keeps:
 * 1. Standalone entries with lang_code === "wuu"
 * 2. Chinese entries that contain a Wu pronunciation (tags / notes mentioning Wu / wuu / 吳)
 *
 * Usage:
 *   node scripts/import/wiktionary-kaikki.mjs
 *   WIKTEXTRACT_EN=/path/to/kaikki.org-dictionary-English.jsonl node ...
 *
 * If dumps are missing, writes an empty placeholder dictionary so the pipeline
 * still runs; set SKIP_DOWNLOAD=1 to avoid network.
 */
import {
  createWriteStream,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline";
import { createGunzip } from "node:zlib";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { makeEntry } from "./lib/makeEntry.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const cacheDir = join(root, "vendor/kaikki");
const outDir = join(root, "apps/web/data-dictionaries");
const DICT_ID = "wiktionary-wu";

const EN_URL =
  "https://kaikki.org/dictionary/raw-wiktextract-data.jsonl.gz";
// Prefer language-filtered dumps when available; fall back to instructions.
const EN_WUU_URL =
  process.env.WIKTEXTRACT_EN_URL ||
  "https://kaikki.org/dictionary/Wu/kaikki.org-dictionary-Wu.jsonl";

mkdirSync(cacheDir, { recursive: true });
mkdirSync(outDir, { recursive: true });

async function download(url, dest) {
  if (existsSync(dest)) {
    console.log(`cache hit ${dest}`);
    return dest;
  }
  if (process.env.SKIP_DOWNLOAD === "1") {
    console.warn(`SKIP_DOWNLOAD=1 and missing ${dest}`);
    return null;
  }
  console.log(`Downloading ${url} …`);
  const res = await fetch(url, {
    headers: { "User-Agent": "wulam-goetsuese-dict/0.1" },
  });
  if (!res.ok) {
    console.warn(`Download failed ${res.status} ${url}`);
    return null;
  }
  const tmp = dest + ".partial";
  const fileStream = createWriteStream(tmp);
  await pipeline(Readable.fromWeb(res.body), fileStream);
  const { renameSync } = await import("node:fs");
  renameSync(tmp, dest);
  return dest;
}

function tagsIncludeWu(tags) {
  if (!Array.isArray(tags)) return false;
  return tags.some((t) => {
    const s = String(t);
    return (
      s === "Wu" ||
      s === "wuu" ||
      s === "吳語" ||
      s === "吴语" ||
      s === "Shanghai" ||
      s === "Shanghainese" ||
      s === "Suzhou" ||
      s === "Ningbo" ||
      s === "Wenzhou" ||
      s === "Hangzhou" ||
      s === "Wugniu"
    );
  });
}

function isWuSound(sound) {
  if (!sound || typeof sound !== "object") return false;
  if (tagsIncludeWu(sound.tags)) return true;
  const blob = JSON.stringify(sound).toLowerCase();
  return (
    blob.includes('"wuu"') ||
    blob.includes("wu chinese") ||
    blob.includes("吳語") ||
    blob.includes("吴语")
  );
}

function extractWuReadings(obj) {
  const readings = [];
  for (const sound of obj.sounds || []) {
    if (!isWuSound(sound) && obj.lang_code !== "wuu") continue;
    const ipa = sound.ipa || sound["zh-pron"] || sound.zh_pron;
    const enpr = sound.enpr || sound.roman || sound["zh-Latn"] || sound.Latn;
    const value = enpr || ipa;
    if (value) {
      const tags = (sound.tags || []).filter((t) => t !== "Wu" && t !== "Wugniu");
      const label = tags.length ? `${value} (${tags.join(", ")})` : value;
      readings.push(label);
    }
  }
  return [...new Set(readings)];
}

function sensesFrom(obj) {
  const out = [];
  for (const s of obj.senses || []) {
    const glosses = s.glosses || s.raw_glosses || [];
    for (const g of glosses) {
      if (g) out.push({ definition: String(g) });
    }
  }
  if (!out.length && obj.lang_code === "wuu") {
    out.push({ definition: "（Wiktionary 吳語詞條）" });
  }
  return out;
}

async function* readJsonl(path) {
  if (!path || !existsSync(path)) return;
  let stream;
  if (path.endsWith(".gz")) {
    const { createReadStream } = await import("node:fs");
    stream = createReadStream(path).pipe(createGunzip());
  } else {
    const { createReadStream } = await import("node:fs");
    stream = createReadStream(path, { encoding: "utf8" });
  }
  const rl = createInterface({ input: stream, crlfDelay: Infinity });
  for await (const line of rl) {
    if (!line.trim()) continue;
    try {
      yield JSON.parse(line);
    } catch {
      /* skip bad line */
    }
  }
}

const entries = [];
let i = 0;
const seen = new Set();

async function ingest(path, label) {
  if (!path) return;
  console.log(`Parsing ${label}: ${path}`);
  let kept = 0;
  for await (const obj of readJsonl(path)) {
    const isWuu = obj.lang_code === "wuu" || obj.lang === "Wu";
    const readings = extractWuReadings(obj);
    const nestedWu =
      !isWuu &&
      (readings.length > 0 ||
        (obj.sounds || []).some(isWuSound) ||
        (obj.etymology_text || "").toLowerCase().includes("wu chinese"));

    if (!isWuu && !nestedWu) continue;

    const word = obj.word || obj.title;
    if (!word) continue;
    const key = `${word}||${(readings || []).join("|")}||${isWuu ? "wuu" : "nested"}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const senses = sensesFrom(obj);
    if (!senses.length && !readings.length) continue;

    i += 1;
    kept += 1;
    entries.push(
      makeEntry({
        dictId: DICT_ID,
        index: i,
        sourceBook: isWuu
          ? "Wiktionary (Wu)"
          : "Wiktionary (Chinese entry · Wu pronunciation)",
        dialectName: "吳語",
        regionCode: "WUU",
        headwordDisplay: word,
        originalReading: readings[0] || "",
        ngven: [],
        senses: senses.length ? senses : [{ definition: "（僅有吳語讀音）" }],
        meta: {
          romanization_scheme: readings[0] ? "source" : undefined,
          license: "cc-by-sa-4.0",
          attribution: "Wiktionary contributors / Kaikki",
          wiktionary_lang: obj.lang_code || obj.lang,
          pos: obj.pos,
          source_readings: readings,
          nested_wu: nestedWu || undefined,
        },
      }),
    );
  }
  console.log(`  kept ${kept} from ${label}`);
}

const localEn =
  process.env.WIKTEXTRACT_EN ||
  join(cacheDir, "kaikki.org-dictionary-Wu.jsonl");
const localZhCandidates = [
  process.env.WIKTEXTRACT_ZH,
  join(cacheDir, "zh-extract.jsonl.gz"),
  join(cacheDir, "zh-extract.jsonl"),
  join(cacheDir, "kaikki.org-dictionary-Chinese.jsonl"),
].filter(Boolean);

let enPath = existsSync(localEn) ? localEn : null;
let zhPath = localZhCandidates.find((p) => existsSync(p)) || null;

if (!enPath && process.env.FETCH_EN_WUU === "1" && process.env.SKIP_DOWNLOAD !== "1") {
  enPath = await download(EN_WUU_URL, join(cacheDir, "kaikki.org-dictionary-Wu.jsonl"));
}
if (!zhPath && process.env.FETCH_ZH_KAIKKI === "1") {
  zhPath = await download(
    "https://kaikki.org/dictionary/downloads/zh/zh-extract.jsonl.gz",
    join(cacheDir, "zh-extract.jsonl.gz"),
  );
}

await ingest(enPath, "en-wu");
await ingest(zhPath, "zh");

const outFile = join(outDir, `${DICT_ID}.json`);
writeFileSync(outFile, JSON.stringify(entries));
console.log(`Wrote ${entries.length} Wiktionary Wu entries → ${outFile}`);

if (!entries.length) {
  console.warn(
    "No Wiktionary entries imported. Place dumps under vendor/kaikki/ or set WIKTEXTRACT_EN.",
  );
}
