import { NextResponse } from "next/server";
import { getCatalog } from "@/lib/catalog";

export async function GET() {
  const catalog = await getCatalog();
  return NextResponse.json({
    success: true,
    total_entries: catalog.entries.length,
    dictionaries: catalog.dictionaries,
  });
}
