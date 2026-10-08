import {
  ngvenToGoetsusiojiText,
  type GoetsusiojiMapper,
} from "@wulam/goetsusioji";
import type { Phonetic } from "./dictionary-types";

export interface PhoneticDisplayRow {
  ngven: string;
  siauzy: string;
  han: string;
  original: string | null;
}

type DisplayPhonetic = Pick<Phonetic, "ngven" | "original">;

function originalsAsArray(original: Phonetic["original"]): string[] {
  if (!original) return [];
  if (Array.isArray(original)) {
    return original.map((v) => String(v || "").trim()).filter(Boolean);
  }
  const single = String(original).trim();
  return single ? [single] : [];
}

export const getOriginalPhoneticForIndex = (
  phonetic: DisplayPhonetic,
  idx: number,
): string | null => {
  const original = phonetic.original;
  const ngvenArray = phonetic.ngven || [];
  const currentNgven = ngvenArray[idx]?.trim();

  if (!original || (Array.isArray(original) && original.length === 0)) {
    return null;
  }

  if (Array.isArray(original)) {
    if (original.length === 1) {
      if (idx !== 0) return null;
      const singleOriginal = original[0]?.trim();
      if (!singleOriginal || singleOriginal === currentNgven) return null;
      return singleOriginal;
    }

    const matchedOriginal = original[idx]?.trim();
    if (matchedOriginal && matchedOriginal !== currentNgven) {
      return matchedOriginal;
    }
    return null;
  }

  const normalizedOriginal = original.trim();
  if (
    idx !== 0 ||
    !normalizedOriginal ||
    normalizedOriginal === currentNgven
  ) {
    return null;
  }

  return normalizedOriginal;
};

/** Sync rows without Goetsusioji mapping (siauzy/han empty). */
export const getPhoneticDisplayRows = (
  phonetic: DisplayPhonetic,
): PhoneticDisplayRow[] => {
  const seen = new Set<string>();
  const rows: PhoneticDisplayRow[] = [];

  (phonetic.ngven || []).forEach((nv, idx) => {
    const ngven = nv?.trim();
    if (!ngven) return;

    const original = getOriginalPhoneticForIndex(phonetic, idx);
    const key = `${ngven}||${original ?? ""}`;
    if (seen.has(key)) return;

    seen.add(key);
    rows.push({
      ngven,
      siauzy: "",
      han: "",
      original,
    });
  });

  // Fallback: show original reading(s) when ngven is empty so entries still display phonetics.
  if (rows.length === 0) {
    for (const original of originalsAsArray(phonetic.original)) {
      const key = `||${original}`;
      if (seen.has(key)) continue;
      seen.add(key);
      rows.push({
        ngven: "",
        siauzy: "",
        han: "",
        original,
      });
    }
  }

  return rows;
};

/** Fill Siauzy / Han using a mapper. */
export const getPhoneticDisplayRowsMapped = (
  phonetic: DisplayPhonetic,
  mapper: GoetsusiojiMapper,
): PhoneticDisplayRow[] => {
  return getPhoneticDisplayRows(phonetic).map((row) => {
    if (!row.ngven) {
      return row;
    }
    return {
      ...row,
      siauzy: ngvenToGoetsusiojiText(mapper, row.ngven, "siauzy"),
      han: ngvenToGoetsusiojiText(mapper, row.ngven, "han"),
    };
  });
};
