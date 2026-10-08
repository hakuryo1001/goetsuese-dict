/**
 * Approximate Wugniu (吳語學堂拼音) → ngven (通用吳語拼音 / 吳協式 with -q).
 *
 * Known systematic differences (see docs/ngven.md):
 * - gn → ny (palatal nasal)
 * - toned digits 1–8 stripped (ngven lexicon is toneless; optional marks elsewhere)
 * - yin sonorants mh/nh/lh/nyh/nk are often collapsed in Wugniu; leave as-is when present
 * - entering -q is already shared
 */
export function wugniuToNgven(input) {
  if (!input) return "";
  return String(input)
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map(convertSyllable)
    .filter(Boolean)
    .join(" ");
}

function convertSyllable(syl) {
  let s = syl.replace(/[0-9]+/g, "");
  // gn → ny at onset (年 gnie → nyie); keep g+n across syllable boundary rare
  s = s.replace(/^gn/, "ny");
  s = s.replace(/^kn/, "nyh"); // rare yin palatal
  return s;
}

export function wugniuListToNgven(reading) {
  const text = String(reading || "").trim();
  if (!text) return [];
  const converted = wugniuToNgven(text);
  return converted ? [converted] : [];
}
