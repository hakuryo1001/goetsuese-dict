"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Moon, Sun } from "lucide-react";
import { LOCALES, useI18n, type Locale } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { GoetsusiojiRuby } from "@/components/goetsusioji-ruby";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const { t } = useI18n();
  const dark = theme === "dark";
  return (
    <button
      type="button"
      className="p-2 text-graphite dark:text-stone-300 hover:text-kapok"
      aria-label={t("common.themeToggle")}
      onClick={() => setTheme(dark ? "light" : "dark")}
    >
      {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();
  const labels: Record<Locale, string> = {
    "wuu-Hant": t("common.langWuuHant"),
    "wuu-Hans": t("common.langWuuHans"),
    "zh-Hant": t("common.langZhHant"),
    "zh-Hans": t("common.langZhHans"),
    en: t("common.langEn"),
  };
  return (
    <select
      aria-label={t("common.languageSwitcherLabel")}
      className="bg-transparent text-sm text-graphite dark:text-stone-300"
      value={locale}
      onChange={(event) => setLocale(event.target.value as Locale)}
    >
      {LOCALES.map((code) => (
        <option key={code} value={code}>
          {labels[code]}
        </option>
      ))}
    </select>
  );
}

export function AppHeader({
  query,
  onQueryChange,
  reverse,
  onReverseChange,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  reverse?: boolean;
  onReverseChange?: (value: boolean) => void;
}) {
  const { t } = useI18n();
  const router = useRouter();

  const submit = () => {
    const q = query.trim();
    if (!q) return;
    const params = new URLSearchParams({ q });
    if (reverse) params.set("mode", "reverse");
    router.push(`/search?${params.toString()}`);
  };

  return (
    <header className="bg-parchment/85 dark:bg-navy/85 backdrop-blur-md border-b border-outline-soft/20 dark:border-white/10 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-4 flex-1 min-w-0">
          <Link
            href="/"
            className="text-lg sm:text-xl font-headline font-bold text-kapok whitespace-nowrap"
          >
            <GoetsusiojiRuby text={t("common.siteName")} />
          </Link>
          <div className="flex-1 min-w-0 max-w-2xl relative">
            <input
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && submit()}
              placeholder={t("common.searchPlaceholder")}
              aria-label={t("common.searchDictionaryAria")}
              className="w-full px-4 py-2 pr-20 bg-surface-low dark:bg-navy-card text-ink dark:text-stone-100"
            />
            <button
              type="button"
              className="absolute right-1 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-kapok text-white dark:text-navy text-sm"
              onClick={submit}
            >
              {t("common.searchButton")}
            </button>
          </div>
          {onReverseChange ? (
            <label className="hidden lg:flex items-center gap-2 text-sm text-graphite dark:text-stone-300">
              <input
                type="checkbox"
                checked={Boolean(reverse)}
                onChange={(event) => onReverseChange(event.target.checked)}
              />
              {t("common.reverseSearchShort")}
            </label>
          ) : null}
        </div>
        <div className="flex items-center gap-3">
          <Link href="/browse" className="text-sm text-graphite hover:text-kapok">
            {t("browse.title")}
          </Link>
          <Link href="/about" className="text-sm text-graphite hover:text-kapok">
            {t("common.aboutProject")}
          </Link>
          <ThemeToggle />
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  const { t } = useI18n();
  return (
    <footer className="border-t border-outline-soft/30 dark:border-white/10 py-10 mt-16">
      <div className="max-w-7xl mx-auto px-6 text-sm text-graphite dark:text-stone-400 space-y-3">
        <p>
          {t("common.footerCopyright")}
          <span className="text-kapok"> GitHub</span>
        </p>
        <p>{t("common.footerLicenseIntro")}</p>
      </div>
    </footer>
  );
}

export function RedDotDivider() {
  return (
    <div className="flex items-center justify-center gap-4 my-6">
      <div className="h-px w-12 bg-kapok/30" />
      <div className="w-1.5 h-1.5 rounded-full bg-kapok" />
      <div className="h-px w-12 bg-kapok/30" />
    </div>
  );
}

export function PronunciationRow({
  ngven,
  siauzy,
  han,
  original,
}: {
  ngven: string;
  siauzy: string;
  han?: string;
  original?: string | null;
}) {
  const { t } = useI18n();
  const primary = ngven || original || "";
  const showOriginalAside = Boolean(ngven && original && original !== ngven);
  return (
    <div className="flex items-baseline gap-3 flex-wrap">
      {primary ? (
        <span className="text-kapok font-semibold font-mono">{primary}</span>
      ) : null}
      {siauzy ? (
        <span className="text-ink dark:text-stone-100 font-goetsusioji text-lg">
          {siauzy}
        </span>
      ) : han ? (
        <span className="text-ink/70 dark:text-stone-300 font-serif text-sm">
          {han}
        </span>
      ) : null}
      {showOriginalAside ? (
        <span className="text-xs text-graphite/60">
          {t("dictCard.originalPhonetic")}
          {original}
        </span>
      ) : null}
    </div>
  );
}
