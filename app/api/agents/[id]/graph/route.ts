import { jsonError, jsonOk } from "@/lib/api/response";
import { buildGraphResponse } from "@/lib/db/graph";
import {
  getAgentWithAttendee,
  getAttendeesByIds,
  listGraphEvents,
  listMatchesForAgent,
} from "@/lib/db/queries";
import type { Attendee } from "@/lib/db/types";

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

  const [events, matches] = await Promise.all([
    listGraphEvents(id),
    listMatchesForAgent(id),
  ]);

  const targetIds = new Set<string>();
  for (const m of matches) targetIds.add(m.target_id);
  for (const e of events) {
    if (e.target_node_id) targetIds.add(e.target_node_id);
  }

  const attendees = await getAttendeesByIds([...targetIds]);
  const attendeesById = new Map<string, Attendee>(
    attendees.map((a) => [a.id, a]),
  );

  const graph = buildGraphResponse({
    agentId: agent.id,
    agentStatus: agent.status,
    centerLabel: agent.attendee.name,
    events,
    matches,
    attendeesById,
  });

  return jsonOk(graph);
}
