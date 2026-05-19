import { jsonError, jsonOk } from "@/lib/api/response";
import { getAgentWithAttendee } from "@/lib/db/queries";
import type { AgentStatus } from "@/lib/db/types";
import { runAgentNetworking } from "@/lib/orchestrator/run";

export const runtime = "nodejs";

const RUNNING: AgentStatus[] = ["scanning", "contacting", "negotiating"];

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(
  _request: Request,
  context: RouteContext,
): Promise<Response> {
  const { id } = await context.params;

  const agent = await getAgentWithAttendee(id);
  if (!agent) {
    return jsonError("Agent not found", 404);
  }

  if (RUNNING.includes(agent.status)) {
    return jsonError("Workflow already running", 409);
  }

  void runAgentNetworking(id).catch((err) => {
    console.error(`[orchestrator] agent ${id}:`, err);
  });

  return jsonOk({ started: true, agentId: id }, 202);
}
