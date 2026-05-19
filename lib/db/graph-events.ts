import { getServerClient } from "./clients";
import type { WorkflowEvent } from "@/lib/orchestrator/workflow";

export async function deleteGraphEventsForAgent(agentId: string): Promise<void> {
  const supabase = getServerClient();
  const { error } = await supabase
    .from("graph_events")
    .delete()
    .eq("requester_id", agentId);

  if (error) throw new Error(`graph_events delete: ${error.message}`);
}

function defaultEventMessage(event: WorkflowEvent): string {
  switch (event.type) {
    case "scanning":
      return event.status === "start"
        ? "Scanning the event network…"
        : "Scan complete.";
    case "contacting":
      return event.status === "start"
        ? "Contacting attendee agent…"
        : "Contact round finished.";
    case "negotiating":
      return event.status === "start"
        ? "Negotiating availability…"
        : "Negotiation finished.";
    case "matched":
      return `Strong match found (score ${event.score}).`;
    case "rejected":
      return "Candidate declined — low mutual fit.";
    case "scheduled":
      return `Proposed meeting at ${event.proposed_time}.`;
    default:
      return "Agent activity";
  }
}

export async function insertGraphEvent(
  agentId: string,
  event: WorkflowEvent,
  message?: string,
): Promise<void> {
  const supabase = getServerClient();
  const targetId =
    "targetId" in event ? (event.targetId as string | undefined) : undefined;

  const { error } = await supabase.from("graph_events").insert({
    requester_id: agentId,
    type: event.type,
    source_node_id: agentId,
    target_node_id: targetId ?? null,
    status:
      event.type === "scanning"
        ? event.status
        : "status" in event
          ? event.status
          : "start",
    message: message ?? defaultEventMessage(event),
  });

  if (error) throw new Error(`graph_events insert: ${error.message}`);
}
