import { NextResponse } from "next/server";
import { getCatalog } from "@/lib/catalog";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const catalog = await getCatalog();
  const entry = catalog.byId.get(id) || null;
  if (!entry) {
    return NextResponse.json(
      { success: false, error: "詞條不存在", entry: null },
      { status: 404 },
    );
  }
  return NextResponse.json({ success: true, entry });
}
