"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppHeader, SiteFooter } from "@/components/chrome";
import { DictCard } from "@/components/dict-card";
import { useI18n } from "@/lib/i18n";
import type { GroupedSearchResponse } from "@/lib/search-result-groups";

export default function SearchClient() {
  const params = useSearchParams();
  const router = useRouter();
  const { t } = useI18n();
  const initialQ = params.get("q") || "";
  const reverse = params.get("mode") === "reverse";
  const [query, setQuery] = useState(initialQ);
  const [data, setData] = useState<GroupedSearchResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const searchKey = useMemo(
    () =>
      `${params.get("q")}|${params.get("mode")}|${params.get("dict")}|${params.get("offset")}`,
    [params],
  );

  useEffect(() => {
    const q = params.get("q") || "";
    setQuery(q);
    if (!q.trim()) {
      setData(null);
      return;
    }
    setLoading(true);
    fetch(`/api/search?${params.toString()}`)
      .then((response) => response.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [searchKey, params]);

  return (
    <div>
      <AppHeader
        query={query}
        onQueryChange={setQuery}
        reverse={reverse}
        onReverseChange={(value) => {
          const next = new URLSearchParams(params.toString());
          if (value) next.set("mode", "reverse");
          else next.delete("mode");
          next.set("q", query);
          router.push(`/search?${next.toString()}`);
        }}
      />
      <main id="main-content" className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="font-headline text-3xl mb-6">
          {reverse
            ? `${t("common.reverseSearchResultsPrefix")} ${initialQ}`
            : `${t("common.searchResultsPrefix")} ${initialQ}`}
        </h1>
        {loading ? <p>{t("common.searching")}</p> : null}
        {!loading && data && data.groups.length === 0 ? (
          <div>
            <h2 className="font-headline text-2xl mb-2">
              {t("common.noResultsTitle")}
            </h2>
            <p className="text-graphite">{t("common.noResultsDescription")}</p>
          </div>
        ) : null}
        <div className="space-y-4">
          {data?.groups.map((group) => (
            <DictCard key={group.key} entry={group.primary} />
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
