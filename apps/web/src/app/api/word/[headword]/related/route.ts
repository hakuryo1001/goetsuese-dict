import { NextRequest, NextResponse } from "next/server";
import { relatedWords } from "@/lib/lookup";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ headword: string }> },
) {
  const { headword } = await context.params;
  const limit = Number(request.nextUrl.searchParams.get("limit") || 8);
  const groups = await relatedWords(decodeURIComponent(headword), limit);
  return NextResponse.json({ success: true, groups });
}
