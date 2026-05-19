import { NextResponse } from "next/server";
import { startAgentNetworking } from "@/lib/services/agent-start-service";

export const runtime = "nodejs";

export async function POST(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  void startAgentNetworking({ agentId: id }).catch((err) => {
    console.error("[api/agents/start]", err);
  });

  return NextResponse.json({ ok: true, agentId: id, status: "started" });
}
