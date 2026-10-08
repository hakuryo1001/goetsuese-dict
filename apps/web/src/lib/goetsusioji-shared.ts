import {
  GoetsusiojiMapper,
  buildIndexes,
  type CharactersMap,
  type GoetsusiojiMeta,
  type SyllableOutput,
} from "@wulam/goetsusioji";

export function isSyllableOutput(item: unknown): item is SyllableOutput {
  if (item === null || typeof item !== "object" || Array.isArray(item)) {
    return false;
  }
  const o = item as Record<string, unknown>;
  const glyphOk = o.glyph === null || typeof o.glyph === "string";
  const hanOk = typeof o.han === "string";
  return glyphOk && hanOk;
}

export function validateMap(data: unknown): CharactersMap {
  if (data === null || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("syllables.json: expected a top-level object");
  }

  const map: CharactersMap = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if (!Array.isArray(value)) {
      throw new Error(`syllables.json: value for "${key}" must be an array`);
    }
    map[key] = value.map((item, i) => {
      if (!isSyllableOutput(item)) {
        throw new Error(
          `syllables.json: entry ${i} under "${key}" must be { glyph: string|null, han: string }`,
        );
      }
      return {
        glyph:
          typeof item.glyph === "string" && item.glyph.trim()
            ? item.glyph
            : null,
        han: item.han,
      };
    });
  }
  return map;
}

export function mapperFromJson(
  syllables: unknown,
  meta: GoetsusiojiMeta,
): GoetsusiojiMapper {
  return new GoetsusiojiMapper(buildIndexes(validateMap(syllables)), meta);
}
