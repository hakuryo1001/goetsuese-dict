"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { AppHeader, PronunciationRow, SiteFooter } from "@/components/chrome";
import { useI18n } from "@/lib/i18n";
import type { DictionaryEntry } from "@/lib/dictionary-types";
import type { RelatedGroups, RelatedItem } from "@/lib/related-types";
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

const EMPTY_RELATED: RelatedGroups = {
  compounds: [],
  shared_characters: [],
  homophones: [],
};

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

function RelatedGroupList({
  title,
  items,
}: {
  title: string;
  items: RelatedItem[];
}) {
  if (!items.length) return null;
  return (
    <div>
      <h3 className="text-sm font-medium text-graphite mb-2">{title}</h3>
      <ul className="flex flex-wrap gap-x-4 gap-y-2">
        {items.map((item) => (
          <li key={item.headword}>
            <Link
              href={`/word/${encodeURIComponent(item.headword)}`}
              className="inline-flex items-baseline gap-2 hover:text-kapok"
            >
              <span className="font-headline text-lg text-ink dark:text-stone-100">
                {item.display}
              </span>
              {item.ngven ? (
                <span className="font-mono text-sm text-kapok">{item.ngven}</span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function WordPage() {
  const params = useParams<{ headword: string }>();
  const searchParams = useSearchParams();
  const { t } = useI18n();
  const [query, setQuery] = useState(searchParams.get("q") || params.headword);
  const [entries, setEntries] = useState<DictionaryEntry[]>([]);
  const [readings, setReadings] = useState<ReadingGroup[]>([]);
  const [related, setRelated] = useState<RelatedGroups>(EMPTY_RELATED);
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
    setRelated(EMPTY_RELATED);
    fetch(`/api/word/${encodeURIComponent(headword)}`)
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) {
          setMissing(true);
          setLoaded(true);
          return;
        }
        const canonicalHeadword =
          payload.canonical_headword || headword;
        setCanonical(canonicalHeadword);
        setEntries(payload.entries || []);
        setReadings(payload.readings || []);
        setMissing(false);
        setLoaded(true);

        fetch(
          `/api/word/${encodeURIComponent(canonicalHeadword)}/related?limit=8`,
        )
          .then(async (relatedResponse) => {
            if (!relatedResponse.ok) return;
            const relatedPayload = await relatedResponse.json();
            if (relatedPayload.groups) {
              setRelated(relatedPayload.groups);
            }
          })
          .catch(() => {
            /* related section stays empty */
          });
      })
      .catch(() => {
        setMissing(true);
        setLoaded(true);
      });
  }, [params.headword]);

  const primary = entries[0];
  const title = primary?.headword.display || canonical;
  const hasRelated =
    related.compounds.length > 0 ||
    related.shared_characters.length > 0 ||
    related.homophones.length > 0;

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
            {hasRelated ? (
              <section className="mt-12 pt-8 border-t border-outline-soft/40 dark:border-white/10">
                <h2 className="font-headline text-2xl mb-6">
                  {t("wordPage.relatedTitle")}
                </h2>
                <div className="space-y-6">
                  <RelatedGroupList
                    title={t("wordPage.relatedCompounds")}
                    items={related.compounds}
                  />
                  <RelatedGroupList
                    title={t("wordPage.relatedSharedCharacters")}
                    items={related.shared_characters}
                  />
                  <RelatedGroupList
                    title={t("wordPage.relatedHomophones")}
                    items={related.homophones}
                  />
                </div>
              </section>
            ) : null}
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
