import {
  ngvenToGoetsusiojiText,
  type GoetsusiojiMapper,
} from "@wulam/goetsusioji";

const HAN = /\p{Script=Han}/u;

export type GoetsusiojiRubyPair = {
  char: string;
  goetsusioji: string | null;
};

export function hasHan(text: string): boolean {
  return HAN.test(text);
}

/**
 * TODO: Plug in a Wu Han→ngven converter when one exists.
 * Until then, automatic ruby / definition Goetsusioji stays empty.
 */
export function hanToNgven(_text: string): string {
  return "";
}

export function hanToGoetsusioji(
  _mapper: GoetsusiojiMapper | null,
  _text: string,
): string {
  return "";
}

export function hanToRubyPairs(text: string): GoetsusiojiRubyPair[] {
  if (!text) return [];
  return [...text].map((char) => ({
    char,
    goetsusioji: null,
  }));
}

export function definitionGoetsusioji(_definition: string): string {
  return "";
}

/** Map already-known ngven text through a mapper (server or client). */
export function ngvenPhraseToGoetsusioji(
  mapper: GoetsusiojiMapper,
  ngven: string,
): string {
  if (!ngven.trim()) return "";
  return ngvenToGoetsusiojiText(mapper, ngven);
}
