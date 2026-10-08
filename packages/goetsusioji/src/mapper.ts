import { normalizeAlias, removeTone } from "./normalize";
import type {
  GoetsusiojiLexicon,
  GoetsusiojiMeta,
  GoetsusiojiOutputMode,
  SyllableOutput,
} from "./types";

export type MappingEntry = {
  glyph: string | null;
  han: string;
  kind?: string;
};

export type NgvenGoetsusiojiPair = {
  ngven: string;
  siauzy: string | null;
  han: string;
};

function firstOutput(
  entries: SyllableOutput[] | undefined,
): SyllableOutput | null {
  if (!entries?.length) return null;
  return entries[0] ?? null;
}

export class GoetsusiojiMapper {
  private readonly lex: GoetsusiojiLexicon;
  private readonly initials: string[];
  private readonly finals: string[];

  constructor(lex: GoetsusiojiLexicon, meta: GoetsusiojiMeta) {
    this.lex = lex;
    this.initials = [...meta.initials_order].sort((a, b) => b.length - a.length);
    this.finals = [...meta.finals_order].sort((a, b) => b.length - a.length);
  }

  splitSyllable(text: string): [string, string] | null {
    const key = normalizeAlias(text);
    if (!key) return null;
    for (const ini of this.initials) {
      if (!key.startsWith(ini)) continue;
      const rest = key.slice(ini.length);
      for (const fin of this.finals) {
        if (rest === fin) return [ini, fin];
      }
    }
    return null;
  }

  fromRomanization(text: string): MappingEntry | null {
    const key = normalizeAlias(removeTone(text));
    if (!key) return null;

    const direct = firstOutput(this.lex.map[key]);
    if (direct) {
      return { glyph: direct.glyph, han: direct.han, kind: "syllable" };
    }

    const split = this.splitSyllable(key);
    if (split) {
      const compact = split[0] + split[1];
      const compactOut = firstOutput(this.lex.map[compact]);
      if (compactOut) {
        return {
          glyph: compactOut.glyph,
          han: compactOut.han,
          kind: "syllable",
        };
      }
    }
    return null;
  }

  /** Prefer Siauzy; fall back to Han when glyph is missing. */
  textForMode(entry: MappingEntry, mode: GoetsusiojiOutputMode): string {
    if (mode === "han") {
      return entry.han || entry.glyph || "";
    }
    return entry.glyph || entry.han || "";
  }

  transliterateWords(phrase: string): Array<{
    token: string;
    type: string;
    mapping: MappingEntry | null;
  }> {
    const out: Array<{
      token: string;
      type: string;
      mapping: MappingEntry | null;
    }> = [];
    for (const raw of phrase.trim().split(/\s+/)) {
      const token = raw.trim().replace(/^\[|\]$/g, "");
      if (!token) continue;
      const direct = this.fromRomanization(token);
      if (direct) {
        out.push({ token, type: direct.kind ?? "syllable", mapping: direct });
        continue;
      }
      out.push({ token, type: "unknown", mapping: null });
    }
    return out;
  }

  transliterateText(
    phrase: string,
    mode: GoetsusiojiOutputMode = "siauzy",
  ): string {
    const chars: string[] = [];
    for (const item of this.transliterateWords(phrase)) {
      const mapping = item.mapping;
      if (mapping) {
        const text = this.textForMode(mapping, mode);
        chars.push(text || `[${item.token}]`);
      } else {
        chars.push(`[${item.token}]`);
      }
    }
    return chars.join("");
  }
}

/** Map space-separated ngven syllables to Siauzy / Han pairs. */
export function ngvenToGoetsusioji(
  mapper: GoetsusiojiMapper,
  text: string,
): NgvenGoetsusiojiPair[] {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((ngven) => {
      const mapping = mapper.fromRomanization(ngven);
      return {
        ngven,
        siauzy: mapping?.glyph ?? null,
        han: mapping?.han ?? "",
      };
    });
}

/** Concatenate preferred display form (Siauzy, else Han) for a phrase. */
export function ngvenToGoetsusiojiText(
  mapper: GoetsusiojiMapper,
  text: string,
  mode: GoetsusiojiOutputMode = "siauzy",
): string {
  return mapper.transliterateText(text, mode);
}
