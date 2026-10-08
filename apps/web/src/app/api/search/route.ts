import { NextRequest, NextResponse } from "next/server";
import { searchEntries } from "@/lib/search";
import type { EntryType } from "@/lib/dictionary-types";
import type { SearchSortOption } from "@/lib/search-result-groups";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const q = params.get("q") || "";
  const result = await searchEntries({
    q,
    limit: Number(params.get("limit") || 100),
    offset: Number(params.get("offset") || 0),
    dict: params.get("dict") || undefined,
    dialect: params.get("dialect") || undefined,
    type: (params.get("type") as EntryType | null) || undefined,
    sort: (params.get("sort") as SearchSortOption | null) || "relevance",
    mode: params.get("mode") === "reverse" ? "reverse" : "normal",
  });
  return NextResponse.json(result);
}
