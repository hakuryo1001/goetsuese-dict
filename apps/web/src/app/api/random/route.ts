import { NextRequest, NextResponse } from "next/server";
import { randomEntries } from "@/lib/lookup";

export async function GET(request: NextRequest) {
  const count = Math.min(
    Math.max(1, Number(request.nextUrl.searchParams.get("count") || 3)),
    20,
  );
  const entries = await randomEntries(count);
  return NextResponse.json({ success: true, entries });
}
