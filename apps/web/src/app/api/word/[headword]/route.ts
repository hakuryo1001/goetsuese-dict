import { NextResponse } from "next/server";
import { resolveWord } from "@/lib/lookup";
import { lookupReadingsForHeadword } from "@/lib/readings";

export async function GET(
  _request: Request,
  context: { params: Promise<{ headword: string }> },
) {
  const { headword } = await context.params;
  let decoded = headword;
  try {
    decoded = decodeURIComponent(headword);
  } catch {
    decoded = headword;
  }
  const resolved = await resolveWord(decoded);
  const readingGroups = await lookupReadingsForHeadword(
    resolved?.canonicalHeadword || decoded,
  );
  if (!resolved && !readingGroups.length) {
    return NextResponse.json(
      {
        success: false,
        error: "詞條不存在",
        canonical_headword: null,
        total: 0,
        entries: [],
        readings: [],
      },
      { status: 404 },
    );
  }
  return NextResponse.json({
    success: true,
    canonical_headword: resolved?.canonicalHeadword || decoded,
    total: resolved?.entries.length || 0,
    entries: resolved?.entries || [],
    readings: readingGroups,
  });
}
