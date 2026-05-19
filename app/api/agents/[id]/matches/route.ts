import { jsonError, jsonOk } from "@/lib/api/response";
import {
  getAgentWithAttendee,
  getConversationsByMatchIds,
  listMatchesForAgent,
} from "@/lib/db/queries";
import { getSeedMatches } from "@/lib/seed/mock-matches";
import { SEED_AGENT_ID } from "@/lib/seed/constants";
import type { MatchProposal, MatchesResponse } from "@/types/matches";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(
  _request: Request,
  context: RouteContext,
): Promise<Response> {
  const { id } = await context.params;

  const agent = await getAgentWithAttendee(id);
  if (!agent) {
    if (id === SEED_AGENT_ID) {
      return jsonOk<MatchesResponse>({ matches: getSeedMatches(id) });
    }
    return jsonError("Agent not found", 404);
  }

  const matches = await listMatchesForAgent(id);
  if (matches.length === 0 && id === SEED_AGENT_ID) {
    return jsonOk<MatchesResponse>({ matches: getSeedMatches(id) });
  }

  const conversations = await getConversationsByMatchIds(
    matches.map((m) => m.id),
  );
  const conversationByMatchId = new Map(
    conversations.map((c) => [c.match_id, c]),
  );

  const body: MatchesResponse = {
    matches: matches.slice(0, 10).map((m): MatchProposal => {
      const conv = conversationByMatchId.get(m.id);
      return {
        id: m.id,
        score: m.score,
        reason: m.reason ?? "",
        why_this_match_matters: conv?.summary ?? m.reason ?? "",
        proposed_time: m.proposed_time,
        status: m.status,
        target: {
          id: m.target.id,
          name: m.target.name,
          role: m.target.role,
          company: m.target.company ?? "",
        },
        conversation: conv?.messages_json,
      };
    }),
  };

  return jsonOk(body);
}
