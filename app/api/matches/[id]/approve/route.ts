import { jsonError, jsonOk } from "@/lib/api/response";
import { updateMatchStatus } from "@/lib/db/queries";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(
  _request: Request,
  context: RouteContext,
): Promise<Response> {
  const { id } = await context.params;
  const match = await updateMatchStatus(id, "approved");
  if (!match) {
    return jsonError("Match not found", 404);
  }
  return jsonOk({ ok: true, id, status: "approved" as const });
}
