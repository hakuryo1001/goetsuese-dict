"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";

export function buildPageList(
  current: number,
  total: number,
): Array<number | "ellipsis"> {
  if (total <= 1) return [1];

  const pages = new Set<number>();
  pages.add(1);
  pages.add(total);

  for (let page = current - 2; page <= current + 2; page += 1) {
    if (page >= 1 && page <= total) pages.add(page);
  }

  for (let page = 1; page <= Math.min(6, total); page += 1) {
    pages.add(page);
  }

  for (const step of [10, 20, 50, 100, 200, 500, 1000, 1500]) {
    if (step > 1 && step < total) pages.add(step);
  }

  if (current >= 10) {
    const decade = Math.round(current / 10) * 10;
    if (decade > 1 && decade < total) pages.add(decade);
  }
  if (current >= 100) {
    const hundred = Math.round(current / 100) * 100;
    if (hundred > 1 && hundred < total) pages.add(hundred);
  }

  const sorted = [...pages].sort((a, b) => a - b);
  const items: Array<number | "ellipsis"> = [];
  for (let index = 0; index < sorted.length; index += 1) {
    if (index > 0 && sorted[index]! - sorted[index - 1]! > 1) {
      items.push("ellipsis");
    }
    items.push(sorted[index]!);
  }
  return items;
}

function pageHref(basePath: string, page: number): string {
  const separator = basePath.includes("?") ? "&" : "?";
  return `${basePath}${separator}page=${page}`;
}

export function PageNav({
  page,
  pages,
  basePath,
}: {
  page: number;
  pages: number;
  /** Path without page query, e.g. `/browse` or `/browse/words-hk` */
  basePath: string;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [draft, setDraft] = useState(String(page));

  useEffect(() => {
    setDraft(String(page));
  }, [page]);

  if (pages <= 1) return null;

  const items = buildPageList(page, pages);

  const goTo = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const raw = String(formData.get("page") ?? draft);
    const next = Number.parseInt(raw, 10);
    if (!Number.isFinite(next)) {
      setDraft(String(page));
      return;
    }
    const clamped = Math.min(pages, Math.max(1, next));
    setDraft(String(clamped));
    if (clamped !== page) router.push(pageHref(basePath, clamped));
  };

  return (
    <nav
      aria-label={t("common.paginationAria")}
      className="mt-8 flex flex-col gap-4"
    >
      <div className="flex flex-wrap items-center gap-2">
        {page > 1 ? (
          <Link
            href={pageHref(basePath, page - 1)}
            className="px-3 py-1.5 text-sm text-kapok border border-outline-soft/50 hover:border-kapok"
          >
            {t("browse.prevPage")}
          </Link>
        ) : (
          <span className="px-3 py-1.5 text-sm text-graphite/40 border border-transparent">
            {t("browse.prevPage")}
          </span>
        )}

        {items.map((item, index) =>
          item === "ellipsis" ? (
            <span
              key={`ellipsis-${index}`}
              className="px-1 text-graphite/60 select-none"
              aria-hidden
            >
              …
            </span>
          ) : (
            <Link
              key={item}
              href={pageHref(basePath, item)}
              aria-current={item === page ? "page" : undefined}
              className={
                item === page
                  ? "min-w-9 px-2.5 py-1.5 text-sm text-center bg-kapok text-white dark:text-navy"
                  : "min-w-9 px-2.5 py-1.5 text-sm text-center text-kapok border border-outline-soft/50 hover:border-kapok"
              }
            >
              {item}
            </Link>
          ),
        )}

        {page < pages ? (
          <Link
            href={pageHref(basePath, page + 1)}
            className="px-3 py-1.5 text-sm text-kapok border border-outline-soft/50 hover:border-kapok"
          >
            {t("browse.nextPage")}
          </Link>
        ) : (
          <span className="px-3 py-1.5 text-sm text-graphite/40 border border-transparent">
            {t("browse.nextPage")}
          </span>
        )}
      </div>

      <form onSubmit={goTo} className="flex flex-wrap items-center gap-2 text-sm">
        <label htmlFor="browse-page-jump" className="text-graphite dark:text-stone-300">
          {t("browse.pageInputPrefix")}
        </label>
        <input
          id="browse-page-jump"
          name="page"
          type="number"
          inputMode="numeric"
          min={1}
          max={pages}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          className="w-20 px-2 py-1.5 bg-white dark:bg-navy-card border border-outline-soft/50 text-ink dark:text-stone-100"
          aria-label={t("browse.pageInfo", { page, total: pages })}
        />
        <span className="text-graphite dark:text-stone-300">
          {t("browse.pageInputSuffix")
            ? `${t("browse.pageInputSuffix")} / ${pages}`
            : `/ ${pages}`}
        </span>
        <button
          type="submit"
          className="px-3 py-1.5 bg-kapok text-white dark:text-navy"
        >
          {t("browse.goToPage")}
        </button>
      </form>
    </nav>
  );
}
