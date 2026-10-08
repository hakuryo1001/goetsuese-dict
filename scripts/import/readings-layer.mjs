#!/usr/bin/env node
/**
 * Build pronunciation layer from CjangCjengh/chinese-dialect-lexicons.
 * Output: apps/web/data-dictionaries/readings/<dialect>.json
 * Each reading keeps dialect, scheme (ipa), and exact source form.
 * Never merge across dialects.
 */
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  readdirSync,
  existsSync,
} from "node:fs";
import { dirname, join, basename } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const vendor = join(
  root,
  "vendor/cjangcjengh-chinese-dialect-lexicons/lexicons",
);
const outDir = join(root, "apps/web/data-dictionaries/readings");

/** Map lexicon filename stem → region code + display name */
const DIALECT_MAP = {
  zaonhe: { code: "SH", name: "上海" },
  ningbo: { code: "NB", name: "寧波" },
  suzhou: { code: "SZ", name: "蘇州" },
  hangzhou: { code: "HZ", name: "杭州" },
  wuxi: { code: "WX", name: "無錫" },
  yixing: { code: "YX", name: "宜興" },
  xiashi: { code: "XS", name: "硤石" },
  wenzhou: { code: "WZ", name: "溫州" },
  changzhou: { code: "CZ", name: "常州" },
  shaoxing: { code: "SX", name: "紹興" },
  sanmen: { code: "SM", name: "三門" },
  tiantai: { code: "TT", name: "天台" },
  suichang: { code: "SC", name: "遂昌" },
  cixi: { code: "NB", name: "慈溪", note: "Ningbo subgroup" },
  fuyang: { code: "HZ", name: "富陽", note: "Hangzhou subgroup" },
  jiading: { code: "SH", name: "嘉定", note: "Shanghai subgroup" },
  jiashan: { code: "JX", name: "嘉善", note: "Jiaxing subgroup" },
  jingjiang: { code: "CZ", name: "靖江", note: "adjacent / borderline" },
  linping: { code: "HZ", name: "臨平", note: "Hangzhou subgroup" },
  pinghu: { code: "JX", name: "平湖", note: "Jiaxing subgroup" },
  ruao: { code: "NB", name: "儒嶴", note: "Ningbo coastal" },
  tongxiang: { code: "JX", name: "桐鄉", note: "Jiaxing subgroup" },
  xiaoshan: { code: "HZ", name: "蕭山", note: "Hangzhou subgroup" },
  youbu: { code: "JH", name: "游埠", note: "Wuzhou / Jinhua area" },
  zhenru: { code: "SH", name: "真如", note: "Shanghai subgroup" },
  // skip non-Wu / Cantonese
  jyutjyu: null,
};

mkdirSync(outDir, { recursive: true });

if (!existsSync(vendor)) {
  console.error(`Missing vendor lexicons at ${vendor}. Run pnpm fetch-sources first.`);
  process.exit(1);
}

const summary = [];

for (const file of readdirSync(vendor).filter((f) => f.endsWith(".txt"))) {
  const stem = basename(file, ".txt");
  const meta = DIALECT_MAP[stem];
  if (meta === null) {
    console.log(`skip non-Wu: ${file}`);
    continue;
  }
  if (!meta) {
    console.log(`skip unmapped: ${file}`);
    continue;
  }

  const text = readFileSync(join(vendor, file), "utf8");
  /** @type {Map<string, Array<{ipa: string, scheme: string}>>} */
  const byHeadword = new Map();
  let lineCount = 0;

  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const tab = line.indexOf("\t");
    if (tab < 0) continue;
    const headword = line.slice(0, tab).trim();
    const ipa = line.slice(tab + 1).trim();
    if (!headword || !ipa) continue;
    lineCount += 1;
    const bucket = byHeadword.get(headword) || [];
    if (!bucket.some((r) => r.ipa === ipa)) {
      bucket.push({ ipa, scheme: "ipa", source: "cjangcjengh-chinese-dialect-lexicons" });
    }
    byHeadword.set(headword, bucket);
  }

  const payload = {
    dialect: meta.name,
    region_code: meta.code,
    lexicon_file: file,
    scheme_default: "ipa",
    unique_headwords: byHeadword.size,
    record_count: lineCount,
    note: meta.note,
    // object map for O(1) lookup on word page
    readings: Object.fromEntries(byHeadword),
  };

  const outFile = join(outDir, `${meta.code}-${stem}.json`);
  writeFileSync(outFile, JSON.stringify(payload));
  console.log(
    `${stem}: ${lineCount} records → ${byHeadword.size} unique headwords → ${outFile}`,
  );
  summary.push({
    file: `${meta.code}-${stem}.json`,
    code: meta.code,
    name: meta.name,
    unique_headwords: byHeadword.size,
    record_count: lineCount,
  });
}

writeFileSync(
  join(outDir, "manifest.json"),
  JSON.stringify(
    {
      generated_at: new Date().toISOString(),
      source: "cjangcjengh-chinese-dialect-lexicons",
      lexicons: summary,
    },
    null,
    2,
  ) + "\n",
);
console.log(`Wrote readings manifest (${summary.length} lexicons)`);
