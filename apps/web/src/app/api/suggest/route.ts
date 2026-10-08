import { NextRequest, NextResponse } from "next/server";
import { suggestHeadwords } from "@/lib/lookup";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") || "";
  const limit = Number(request.nextUrl.searchParams.get("limit") || 10);
  const suggestions = await suggestHeadwords(q, limit);
  return NextResponse.json({
    success: true,
    query: q,
    total: suggestions.length,
    suggestions,
  });
}
