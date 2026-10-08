"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { DictionaryEntry } from "@/lib/dictionary-types";
import type { DictionaryMeta } from "@/lib/catalog-types";
import { localizeField } from "@/lib/localize";
import { useI18n } from "@/lib/i18n";
import {
  LanguageSwitcher,
  RedDotDivider,
  SiteFooter,
  ThemeToggle,
} from "@/components/chrome";
import { DictCard } from "@/components/dict-card";
import { GoetsusiojiLine, GoetsusiojiRuby } from "@/components/goetsusioji-ruby";
import { hanToGoetsusioji } from "@/lib/chinese-to-goetsusioji";
import Link from "next/link";

export default function HomePage() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [reverse, setReverse] = useState(false);
  const [featured, setFeatured] = useState<DictionaryEntry[]>([]);
  const [dictionaries, setDictionaries] = useState<DictionaryMeta[]>([]);
  const [total, setTotal] = useState(0);
  const [luckyLoading, setLuckyLoading] = useState(false);

  useEffect(() => {
    fetch("/api/random?count=3")
      .then((response) => response.json())
      .then((payload) => setFeatured(payload.entries || []))
      .catch(() => setFeatured([]));
    fetch("/api/dictionaries")
      .then((response) => response.json())
      .then((payload) => {
        setDictionaries(payload.dictionaries || []);
        setTotal(payload.total_entries || 0);
      })
      .catch(() => setDictionaries([]));
  }, []);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const q = query.trim();
    if (!q) return;
    const resolve = await fetch(
      `/api/search/resolve?q=${encodeURIComponent(q)}${reverse ? "&mode=reverse" : ""}`,
    ).then((response) => response.json());
    if (resolve.type === "word" && resolve.canonicalHeadword) {
      router.push(`/word/${encodeURIComponent(resolve.canonicalHeadword)}?q=${encodeURIComponent(q)}`);
      return;
    }
    const params = new URLSearchParams({ q });
    if (reverse) params.set("mode", "reverse");
    router.push(`/search?${params.toString()}`);
  };

  const feelingLucky = async () => {
    setLuckyLoading(true);
    try {
      const payload = await fetch("/api/random?count=1").then((response) =>
        response.json(),
      );
      const entry = (payload.entries || [])[0] as DictionaryEntry | undefined;
      if (!entry) return;
      const headword = entry.headword.normalized || entry.headword.display;
      router.push(`/word/${encodeURIComponent(headword)}`);
    } finally {
      setLuckyLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-6 flex justify-end items-center gap-4 pt-5 pb-2">
        <ThemeToggle />
        <LanguageSwitcher />
      </div>
      <main id="main-content" className="font-cjk-ui">
        <section className="relative min-h-[580px] flex flex-col items-center justify-center px-6 pt-16 pb-28 overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none flex items-center justify-center">
            <span className="text-[28rem] font-headline text-kapok leading-none">
              辭
            </span>
          </div>
          <div className="relative z-10 text-center max-w-3xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-headline text-ink dark:text-stone-100 mb-5">
              <GoetsusiojiRuby text={t("common.siteName")} />
            </h1>
            <RedDotDivider />
            <p className="text-xl font-serif">{t("common.siteSubtitle")}</p>
            <p className="text-lg text-ink/80 dark:text-parchment/80 font-serif">
              {t("common.siteDescription")}
            </p>
            <GoetsusiojiLine
              className="mt-2 mb-12 text-base"
              text={hanToGoetsusioji(null, t("common.siteDescription"))}
            />
            <form onSubmit={onSubmit} className="w-full max-w-4xl mx-auto">
              <div className="relative flex items-center bg-white dark:bg-navy-card">
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t("common.searchPlaceholder")}
                  className="w-full py-5 pl-6 pr-40 bg-transparent text-lg text-ink dark:text-stone-100"
                />
                <button
                  type="submit"
                  className="absolute right-3 bg-kapok text-white dark:text-navy px-5 py-2.5"
                >
                  {t("common.searchButton")}
                </button>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
                <label className="inline-flex items-center gap-2 text-sm text-graphite">
                  <input
                    type="checkbox"
                    checked={reverse}
                    onChange={(event) => setReverse(event.target.checked)}
                  />
                  {t("common.reverseSearch")}
                </label>
                <button
                  type="button"
                  disabled={luckyLoading || total === 0}
                  onClick={feelingLucky}
                  className="text-sm font-serif text-kapok hover:text-kapok/80 disabled:opacity-60 border border-kapok/40 px-4 py-1.5"
                >
                  {luckyLoading ? t("common.loading") : "清風亂翻書"}
                </button>
              </div>
            </form>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-6 pb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-headline text-2xl">
              {t("common.recommendedEntries")}
            </h2>
            <Link href="/browse" className="text-kapok text-sm">
              {t("browse.title")}
            </Link>
          </div>
          {featured.length === 0 ? (
            <p className="text-graphite dark:text-stone-400">
              {t("common.moreDictionariesComing")}
            </p>
          ) : (
            <div className="grid md:grid-cols-3 gap-4">
              {featured.map((entry) => (
                <DictCard key={entry.id} entry={entry} compact />
              ))}
            </div>
          )}
        </section>

        <section className="max-w-6xl mx-auto px-6 pb-20">
          <h2 className="font-headline text-2xl mb-2">
            {t("common.includedDictionaries")}
          </h2>
          <p className="text-graphite mb-6">
            {t("common.totalEntriesPrefix")} {total.toLocaleString()}{" "}
            {t("common.totalEntriesSuffix")}
          </p>
          {dictionaries.length === 0 ? (
            <p className="text-graphite dark:text-stone-400">
              {t("common.moreDictionariesComing")}
            </p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {dictionaries.map((dict) => (
                <Link
                  key={dict.id}
                  href={`/browse/${dict.id}`}
                  className="bg-white dark:bg-navy-card border border-outline-soft/40 p-4 hover:border-kapok"
                >
                  <div className="font-headline text-lg">
                    {localizeField(dict.name, locale, dict.id)}
                  </div>
                  <div className="text-sm text-graphite mt-1">
                    {localizeField(dict.dialect, locale)} ·{" "}
                    {dict.entries_count.toLocaleString()}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
