import type {
  AgentStatus,
  Attendee,
  GraphEvent,
  GraphEventType,
  GraphNodeStatus,
  GraphResponse,
  MatchWithTarget,
} from "@/lib/db/types";

const EDGE_TYPES = new Set<GraphEventType>([
  "scanning",
  "contacting",
  "negotiating",
  "matched",
  "rejected",
]);

function agentStatusToNodeStatus(status: AgentStatus): GraphNodeStatus {
  if (status === "done") return "idle";
  if (status === "cancelled") return "idle";
  return status;
}

function eventTypeToNodeStatus(type: GraphEventType): GraphNodeStatus {
  if (type === "scheduled") return "matched";
  return type;
}

function latestEventPerTarget(events: GraphEvent[]): Map<string, GraphEvent> {
  const map = new Map<string, GraphEvent>();
  for (const e of events) {
    if (!e.target_node_id) continue;
    map.set(e.target_node_id, e);
  }
  return map;
}

function matchScoreByTarget(matches: MatchWithTarget[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const m of matches) {
    const prev = map.get(m.target_id);
    if (prev === undefined || m.score > prev) {
      map.set(m.target_id, m.score);
    }
  }
  return map;
}

function matchStatusToNodeStatus(
  status: MatchWithTarget["status"],
): GraphNodeStatus | null {
  if (status === "approved") return "matched";
  if (status === "rejected") return "rejected";
  return null;
}

/**
 * Builds the React Flow payload from graph_events + matches.
 * See ARCHITECTURE.md §6 Graph response shape.
 */
export function buildGraphResponse(input: {
  agentId: string;
  agentStatus: AgentStatus;
  centerLabel: string;
  events: GraphEvent[];
  matches: MatchWithTarget[];
  attendeesById: Map<string, Attendee>;
}): GraphResponse {
  const { agentId, agentStatus, centerLabel, events, matches, attendeesById } =
    input;

  const scores = matchScoreByTarget(matches);
  const latestByTarget = latestEventPerTarget(events);

  const targetIds = new Set<string>();
  for (const m of matches) targetIds.add(m.target_id);
  for (const id of latestByTarget.keys()) targetIds.add(id);

  const nodes: GraphResponse["nodes"] = [
    {
      id: agentId,
      label: centerLabel,
      role: "center",
      status: agentStatusToNodeStatus(agentStatus),
    },
  ];

  for (const targetId of targetIds) {
    const attendee = attendeesById.get(targetId);
    const label = attendee?.name ?? "Attendee";
    const latest = latestByTarget.get(targetId);
    const match = matches.find((m) => m.target_id === targetId);

    let status: GraphNodeStatus = "idle";
    if (match) {
      status = matchStatusToNodeStatus(match.status) ?? status;
    }
    if (latest && status === "idle") {
      status = eventTypeToNodeStatus(latest.type);
    }
    if (latest?.type === "matched" || latest?.type === "rejected") {
      status = eventTypeToNodeStatus(latest.type);
    }

    nodes.push({
      id: targetId,
      label,
      role: "candidate",
      status,
      score: scores.get(targetId),
    });
  }

  const edges: GraphResponse["edges"] = [];

  for (const targetId of targetIds) {
    const targetEvents = events.filter((e) => e.target_node_id === targetId);
    const latest = targetEvents.at(-1);
    if (!latest || !EDGE_TYPES.has(latest.type)) continue;

    const edgeStatus = latest.type as GraphResponse["edges"][0]["status"];
    const animated =
      latest.status === "start" &&
      (edgeStatus === "contacting" || edgeStatus === "negotiating");

    edges.push({
      id: `${agentId}-${targetId}`,
      source: agentId,
      target: targetId,
      animated,
      status: edgeStatus,
    });
  }

  const scanning = events.find((e) => e.type === "scanning");
  if (scanning && edges.length === 0 && targetIds.size > 0) {
    const firstTarget = [...targetIds][0]!;
    edges.push({
      id: `${agentId}-scan`,
      source: agentId,
      target: firstTarget,
      animated: agentStatus === "scanning",
      status: "scanning",
    });
  }

  const activity = [...events]
    .filter((e) => e.message)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((e) => ({
      id: e.id,
      message: e.message!,
      created_at: e.created_at,
    }));

  return { nodes, edges, activity };
}
