import { NextResponse } from "next/server";
import type { GraphResponse } from "@/lib/dashboard/types";
import { buildDemoGraph, isDemoAgentId } from "@/lib/seed/demo-dashboard";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse<GraphResponse>> {
  const { id } = await context.params;

  if (isDemoAgentId(id)) {
    return NextResponse.json(buildDemoGraph(id));
  }

  const empty: GraphResponse = {
    nodes: [
      {
        id: "center-agent",
        label: "Your Agent",
        role: "center",
        status: "idle",
      },
    ],
    edges: [],
    activity: [],
  };

  return NextResponse.json(empty);
}
