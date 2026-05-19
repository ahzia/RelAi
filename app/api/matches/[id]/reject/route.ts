import { NextResponse } from "next/server";
import { updateMatchStatus } from "@/lib/db/matches";

export const runtime = "nodejs";

export async function POST(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const result = await updateMatchStatus(id, "rejected");

  if (!result) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, ...result });
}
