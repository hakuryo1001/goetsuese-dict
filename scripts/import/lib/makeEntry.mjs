/**
 * Shared helpers for building DictionaryEntry objects.
 */
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(
  join(dirname(fileURLToPath(import.meta.url)), "../../../apps/web/package.json"),
);

let toSimplified;
let toTraditional;
try {
  const OpenCC = require("opencc-js");
  const s2t = OpenCC.Converter({ from: "cn", to: "hk" });
  const t2s = OpenCC.Converter({ from: "hk", to: "cn" });
  toTraditional = (t) => (t ? s2t(t) : t);
  toSimplified = (t) => (t ? t2s(t) : t);
} catch {
  toTraditional = (t) => t;
  toSimplified = (t) => t;
}

export { toSimplified, toTraditional };

export function entryTypeFromHeadword(headword) {
  const chars = [...String(headword || "").replace(/\s+/g, "")];
  if (chars.length <= 1) return "character";
  if (chars.length <= 3) return "word";
  return "phrase";
}

export function stripToneMarks(romanization) {
  return String(romanization || "")
    .trim()
    .toLowerCase()
    .replace(/[0-9¹²³⁴⁵⁶⁷⁸⁹⁰]+/g, "")
    .replace(/[-'\\<·x]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildKeywords(headword, romanization) {
  const display = String(headword || "").trim();
  const keys = new Set();
  if (display) {
    keys.add(display);
    keys.add(toSimplified(display));
    keys.add(toTraditional(display));
  }
  const toneless = stripToneMarks(romanization);
  if (toneless) keys.add(toneless);
  if (romanization) keys.add(String(romanization).trim().toLowerCase());
  return [...keys].filter(Boolean);
}

export function isPlaceholder(headword) {
  return /[□◼◻]/.test(String(headword || ""));
}

/**
 * @param {object} opts
 */
export function makeEntry({
  dictId,
  index,
  sourceBook,
  dialectName,
  regionCode,
  headwordDisplay,
  headwordNormalized,
  headwordSearch,
  originalReading,
  ngven = [],
  definition,
  senses,
  examples,
  entryType,
  meta = {},
  refs,
  sourceId,
}) {
  const display = String(headwordDisplay || "").trim();
  const normalized = String(headwordNormalized || display).trim();
  const search = String(headwordSearch || normalized || display).trim();
  const reading =
    typeof originalReading === "string"
      ? originalReading.trim()
      : Array.isArray(originalReading)
        ? originalReading
        : "";

  const senseList =
    senses ||
    (definition
      ? [
          {
            definition: String(definition).trim(),
            ...(examples?.length ? { examples } : {}),
          },
        ]
      : []);

  const ngvenList = Array.isArray(ngven)
    ? ngven.filter(Boolean)
    : ngven
      ? [ngven]
      : [];

  const romanForKeywords =
    ngvenList[0] ||
    (typeof reading === "string" ? reading : reading[0] || "");

  return {
    id: `${dictId}-${String(index).padStart(6, "0")}`,
    source_book: sourceBook,
    ...(sourceId != null ? { source_id: String(sourceId) } : {}),
    dialect: {
      name: dialectName,
      ...(regionCode ? { region_code: regionCode } : {}),
    },
    headword: {
      display,
      search,
      normalized,
      is_placeholder: isPlaceholder(display),
    },
    phonetic: {
      original: reading || "",
      ngven: ngvenList,
    },
    entry_type: entryType || entryTypeFromHeadword(display),
    senses: senseList,
    ...(refs?.length ? { refs } : {}),
    keywords: buildKeywords(display, romanForKeywords),
    meta: { ...meta },
  };
}

export function writeEntriesJson(filePath, entries, { chunkSize = 0 } = {}) {
  // caller handles fs; this is just a helper export point
  return { filePath, count: entries.length, chunkSize };
}
