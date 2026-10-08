"use client";

import { useEffect, useState } from "react";
import type { DictionaryEntry } from "@/lib/dictionary-types";
import {
  getPhoneticDisplayRows,
  getPhoneticDisplayRowsMapped,
  type PhoneticDisplayRow,
} from "@/lib/phonetic-display";
import { PronunciationRow } from "./chrome";
import { GoetsusiojiLine } from "@/components/goetsusioji-ruby";
import { definitionGoetsusioji } from "@/lib/chinese-to-goetsusioji";
import { getClientGoetsusiojiMapper } from "@/lib/goetsusioji-client";
import { useI18n } from "@/lib/i18n";
import Link from "next/link";

export function DictCard({
  entry,
  compact = false,
}: {
  entry: DictionaryEntry;
  compact?: boolean;
}) {
  const { t } = useI18n();
  const [rows, setRows] = useState<PhoneticDisplayRow[]>(() =>
    getPhoneticDisplayRows(entry.phonetic || { ngven: [], original: "" }),
  );
  const definition = entry.senses?.[0]?.definition || t("common.noDefinition");
  const word = entry.headword.display || entry.headword.normalized;

  useEffect(() => {
    let cancelled = false;
    const base = entry.phonetic || { ngven: [], original: "" };
    setRows(getPhoneticDisplayRows(base));
    getClientGoetsusiojiMapper()
      .then((mapper) => {
        if (!cancelled) setRows(getPhoneticDisplayRowsMapped(base, mapper));
      })
      .catch(() => {
        /* keep unmapped rows */
      });
    return () => {
      cancelled = true;
    };
  }, [entry]);

  return (
    <article className="bg-white dark:bg-navy-card border border-outline-soft/40 dark:border-white/10 p-5">
      <Link href={`/word/${encodeURIComponent(entry.headword.normalized || word)}`}>
        <h3 className="font-headline text-2xl text-ink dark:text-stone-100 mb-2">
          {word}
        </h3>
      </Link>
      <div className="space-y-1 mb-3">
        {rows.map((row) => (
          <PronunciationRow
            key={`${row.ngven}-${row.siauzy}-${row.han}`}
            ngven={row.ngven}
            siauzy={row.siauzy}
            han={row.han}
            original={row.original}
          />
        ))}
      </div>
      <p className="text-ink/80 dark:text-stone-300 leading-relaxed">
        {compact && definition.length > 120
          ? `${definition.slice(0, 120)}…`
          : definition}
      </p>
      <GoetsusiojiLine
        className="mt-1 text-sm"
        text={definitionGoetsusioji(
          compact && definition.length > 120
            ? `${definition.slice(0, 120)}`
            : definition,
        )}
      />
      <p className="mt-3 text-xs text-graphite/70">{entry.source_book}</p>
    </article>
  );
}
