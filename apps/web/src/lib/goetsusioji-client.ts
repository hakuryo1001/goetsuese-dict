"use client";

import type { GoetsusiojiMapper, GoetsusiojiMeta } from "@wulam/goetsusioji";
import { mapperFromJson } from "./goetsusioji-shared";

let clientMapperPromise: Promise<GoetsusiojiMapper> | null = null;

/** Client-side loader: fetch JSON from /goetsusioji/ and build a mapper. */
export async function loadGoetsusiojiMapperClient(): Promise<GoetsusiojiMapper> {
  const [syllablesRes, metaRes] = await Promise.all([
    fetch("/goetsusioji/syllables.json"),
    fetch("/goetsusioji/meta.json"),
  ]);
  if (!syllablesRes.ok || !metaRes.ok) {
    throw new Error("Could not load Goetsusioji lexicon");
  }
  const meta = (await metaRes.json()) as GoetsusiojiMeta;
  return mapperFromJson(await syllablesRes.json(), meta);
}

export function getClientGoetsusiojiMapper(): Promise<GoetsusiojiMapper> {
  if (!clientMapperPromise) {
    clientMapperPromise = loadGoetsusiojiMapperClient();
  }
  return clientMapperPromise;
}
