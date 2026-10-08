"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { AppHeader, PronunciationRow, SiteFooter } from "@/components/chrome";
import { useI18n } from "@/lib/i18n";
import type { DictionaryEntry } from "@/lib/dictionary-types";
import {
  getPhoneticDisplayRows,
  getPhoneticDisplayRowsMapped,
  type PhoneticDisplayRow,
} from "@/lib/phonetic-display";
import { GoetsusiojiLine } from "@/components/goetsusioji-ruby";
import { definitionGoetsusioji } from "@/lib/chinese-to-goetsusioji";
import { getClientGoetsusiojiMapper } from "@/lib/goetsusioji-client";
import type { GoetsusiojiMapper } from "@wulam/goetsusioji";
import Link from "next/link";

function PhoneticBlock({
  phonetic,
  mapper,
  rowKeyPrefix = "",
}: {
  phonetic: DictionaryEntry["phonetic"];
  mapper: GoetsusiojiMapper | null;
  rowKeyPrefix?: string;
}) {
  const rows: PhoneticDisplayRow[] = mapper
    ? getPhoneticDisplayRowsMapped(phonetic, mapper)
    : getPhoneticDisplayRows(phonetic);
  return (
    <div className="space-y-2">
      {rows.map((row) => (
        <PronunciationRow
          key={`${rowKeyPrefix}${row.ngven}-${row.siauzy}`}
          ngven={row.ngven}
          siauzy={row.siauzy}
          han={row.han}
          original={row.original}
        />
      ))}
    </div>
  );
}

type ReadingGroup = {
  dialect: string;
  region_code: string;
  scheme: string;
  forms: string[];
  source?: string;
};

export default function WordPage() {
  const params = useParams<{ headword: string }>();
  const searchParams = useSearchParams();
  const { t } = useI18n();
  const [query, setQuery] = useState(searchParams.get("q") || params.headword);
  const [entries, setEntries] = useState<DictionaryEntry[]>([]);
  const [readings, setReadings] = useState<ReadingGroup[]>([]);
  const [canonical, setCanonical] = useState(params.headword);
  const [missing, setMissing] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [mapper, setMapper] = useState<GoetsusiojiMapper | null>(null);

  useEffect(() => {
    getClientGoetsusiojiMapper()
      .then(setMapper)
      .catch(() => setMapper(null));
  }, []);

  useEffect(() => {
    const headword = decodeURIComponent(params.headword);
    setLoaded(false);
    fetch(`/api/word/${encodeURIComponent(headword)}`)
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) {
          setMissing(true);
          setLoaded(true);
          return;
        }
        setCanonical(payload.canonical_headword);
        setEntries(payload.entries || []);
        setReadings(payload.readings || []);
        setMissing(false);
        setLoaded(true);
      })
      .catch(() => {
        setMissing(true);
        setLoaded(true);
      });
  }, [params.headword]);

  const primary = entries[0];
  const title = primary?.headword.display || canonical;

  return (
    <div>
      <AppHeader query={query} onQueryChange={setQuery} />
      <main id="main-content" className="max-w-4xl mx-auto px-6 py-10">
        {missing ? (
          <p>{t("common.noResultsTitle")}</p>
        ) : !loaded ? (
          <p>{t("common.loading")}</p>
        ) : (
          <>
            <h1 className="font-headline text-5xl mb-4">{title}</h1>
            {primary ? (
              <div className="mb-8">
                <PhoneticBlock phonetic={primary.phonetic} mapper={mapper} />
              </div>
            ) : null}
            {readings.length ? (
              <section className="mb-8">
                <h2 className="font-headline text-xl mb-3">
                  {t("wordPage.readingsTitle")}
                </h2>
                <ul className="space-y-2 text-sm">
                  {readings.map((group) => (
                    <li
                      key={`${group.region_code}-${group.scheme}-${group.forms.join("|")}`}
                    >
                      <span className="text-graphite mr-2">
                        {group.dialect}
                        {group.scheme ? ` · ${group.scheme}` : ""}
                      </span>
                      <span className="font-mono text-kapok">
                        {group.forms.join(" / ")}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
            {entries.length ? (
              <p className="text-sm text-graphite mb-6">
                {t("dictCard.collectedBy", { count: entries.length })}
              </p>
            ) : null}
            <div className="space-y-8">
              {entries.map((entry) => (
                <section
                  key={entry.id}
                  className="bg-white dark:bg-navy-card border border-outline-soft/40 p-6"
                >
                  <h2 className="font-headline text-xl mb-3">
                    {entry.source_book}
                  </h2>
                  <PhoneticBlock
                    phonetic={entry.phonetic}
                    mapper={mapper}
                    rowKeyPrefix={`${entry.id}-`}
                  />
                  <ol className="mt-4 space-y-4">
                    {entry.senses.map((sense, index) => (
                      <li key={`${entry.id}-${index}`}>
                        {sense.label ? (
                          <span className="text-xs text-kapok mr-2">
                            {sense.label}
                          </span>
                        ) : null}
                        <span>{sense.definition}</span>
                        <GoetsusiojiLine
                          className="mt-1 text-sm"
                          text={definitionGoetsusioji(sense.definition)}
                        />
                        {sense.examples?.length ? (
                          <ul className="mt-2 text-sm text-graphite space-y-1">
                            {sense.examples.map((example, exampleIndex) => (
                              <li key={exampleIndex}>
                                {example.text}
                                {example.ngven ? (
                                  <span className="ml-2 font-mono text-kapok">
                                    {example.ngven}
                                  </span>
                                ) : null}
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </li>
                    ))}
                  </ol>
                </section>
              ))}
            </div>
            <p className="mt-8">
              <Link
                className="text-kapok"
                href={`/search?q=${encodeURIComponent(searchParams.get("q") || canonical)}`}
              >
                {t("wordPage.searchCurrentWord", { word: canonical })}
              </Link>
            </p>
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
