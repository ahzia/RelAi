import { NextResponse } from "next/server";
import type { AgentStatusResponse } from "@/lib/dashboard/types";
import { buildDemoStatus, isDemoAgentId } from "@/lib/seed/demo-dashboard";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse<AgentStatusResponse>> {
  const { id } = await context.params;

  if (isDemoAgentId(id)) {
    return NextResponse.json(buildDemoStatus(id));
  }

  const idle: AgentStatusResponse = {
    agent_id: id,
    status: "idle",
    user_name: "Your Agent",
    event_name: "AI Week Milan 2026",
    phase_label: "Waiting to start networking",
    counts: {
      attendees_scanned: 0,
      agents_contacted: 0,
      matches_found: 0,
      pending_approval: 0,
    },
    updated_at: new Date().toISOString(),
  };

  return NextResponse.json(idle);
}
