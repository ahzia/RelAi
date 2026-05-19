/**
 * Maps orchestrator WorkflowEvents → graph_events rows (ARCHITECTURE.md §5).
 * Shared by demo-fallback and the real workflow runner (Phase 4).
 */

import { insertGraphEvents } from "@/lib/db/queries";
import type { WorkflowEvent } from "@/lib/orchestrator/workflow";

export async function persistWorkflowEvent(
  agentId: string,
  event: WorkflowEvent,
  message?: string,
): Promise<void> {
  const base = {
    requester_id: agentId,
    source_node_id: agentId,
  };

  switch (event.type) {
    case "scanning":
      await insertGraphEvents([
        {
          ...base,
          type: "scanning",
          status: event.status,
          message:
            message ??
            (event.status === "start"
              ? "Scanning the event network…"
              : "Shortlisted top candidates for evaluation."),
        },
      ]);
      break;

    case "contacting":
      await insertGraphEvents([
        {
          ...base,
          type: "contacting",
          target_node_id: event.targetId,
          status: event.status,
          message: message ?? `Contacting attendee agent (${event.status})…`,
        },
      ]);
      break;

    case "negotiating":
      await insertGraphEvents([
        {
          ...base,
          type: "negotiating",
          target_node_id: event.targetId,
          status: event.status,
          message:
            message ??
            (event.status === "start"
              ? "Negotiating meeting slot…"
              : "Negotiation complete."),
        },
      ]);
      break;

    case "scheduled":
      await insertGraphEvents([
        {
          ...base,
          type: "scheduled",
          target_node_id: event.targetId,
          status: "end",
          message:
            message ??
            `Proposed meeting at ${new Date(event.proposed_time).toLocaleString("en-GB", { timeZone: "Europe/Rome", hour: "2-digit", minute: "2-digit" })}`,
        },
      ]);
      break;

    case "matched":
      await insertGraphEvents([
        {
          ...base,
          type: "matched",
          target_node_id: event.targetId,
          status: "end",
          message:
            message ??
            `Strong match confirmed (score ${event.score}%).`,
        },
      ]);
      break;

    case "rejected":
      await insertGraphEvents([
        {
          ...base,
          type: "rejected",
          target_node_id: event.targetId,
          status: "end",
          message: message ?? "Low mutual fit — skipping.",
        },
      ]);
      break;

    default:
      break;
  }
}
