const ROMANIZE_ALIASES: Record<string, string> = {
  "ch(i)": "ch",
  "c(i)": "c",
  "j(i)": "j",
  "sh(i)": "sh",
  "zh(i)": "zh",
  "ae(n)": "ae",
  "oe(n)": "oe",
  "ie(n)": "ie",
};

/** Strip ngven tone marks from the end and lowercase. */
export function removeTone(romanization: string): string {
  let text = romanization.trim().toLowerCase();
  text = text.replace(/-·$/, "");
  text = text.replace(/-x$/, "");
  text = text.replace(/[-'\\<]$/, "");
  return text;
}

export function normalizeAlias(key: string): string {
  const text = key.trim().toLowerCase();
  return ROMANIZE_ALIASES[text] ?? text;
}

/** Normalize raw composition buffer for lookup. */
export function normalizeBuffer(buffer: string): string {
  return normalizeAlias(removeTone(buffer.trim()));
}
