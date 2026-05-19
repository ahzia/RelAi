import { jsonError, jsonOk } from "@/lib/api/response";
import {
  countMatchesForAgent,
  getAgentWithAttendee,
  listGraphEvents,
} from "@/lib/db/queries";
import type { AgentStatusResponse } from "@/lib/db/types";

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

  const [matchCounts, events] = await Promise.all([
    countMatchesForAgent(id),
    listGraphEvents(id),
  ]);

  const body: AgentStatusResponse = {
    agentId: agent.id,
    status: agent.status,
    attendeeName: agent.attendee.name,
    networkingGoal: agent.networking_goal,
    matchCount: matchCounts.total,
    pendingMatchCount: matchCounts.pending,
    eventCount: events.length,
  };

  return jsonOk(body);
}
