"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { AppHeader, SiteFooter } from "@/components/chrome";
import { PageNav } from "@/components/page-nav";
import { useI18n } from "@/lib/i18n";
import { localizeField } from "@/lib/localize";
import type { DictionaryMeta } from "@/lib/catalog-types";

type BrowsePayload = {
  page: number;
  pages: number;
  total: number;
  headwords: string[];
  dict: string;
};

export default function BrowseClient() {
  const params = useParams<{ dict?: string }>();
  const searchParams = useSearchParams();
  const { t, locale } = useI18n();
  const [query, setQuery] = useState("");
  const [data, setData] = useState<BrowsePayload | null>(null);
  const [dictionaries, setDictionaries] = useState<DictionaryMeta[]>([]);
  const dict = params.dict || searchParams.get("dict") || "all";
  const page = Number(searchParams.get("page") || 1);

  useEffect(() => {
    fetch(`/api/browse?dict=${encodeURIComponent(dict)}&page=${page}&size=80`)
      .then((response) => response.json())
      .then(setData)
      .catch(() => setData(null));
  }, [dict, page]);

  useEffect(() => {
    fetch("/api/dictionaries")
      .then((response) => response.json())
      .then((payload) => setDictionaries(payload.dictionaries || []));
  }, []);

  return (
    <div>
      <AppHeader query={query} onQueryChange={setQuery} />
      <main id="main-content" className="max-w-6xl mx-auto px-6 py-10">
        <h1 className="font-headline text-3xl mb-6">{t("browse.title")}</h1>
        <div className="flex flex-wrap gap-2 mb-8">
          <Link
            href="/browse"
            className={`px-3 py-1 text-sm border ${dict === "all" ? "bg-kapok text-white dark:text-navy border-kapok" : "border-outline-soft"}`}
          >
            {t("browse.allSources")}
          </Link>
          {dictionaries.map((item) => (
            <Link
              key={item.id}
              href={`/browse/${item.id}`}
              className={`px-3 py-1 text-sm border ${dict === item.id ? "bg-kapok text-white dark:text-navy border-kapok" : "border-outline-soft"}`}
            >
              {localizeField(item.name, locale, item.id)}
            </Link>
          ))}
        </div>
        <p className="text-graphite mb-4">
          {t("browse.entries", { count: data?.total || 0 })}
        </p>
        {data && data.total === 0 ? (
          <p className="text-graphite dark:text-stone-400">
            {t("common.moreDictionariesComing")}
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data?.headwords.map((headword) => (
              <Link
                key={headword}
                href={`/word/${encodeURIComponent(headword)}`}
                className="px-4 py-3 bg-white dark:bg-navy-card border border-outline-soft/40 hover:border-kapok"
              >
                {headword}
              </Link>
            ))}
          </div>
        )}
        {data ? (
          <PageNav
            page={data.page}
            pages={data.pages}
            basePath={`/browse${dict === "all" ? "" : `/${dict}`}`}
          />
        ) : null}
      </main>
      <SiteFooter />
    </div>
  );
}
