"use client";

import { useState } from "react";
import { AppHeader, RedDotDivider, SiteFooter } from "@/components/chrome";
import { useI18n } from "@/lib/i18n";
import Link from "next/link";

export default function AboutPage() {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  return (
    <div>
      <AppHeader query={query} onQueryChange={setQuery} />
      <main id="main-content" className="max-w-3xl mx-auto px-6 py-12 font-cjk-ui">
        <h1 className="font-headline text-4xl">{t("about.title")}</h1>
        <RedDotDivider />
        <p className="text-lg mb-8">{t("about.subtitle")}</p>
        <h2 className="font-headline text-2xl mb-3">{t("about.missionTitle")}</h2>
        <p className="mb-3">{t("about.missionP1")}</p>
        <p className="mb-8">{t("about.missionP2")}</p>
        <h2 className="font-headline text-2xl mb-3">{t("about.tech.title")}</h2>
        <p className="mb-8">
          Next.js App Router · JSON dictionaries on disk · Goetsusioji from ngven
        </p>
        <Link href="/" className="text-kapok">
          {t("about.backHome")}
        </Link>
      </main>
      <SiteFooter />
    </div>
  );
}
