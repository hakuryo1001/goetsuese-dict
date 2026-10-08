#!/usr/bin/env node
/**
 * Adapter: DINISHING/vocabulary-dialects → per-dialect DictionaryEntry JSON files
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { makeEntry } from "./lib/makeEntry.mjs";
import { wugniuListToNgven } from "./romanization/wugniu.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const vendor = join(root, "vendor/dinishing-vocabulary-dialects");
const outDir = join(root, "apps/web/data-dictionaries");

function parseTsv(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.length);
  if (!lines.length) return [];
  const header = lines[0].split("\t");
  // single-column files (mingtsing)
  if (header.length === 1 && !lines[0].includes("\t")) {
    return lines.map((l) => ({ _head: l.trim() }));
  }
  return lines.slice(1).map((line) => {
    const cols = line.split("\t");
    const row = {};
    header.forEach((h, i) => {
      row[h] = cols[i] ?? "";
    });
    return row;
  });
}

const SPECS = [
  {
    file: "sucieu.tsv",
    dictId: "dinishing-sucieu",
    sourceBook: "吳語方言詞彙庫 · 蘇州（DINISHING）",
    dialectName: "蘇州",
    regionCode: "SZ",
    map(row) {
      return {
        display: row["词条"],
        reading: row["拼音"],
        definition: row["释义"] || row["分类"] || "（無釋義）",
        examples: row["例句"]
          ? [{ text: row["例句"] }]
          : undefined,
        category: row["分类"],
      };
    },
  },
  {
    file: "vusik.tsv",
    dictId: "dinishing-vusik",
    sourceBook: "吳語方言詞彙庫 · 無錫（DINISHING）",
    dialectName: "無錫",
    regionCode: "WX",
    map(row) {
      return {
        display: row["参考汉字"],
        reading: row["参考读音"],
        definition: row["简要解释"] || "（無釋義）",
      };
    },
  },
  {
    file: "ningpou-thong.tsv",
    dictId: "dinishing-ningpou-thong",
    sourceBook: "吳語方言詞彙庫 · 寧波湯版詞頭（DINISHING）",
    dialectName: "寧波",
    regionCode: "NB",
    map(row) {
      return {
        display: row["繁體(OpenCC)"] || row["原書詞頭"],
        reading: row["吴拼"],
        definition: "（詞頭／讀音；見《寧波方言詞典》）",
        metaExtra: {
          derived_from: ["ningbo-fangyan-cidian-tang"],
          simplified: row["简体"],
          original_headword: row["原書詞頭"],
        },
      };
    },
  },
  {
    file: "shanghai-pott.tsv",
    dictId: "dinishing-shanghai-pott",
    sourceBook: "吳語方言詞彙庫 · Shanghai (Pott)（DINISHING）",
    dialectName: "上海",
    regionCode: "SH",
    map(row) {
      const keys = Object.keys(row);
      // English \t Hoezy \t English
      const eng = row["English"] || row[keys[0]] || "";
      const han = row["Hoezy"] || row[keys[1]] || "";
      const gloss = row[keys[2]] || eng;
      return {
        display: han,
        reading: "",
        definition: gloss || eng || "（無釋義）",
        metaExtra: { english_head: eng, derived_from: ["historical-pott"] },
      };
    },
  },
];

mkdirSync(outDir, { recursive: true });
const manifests = [];

for (const spec of SPECS) {
  const rows = parseTsv(readFileSync(join(vendor, spec.file), "utf8"));
  const entries = [];
  let i = 0;
  for (const row of rows) {
    const m = spec.map(row);
    const display = (m.display || "").trim();
    if (!display) continue;
    i += 1;
    entries.push(
      makeEntry({
        dictId: spec.dictId,
        index: i,
        sourceBook: spec.sourceBook,
        dialectName: spec.dialectName,
        regionCode: spec.regionCode,
        headwordDisplay: display,
        originalReading: m.reading || "",
        ngven: wugniuListToNgven(m.reading || ""),
        definition: m.definition,
        examples: m.examples,
        meta: {
          romanization_scheme: "wugniu",
          license: "unknown",
          attribution: "DINISHING/vocabulary-dialects",
          category: m.category,
          ...(m.metaExtra || {}),
        },
      }),
    );
  }
  const outFile = join(outDir, `${spec.dictId}.json`);
  writeFileSync(outFile, JSON.stringify(entries));
  console.log(`Wrote ${entries.length} → ${outFile}`);
  manifests.push({ id: spec.dictId, file: `${spec.dictId}.json`, count: entries.length, region: spec.regionCode });
}

writeFileSync(
  join(outDir, "dinishing-dialects-manifest.json"),
  JSON.stringify(manifests, null, 2) + "\n",
);
