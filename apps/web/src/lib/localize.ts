import type { LocalizedString } from "./catalog-types";
import { toTraditional } from "./converter";

export function localizeField(
  value: LocalizedString | undefined,
  locale: string,
  fallback = "",
): string {
  if (!value) return fallback;
  if (typeof value === "string") {
    // Prefer Traditional for all UI-facing dictionary labels.
    return toTraditional(value);
  }
  const preferHans = /Hans$/.test(locale);
  const order = preferHans
    ? [
        locale,
        locale.replace(/Hans$/, "Hant"),
        "wuu-Hans",
        "zh-Hans",
        "wuu-Hant",
        "zh-Hant",
        "en",
      ]
    : [
        locale,
        locale.replace(/Hant$/, "Hans"),
        "wuu-Hant",
        "zh-Hant",
        "wuu-Hans",
        "zh-Hans",
        "en",
      ];
  for (const key of order) {
    if (value[key]) {
      const picked = value[key]!;
      return preferHans ? picked : toTraditional(picked);
    }
  }
  const first = Object.values(value)[0] || fallback;
  return preferHans ? first : toTraditional(first);
}
