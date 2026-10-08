import { NextRequest, NextResponse } from "next/server";
import { resolveSearchLanding } from "@/lib/search";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") || "";
  const reverse = request.nextUrl.searchParams.get("mode") === "reverse";
  const result = await resolveSearchLanding(q, reverse);
  return NextResponse.json(result);
}
