/**
 * HTTP entry shim — delegates to agent-start-service.
 */

import { startAgentNetworking } from "@/lib/services/agent-start-service";

export { startAgentNetworking } from "@/lib/services/agent-start-service";
export { startDemoNetworking } from "@/lib/services/agent-start-service";

/** Used by POST /api/agents/:id/start */
export async function runAgentNetworking(agentId: string): Promise<void> {
  await startAgentNetworking({ agentId });
}
