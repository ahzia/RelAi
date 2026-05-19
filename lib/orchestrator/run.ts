/**
 * DB-backed orchestrator — loads Supabase data, runs runAgentWorkflow,
 * persists graph_events + matches (ARCHITECTURE.md §7).
 */

import type { AvailabilitySlot, Profile } from "@/lib/gemini/types";
import {
  deleteGraphEventsForAgent,
  deleteMatchesForAgent,
  getAgentStatus,
  getAgentWithAttendee,
  insertMatchesWithConversations,
  listAttendees,
  updateAgentStatus,
} from "@/lib/db/queries";
import type { AgentWithAttendee, Attendee } from "@/lib/db/types";
import { persistWorkflowEvent } from "@/lib/orchestrator/persist-event";
import {
  runAgentWorkflow,
  type AttendeeForWorkflow,
  type WorkflowEvent,
} from "@/lib/orchestrator/workflow";
import { SEED_ROSTER_COMPANY } from "@/lib/seed/constants";
import { runDemoFallback } from "@/lib/seed/demo-fallback";

const DEMO_USER_COMPANY = "RelAI Demo User";
const TOP_N = 5;
const MAX_MATCHES_TO_SAVE = 3;

function profileFromAgent(agent: AgentWithAttendee): Profile {
  const persona = agent.persona as Partial<Profile>;
  const constraints = agent.constraints as {
    availability?: AvailabilitySlot[];
    ideal_matches?: string[];
  };

  return {
    name: persona.name ?? agent.attendee.name,
    role: persona.role ?? agent.attendee.role,
    company: persona.company ?? agent.attendee.company ?? "",
    interests:
      persona.interests?.length ? persona.interests : agent.attendee.interests,
    networking_goal:
      agent.networking_goal ??
      persona.networking_goal ??
      agent.attendee.goals ??
      "",
    ideal_matches: persona.ideal_matches ?? constraints.ideal_matches ?? [],
    availability:
      persona.availability?.length
        ? persona.availability
        : (constraints.availability as AvailabilitySlot[]) ??
          (agent.attendee.availability as AvailabilitySlot[]) ??
          [],
  };
}

function toWorkflowAttendee(a: Attendee): AttendeeForWorkflow {
  return {
    id: a.id,
    name: a.name,
    role: a.role,
    company: a.company,
    bio: a.bio,
    interests: a.interests,
    goals: a.goals,
    availability: a.availability as AvailabilitySlot[],
  };
}

function poolAttendees(agent: AgentWithAttendee, all: Attendee[]): AttendeeForWorkflow[] {
  return all
    .filter(
      (a) =>
        a.id !== agent.attendee_id &&
        a.company !== DEMO_USER_COMPANY,
    )
    .map(toWorkflowAttendee);
}

async function isCancelled(agentId: string): Promise<boolean> {
  return (await getAgentStatus(agentId)) === "cancelled";
}

async function applyStatusFromEvent(
  agentId: string,
  event: WorkflowEvent,
): Promise<void> {
  if (event.type === "scanning" && event.status === "start") {
    await updateAgentStatus(agentId, "scanning");
  } else if (event.type === "contacting" && event.status === "start") {
    await updateAgentStatus(agentId, "contacting");
  } else if (event.type === "negotiating" && event.status === "start") {
    await updateAgentStatus(agentId, "negotiating");
  }
}

function eventMessage(
  event: WorkflowEvent,
  names: Map<string, string>,
  rosterSize: number,
): string | undefined {
  switch (event.type) {
    case "scanning":
      return event.status === "start"
        ? `Scanning ${rosterSize} attendees at AI Week Milan…`
        : "Shortlisted top candidates for agent-to-agent evaluation.";
    case "contacting": {
      const n = names.get(event.targetId) ?? "attendee";
      return event.status === "start"
        ? `Contacting ${n}'s agent…`
        : `Finished outreach to ${n}'s agent.`;
    }
    case "negotiating": {
      const n = names.get(event.targetId) ?? "attendee";
      return event.status === "start"
        ? `Negotiating meeting slot with ${n}'s agent.`
        : `Negotiation with ${n}'s agent complete.`;
    }
    case "scheduled": {
      const n = names.get(event.targetId) ?? "attendee";
      return `Proposed meeting time with ${n}.`;
    }
    case "matched": {
      const n = names.get(event.targetId) ?? "attendee";
      return `Strong match confirmed with ${n} (score ${event.score}%).`;
    }
    case "rejected": {
      const n = names.get(event.targetId) ?? "attendee";
      return `Low mutual fit with ${n} — skipping.`;
    }
    default:
      return undefined;
  }
}

/**
 * Full Gemini workflow with DB writes. Clears prior graph_events and matches.
 */
export async function runAgentWorkflowFromDb(agentId: string): Promise<void> {
  const agent = await getAgentWithAttendee(agentId);
  if (!agent) {
    throw new Error(`Agent not found: ${agentId}`);
  }

  if (await isCancelled(agentId)) return;

  const allAttendees = await listAttendees();
  const candidates = poolAttendees(agent, allAttendees);
  const rosterSize =
    candidates.filter((a) => a.company === SEED_ROSTER_COMPANY).length ||
    candidates.length;

  if (candidates.length === 0) {
    throw new Error("No attendees available to match against");
  }

  const userProfile = profileFromAgent(agent);
  const userAvailability = userProfile.availability;

  await updateAgentStatus(agentId, "scanning");
  await deleteGraphEventsForAgent(agentId);
  await deleteMatchesForAgent(agentId);

  const names = new Map(candidates.map((a) => [a.id, a.name]));

  try {
    const result = await runAgentWorkflow({
      userProfile,
      userAvailability,
      attendees: candidates,
      topN: TOP_N,
      onEvent: async (event) => {
        if (await isCancelled(agentId)) return;
        await applyStatusFromEvent(agentId, event);
        await persistWorkflowEvent(
          agentId,
          event,
          eventMessage(event, names, rosterSize),
        );
      },
    });

    if (await isCancelled(agentId)) return;

    const toSave = result.matches
      .filter((m) => m.should_meet)
      .slice(0, MAX_MATCHES_TO_SAVE);

    if (toSave.length > 0) {
      await insertMatchesWithConversations(
        toSave.map((m) => ({
          requester_id: agentId,
          target_id: m.target.id,
          score: m.score,
          reason: m.reason,
          proposed_time: m.proposed_time,
          status: "pending",
          conversation: {
            messages_json: m.conversation.conversation,
            summary:
              m.summary?.why_this_match_matters ??
              m.summary?.summary ??
              m.reason,
          },
        })),
      );
    }
  } finally {
    const final = await getAgentStatus(agentId);
    if (final !== "cancelled") {
      await updateAgentStatus(agentId, "done");
    }
  }
}

/**
 * Entry point for POST /api/agents/:id/start.
 * Respects USE_DEMO_FALLBACK; falls back to scripted demo on Gemini failure.
 */
export async function runAgentNetworking(agentId: string): Promise<void> {
  if (process.env.USE_DEMO_FALLBACK === "true") {
    await runDemoFallback(agentId);
    return;
  }

  try {
    await runAgentWorkflowFromDb(agentId);
  } catch (err) {
    console.error(`[orchestrator] agent ${agentId} failed, running demo fallback:`, err);
    await runDemoFallback(agentId);
  }
}
