import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  ngvenToGoetsusiojiText,
  type GoetsusiojiMapper,
  type GoetsusiojiMeta,
  type GoetsusiojiOutputMode,
} from "@wulam/goetsusioji";
import { mapperFromJson } from "./goetsusioji-shared";

let mapperPromise: Promise<GoetsusiojiMapper> | null = null;

function publicGoetsusiojiDir(): string {
  return path.resolve(process.cwd(), "public", "goetsusioji");
}

async function loadMapperFromDisk(): Promise<GoetsusiojiMapper> {
  const dir = publicGoetsusiojiDir();
  const [syllablesRaw, metaRaw] = await Promise.all([
    readFile(path.join(dir, "syllables.json"), "utf8"),
    readFile(path.join(dir, "meta.json"), "utf8"),
  ]);
  const meta = JSON.parse(metaRaw) as GoetsusiojiMeta;
  return mapperFromJson(JSON.parse(syllablesRaw) as unknown, meta);
}

/** Server-side cached mapper (reads public/goetsusioji/*.json via fs). */
export function getGoetsusiojiMapper(): Promise<GoetsusiojiMapper> {
  if (!mapperPromise) {
    mapperPromise = loadMapperFromDisk();
  }
  return mapperPromise;
}

export async function mapNgvenToText(
  text: string,
  mode: GoetsusiojiOutputMode = "siauzy",
): Promise<string> {
  if (!text.trim()) return "";
  const mapper = await getGoetsusiojiMapper();
  return ngvenToGoetsusiojiText(mapper, text, mode);
}
