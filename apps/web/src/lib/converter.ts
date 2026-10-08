import { Converter } from "opencc-js";

const phraseToSimplified = Converter({ from: "hk", to: "cn" });
const phraseToTraditional = Converter({ from: "cn", to: "hk" });

/**
 * OpenCC phrase tables can leave some simplified characters unconverted
 * (e.g. 贵价 → 貴价). Finish with a per-character pass.
 */
function hardenTraditional(text: string): string {
  const phrased = phraseToTraditional(text);
  return [...phrased].map((ch) => phraseToTraditional(ch)).join("");
}

function hardenSimplified(text: string): string {
  const phrased = phraseToSimplified(text);
  return [...phrased].map((ch) => phraseToSimplified(ch)).join("");
}

export function toTraditional(text: string): string {
  if (!text) return text;
  return hardenTraditional(text);
}

export function toSimplified(text: string): string {
  if (!text) return text;
  return hardenSimplified(text);
}

export function expandQueryVariants(query: string): string[] {
  const seed = query.trim().toLowerCase();
  if (!seed) return [];
  const variants = new Set<string>([
    seed,
    toSimplified(seed).toLowerCase(),
    toTraditional(seed).toLowerCase(),
  ]);
  return [...variants].filter(Boolean);
}
