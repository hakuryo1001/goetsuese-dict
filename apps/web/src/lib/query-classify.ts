const HAN_CHARACTER_REGEX = /\p{Script=Han}/u;
const TOKEN_EDGE_PUNCTUATION_REGEX = /^[.'’_-]+|[.'’_-]+$/g;

/** ngven initials from goetsusioji meta (longest first for matching). */
const NGVEN_INITIALS = [
  "null",
  "tsh",
  "nyh",
  "ph",
  "mh",
  "th",
  "lh",
  "ch",
  "sh",
  "zh",
  "nh",
  "ts",
  "dz",
  "ny",
  "kh",
  "gh",
  "nk",
  "ng",
  "p",
  "b",
  "f",
  "v",
  "m",
  "t",
  "d",
  "l",
  "c",
  "j",
  "n",
  "s",
  "z",
  "k",
  "g",
  "h",
  "i",
  "y",
  "u",
  "w",
];

const NGVEN_FINALS = new Set([
  "a",
  "o",
  "e",
  "i",
  "u",
  "au",
  "ou",
  "eu",
  "iu",
  "aq",
  "oq",
  "eq",
  "iq",
  "ae",
  "oe",
  "en",
  "ie",
  "an",
  "on",
  "eon",
  "in",
  "y",
  "aon",
  "r",
]);

/** Optional tone markers: trailing -·, -x, -', -\, -<, or digits. */
const NGVEN_TOKEN_REGEX =
  /^!?([a-z]+)(?:-·|-x|[-'\\<]|[1-8])?$/i;

export const normalizeSearchQuery = (query: string): string => {
  return String(query || "")
    .replace(/\s+/g, " ")
    .trim();
};

const normalizeRomanizedToken = (token: string): string => {
  return token.replace(TOKEN_EDGE_PUNCTUATION_REGEX, "");
};

const isValidNgvenSyllable = (base: string): boolean => {
  const normalized = base.toLowerCase();
  if (NGVEN_FINALS.has(normalized)) return true;
  if (normalized === "null") return true;

  for (const initial of NGVEN_INITIALS) {
    if (initial === "null") {
      if (NGVEN_FINALS.has(normalized)) return true;
      continue;
    }
    if (!normalized.startsWith(initial)) continue;
    const final = normalized.slice(initial.length);
    if (final === "" || NGVEN_FINALS.has(final)) return true;
  }

  return false;
};

export const hasHanCharacters = (query: string): boolean => {
  return HAN_CHARACTER_REGEX.test(normalizeSearchQuery(query));
};

/** True when the query looks like space-separated ngven romanization. */
export const isNgvenQuery = (query: string): boolean => {
  const normalized = normalizeSearchQuery(query);
  if (!normalized) return false;
  if (hasHanCharacters(normalized)) return false;

  const tokens = normalized
    .split(" ")
    .map(normalizeRomanizedToken)
    .filter(Boolean);

  if (tokens.length === 0) return false;
  if (!/^[a-zA-Z'\\\-<·x0-9\s]+$/.test(normalized)) return false;

  return tokens.every((token) => {
    const match = token.match(NGVEN_TOKEN_REGEX);
    if (!match?.[1]) return false;
    return isValidNgvenSyllable(match[1].replace(/^!/, ""));
  });
};
