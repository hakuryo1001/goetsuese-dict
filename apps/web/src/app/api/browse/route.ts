import { NextRequest, NextResponse } from "next/server";
import { browseHeadwords } from "@/lib/lookup";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const data = await browseHeadwords({
    page: Number(params.get("page") || 1),
    size: Number(params.get("size") || 100),
    dict: params.get("dict") || "all",
    sort: params.get("sort") === "ngven" ? "ngven" : "headword",
  });
  return NextResponse.json(data);
}
