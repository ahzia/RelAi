import { jsonError, jsonOk } from "@/lib/api/response";
import { rejectMatch } from "@/lib/services/match-action-service";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(
  _request: Request,
  context: RouteContext,
): Promise<Response> {
  const { id } = await context.params;
  const result = await rejectMatch(id);
  if (!result) {
    return jsonError("Match not found", 404);
  }
  return jsonOk(result);
}
