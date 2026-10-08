#!/usr/bin/env node
/**
 * Adapter: ionkaon/dictionary 詞表.tsv → DictionaryEntry[]
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { makeEntry } from "./lib/makeEntry.mjs";
import { wugniuListToNgven } from "./romanization/wugniu.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const vendor = join(root, "vendor/ionkaon-dictionary");
const outDir = join(root, "apps/web/data-dictionaries");
const DICT_ID = "ionkaon-dictionary";

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

const path = join(vendor, "詞表.tsv");
const rows = parseTsv(readFileSync(path, "utf8"));
const entries = [];
let i = 0;

for (const row of rows) {
  const display = (row["繁體"] || "").trim();
  if (!display || display.startsWith("#")) continue;
  const reading = (row["兼容格式"] || "").trim();
  const definition = (row["釋義"] || "").trim();
  const note = (row["備註"] || "").trim();
  i += 1;
  entries.push(
    makeEntry({
      dictId: DICT_ID,
      index: i,
      sourceBook: "甬江話字詞表（ionkaon/dictionary）",
      dialectName: "寧波",
      regionCode: "NB",
      headwordDisplay: display,
      originalReading: reading,
      ngven: wugniuListToNgven(reading),
      definition: definition || "（無釋義）",
      meta: {
        romanization_scheme: "wugniu",
        notes: note || undefined,
        references: [
          row["湯版頁碼"]
            ? { work: "寧波方言詞典（湯版）", source: `p.${row["湯版頁碼"]}` }
            : null,
          row["《阿拉宁波话》頁碼"]
            ? {
                work: "阿拉宁波话",
                source: `p.${row["《阿拉宁波话》頁碼"]}`,
              }
            : null,
          row["朱版頁碼"]
            ? { work: "寧波方言詞典（朱版）", source: `p.${row["朱版頁碼"]}` }
            : null,
        ].filter(Boolean),
        page_tang: row["湯版頁碼"] || undefined,
        page_ala: row["《阿拉宁波话》頁碼"] || undefined,
        page_zhu: row["朱版頁碼"] || undefined,
        frequency: row["詞頻"] || undefined,
        derived_from: [
          "ala-ningbo-print",
          "ningbo-fangyan-cidian-tang",
          "ningbo-fangyan-cidian-zhu",
        ],
      },
    }),
  );
}

mkdirSync(outDir, { recursive: true });
const outFile = join(outDir, `${DICT_ID}.json`);
writeFileSync(outFile, JSON.stringify(entries, null, 0));
console.log(`Wrote ${entries.length} entries → ${outFile}`);
