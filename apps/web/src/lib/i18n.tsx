"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import en from "@/i18n/en.json";
import wuuHant from "@/i18n/wuu-Hant.json";
import wuuHans from "@/i18n/wuu-Hans.json";
import zhHant from "@/i18n/zh-Hant.json";
import zhHans from "@/i18n/zh-Hans.json";

export const LOCALES = [
  "wuu-Hant",
  "wuu-Hans",
  "zh-Hant",
  "zh-Hans",
  "en",
] as const;

export type Locale = (typeof LOCALES)[number];

const messages: Record<Locale, Record<string, unknown>> = {
  "wuu-Hant": wuuHant,
  "wuu-Hans": wuuHans,
  "zh-Hant": zhHant,
  "zh-Hans": zhHans,
  en,
};

function lookup(tree: unknown, path: string): string | undefined {
  const value = path.split(".").reduce<unknown>((current, key) => {
    if (current && typeof current === "object" && key in current) {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, tree);
  return typeof value === "string" ? value : undefined;
}

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("wuu-Hant");

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    if (typeof document !== "undefined") {
      document.documentElement.lang = next;
    }
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const template =
        lookup(messages[locale], key) ||
        lookup(messages["wuu-Hant"], key) ||
        key;
      if (!vars) return template;
      return template.replace(/\{(\w+)\}/g, (_, name: string) =>
        String(vars[name] ?? `{${name}}`),
      );
    },
    [locale],
  );

  const value = useMemo(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return context;
}
