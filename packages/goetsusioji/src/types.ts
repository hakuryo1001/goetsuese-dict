/** One Siauzy + Han pair for a romanization (from syllables.json). */
export type SyllableOutput = {
  /** Canonical Goetsusioji glyph string, or null when the font lacks a head block. */
  glyph: string | null;
  /** Progenitor-hanzi spelling (teaching layer). */
  han: string;
};

/** Tone-less ngven syllable → candidate outputs. */
export type CharactersMap = Record<string, SyllableOutput[]>;

export type GoetsusiojiCandidate = {
  /** Normalized syllable key, e.g. "taon". */
  syllable: string;
  glyph: string | null;
  han: string;
  /** Index within that syllable's array (stable list keys). */
  index: number;
};

export type GoetsusiojiLexicon = {
  map: CharactersMap;
  /** All syllable keys, sorted ascending. */
  keys: string[];
  keySet: Set<string>;
  /** Glyph → syllable keys (many-to-many); only non-null glyphs. */
  charToSyllables: Map<string, string[]>;
  /** Syllables with at least one non-null Siauzy glyph. */
  filledCount: number;
};

export type GoetsusiojiOutputMode = "siauzy" | "han";

export type GoetsusiojiMeta = {
  initials_order: string[];
  finals_order: string[];
  medials_order?: string[];
  duplicate_compact_romanizations: string[];
  syllable_count: number;
  source?: string;
  mapping_meta?: {
    generated_by?: string | null;
    stats?: unknown;
    description?: string | null;
  };
};
