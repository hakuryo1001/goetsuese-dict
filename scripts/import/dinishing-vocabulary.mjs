#!/usr/bin/env node
/**
 * Adapter: DINISHING/vocabulary words.tsv + chars-main.tsv → DictionaryEntry[]
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { makeEntry } from "./lib/makeEntry.mjs";
import { wugniuListToNgven } from "./romanization/wugniu.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const vendor = join(root, "vendor/dinishing-vocabulary");
const outDir = join(root, "apps/web/data-dictionaries");
const DICT_ID = "dinishing-vocabulary";

function parseTsv(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.length);
  const header = lines[0].split("\t");
  return lines.slice(1).map((line) => {
    const cols = line.split("\t");
    const row = {};
    header.forEach((h, i) => {
      row[h] = cols[i] ?? "";
    });
    return row;
  });
}

const entries = [];
let i = 0;

function addRow({ display, reading, definition, english, mandarin, kind }) {
  if (!display || display.startsWith("#")) return;
  i += 1;
  const senses = [];
  if (definition) {
    for (const part of definition.split("；")) {
      const d = part.trim();
      if (d) senses.push({ definition: d });
    }
  }
  if (english) senses.push({ definition: english, label: "en" });
  if (mandarin) senses.push({ definition: mandarin, label: "華語" });
  if (!senses.length) senses.push({ definition: "（無釋義）" });

  entries.push(
    makeEntry({
      dictId: DICT_ID,
      index: i,
      sourceBook: "標準吳語詞庫（DINISHING/vocabulary）",
      dialectName: "吳語",
      regionCode: "WUU",
      headwordDisplay: display,
      originalReading: reading,
      ngven: wugniuListToNgven(reading),
      senses,
      entryType: kind,
      meta: {
        romanization_scheme: "wugniu",
        license: "unknown",
        attribution: "DINISHING/vocabulary",
      },
    }),
  );
}

const words = parseTsv(readFileSync(join(vendor, "words.tsv"), "utf8"));
for (const row of words) {
  addRow({
    display: row["字"],
    reading: row["吳拼"],
    definition: row["釋義"],
    english: row["英語"],
    mandarin: row["華語"],
    kind: "word",
  });
}

const chars = parseTsv(readFileSync(join(vendor, "chars-main.tsv"), "utf8"));
for (const row of chars) {
  const display = (row["字"] || "").trim();
  if (!display || display.startsWith("#")) continue;
  // Prefer rows that have a definition; still import all characters with readings
  addRow({
    display,
    reading: row["吳拼"],
    definition: row["釋義"],
    english: row["英語"],
    mandarin: row["華語"],
    kind: "character",
  });
}

mkdirSync(outDir, { recursive: true });
const outFile = join(outDir, `${DICT_ID}.json`);
writeFileSync(outFile, JSON.stringify(entries));
console.log(`Wrote ${entries.length} entries → ${outFile}`);
