#!/usr/bin/env node
/**
 * Adapter: ionkaon/data index TSVs → DictionaryEntry[] (readings + page refs; sparse definitions)
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, join, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { makeEntry } from "./lib/makeEntry.mjs";
import { wugniuListToNgven } from "./romanization/wugniu.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const vendor = join(root, "vendor/ionkaon-data");
const outDir = join(root, "apps/web/data-dictionaries");
const DICT_ID = "ionkaon-data";

function parseTsv(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.length);
  const header = lines[0].split("\t");
  return { header, rows: lines.slice(1).map((line) => {
    const cols = line.split("\t");
    const row = {};
    header.forEach((h, i) => {
      row[h] = cols[i] ?? "";
    });
    return row;
  }) };
}

function pick(row, keys) {
  for (const k of keys) {
    if (row[k] != null && String(row[k]).trim()) return String(row[k]).trim();
  }
  return "";
}

const files = readdirSync(vendor).filter((f) => f.endsWith(".tsv"));
const entries = [];
let i = 0;

for (const file of files) {
  const { rows } = parseTsv(readFileSync(join(vendor, file), "utf8"));
  const bookLabel = basename(file, ".tsv");
  for (const row of rows) {
    const display = pick(row, [
      "繁體",
      "繁體(OpenCC)",
      "詞",
      "原書詞頭",
    ]);
    if (!display) continue;
    const reading = pick(row, ["吴拼", "吳拼", "兼容格式", "拼音", "原书转写吴拼"]);
    const page = pick(row, ["页码", "頁碼"]);
    const category = pick(row, ["分类", "類別"]);
    i += 1;
    entries.push(
      makeEntry({
        dictId: DICT_ID,
        index: i,
        sourceBook: `寧波方言資料整理 · ${bookLabel}`,
        dialectName: "寧波",
        regionCode: "NB",
        headwordDisplay: display,
        originalReading: reading,
        ngven: wugniuListToNgven(reading),
        definition: category
          ? `【${category}】（索引；見原書${page ? ` p.${page}` : ""}）`
          : `（索引；見原書${page ? ` p.${page}` : ""}）`,
        meta: {
          romanization_scheme: "wugniu",
          index_file: file,
          page: page || undefined,
          category: category || undefined,
          license: "cc-by-4.0",
          attribution: "ionkaon/data",
          derived_from: ["ala-ningbo-print", "ningbo-fangyan-cidian-tang"],
        },
      }),
    );
  }
}

mkdirSync(outDir, { recursive: true });
const outFile = join(outDir, `${DICT_ID}.json`);
writeFileSync(outFile, JSON.stringify(entries));
console.log(`Wrote ${entries.length} entries from ${files.length} TSVs → ${outFile}`);
