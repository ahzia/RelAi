import { jsonError, jsonOk } from "@/lib/api/response";
import {
  getAgentWithAttendee,
  getConversationsByMatchIds,
  listMatchesForAgent,
} from "@/lib/db/queries";
import type { MatchCardResponse } from "@/lib/db/types";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(
  _request: Request,
  context: RouteContext,
): Promise<Response> {
  const { id } = await context.params;

  const agent = await getAgentWithAttendee(id);
  if (!agent) {
    return jsonError("Agent not found", 404);
  }

  const matches = await listMatchesForAgent(id);
  const conversations = await getConversationsByMatchIds(
    matches.map((m) => m.id),
  );
  const summaryByMatchId = new Map(
    conversations.map((c) => [c.match_id, c.summary]),
  );

  const body: MatchCardResponse[] = matches.slice(0, 10).map((m) => ({
    id: m.id,
    score: m.score,
    reason: m.reason,
    status: m.status,
    proposed_time: m.proposed_time,
    target: {
      id: m.target.id,
      name: m.target.name,
      role: m.target.role,
      company: m.target.company,
    },
    summary: summaryByMatchId.get(m.id) ?? null,
  }));

  return jsonOk(body);
}
