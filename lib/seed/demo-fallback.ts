/**
 * Scripted networking workflow for demos (Phase 2).
 * Writes graph_events incrementally so the dashboard animates on poll.
 */

import {
  deleteGraphEventsForAgent,
  getAgentWithAttendee,
  getAgentStatus,
  getAttendeesByIds,
  insertMatchesWithConversations,
  listAttendees,
  listMatchesForAgent,
  updateAgentStatus,
} from "@/lib/db/queries";
import { persistWorkflowEvent } from "@/lib/orchestrator/persist-event";
import {
  SEED_MATCH_TARGET_IDS,
  SEED_REJECTED_TARGET_IDS,
  SEED_ROSTER_COMPANY,
} from "@/lib/seed/constants";
import { buildDemoMatches } from "@/lib/seed/seed-agent";

const STEP_MS = Number(process.env.DEMO_STEP_MS ?? 800);

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function isCancelled(agentId: string): Promise<boolean> {
  const status = await getAgentStatus(agentId);
  return status === "cancelled";
}

type Candidate = { id: string; name: string };

async function resolveCandidates(
  agentId: string,
  attendeeId: string,
): Promise<{ matched: Candidate[]; rejected: Candidate[]; rosterSize: number }> {
  const roster = await listAttendees();
  const pool = roster.filter(
    (a) => a.id !== attendeeId && a.company === SEED_ROSTER_COMPANY,
  );
  const rosterSize = pool.length || roster.length - 1;

  const matchIds = [...SEED_MATCH_TARGET_IDS];
  const rejectIds = [...SEED_REJECTED_TARGET_IDS];
  const allIds = [...matchIds, ...rejectIds];
  const byId = new Map(
    (await getAttendeesByIds(allIds)).map((a) => [a.id, a]),
  );

  const matched = matchIds
    .map((id) => byId.get(id))
    .filter((a): a is NonNullable<typeof a> => !!a)
    .map((a) => ({ id: a.id, name: a.name }));

  const rejected = rejectIds
    .map((id) => byId.get(id))
    .filter((a): a is NonNullable<typeof a> => !!a)
    .map((a) => ({ id: a.id, name: a.name }));

  if (matched.length >= 2) {
    return { matched, rejected, rosterSize };
  }

  const idSet = new Set<string>(allIds);
  const others = pool.filter((a) => !idSet.has(a.id)).slice(0, 8);

  return {
    matched: others.slice(0, 3).map((a) => ({ id: a.id, name: a.name })),
    rejected: others.slice(3, 5).map((a) => ({ id: a.id, name: a.name })),
    rosterSize,
  };
}

/**
 * Replays a believable agent workflow with paced graph_events.
 * Safe to call multiple times — clears prior events for this agent first.
 */
export async function runDemoFallback(agentId: string): Promise<void> {
  const agent = await getAgentWithAttendee(agentId);
  if (!agent) {
    throw new Error(`Agent not found: ${agentId}`);
  }

  const { matched, rejected, rosterSize } = await resolveCandidates(
    agentId,
    agent.attendee_id,
  );

  await updateAgentStatus(agentId, "scanning");
  await deleteGraphEventsForAgent(agentId);

  try {
    await persistWorkflowEvent(
      agentId,
      { type: "scanning", status: "start" },
      `Scanning ${rosterSize} attendees at AI Week Milan…`,
    );
    await sleep(STEP_MS);
    if (await isCancelled(agentId)) return;

    await persistWorkflowEvent(
      agentId,
      { type: "scanning", status: "end" },
      `Shortlisted ${matched.length + rejected.length} candidates for agent-to-agent evaluation.`,
    );
    await sleep(STEP_MS);
    if (await isCancelled(agentId)) return;

    for (const target of matched) {
      await updateAgentStatus(agentId, "contacting");

      await persistWorkflowEvent(
        agentId,
        { type: "contacting", status: "start", targetId: target.id },
        `Contacting ${target.name}'s agent…`,
      );
      await sleep(STEP_MS);
      if (await isCancelled(agentId)) return;

      await updateAgentStatus(agentId, "negotiating");
      await persistWorkflowEvent(
        agentId,
        { type: "negotiating", status: "start", targetId: target.id },
        `Negotiating meeting slot with ${target.name}'s agent.`,
      );
      await sleep(STEP_MS);
      if (await isCancelled(agentId)) return;

      await persistWorkflowEvent(agentId, {
        type: "scheduled",
        targetId: target.id,
        proposed_time: "2026-05-19T14:00:00.000Z",
      });
      await sleep(STEP_MS / 2);

      const score = 88 + Math.floor(Math.random() * 8);
      await persistWorkflowEvent(
        agentId,
        { type: "matched", targetId: target.id, score },
        `Strong match confirmed with ${target.name}.`,
      );
      await sleep(STEP_MS);
      if (await isCancelled(agentId)) return;
    }

    for (const target of rejected) {
      await updateAgentStatus(agentId, "contacting");
      await persistWorkflowEvent(
        agentId,
        { type: "contacting", status: "start", targetId: target.id },
        `Contacting ${target.name}'s agent…`,
      );
      await sleep(STEP_MS);
      if (await isCancelled(agentId)) return;

      await persistWorkflowEvent(
        agentId,
        { type: "rejected", targetId: target.id },
        `Low mutual fit with ${target.name} — skipping.`,
      );
      await sleep(STEP_MS);
      if (await isCancelled(agentId)) return;
    }

    const existing = await listMatchesForAgent(agentId);
    if (existing.length === 0) {
      await insertMatchesWithConversations(
        buildDemoMatches(agentId).map((m) => ({
          requester_id: m.requester_id,
          target_id: m.target_id,
          score: m.score,
          reason: m.reason,
          status: m.status,
          proposed_time: m.proposed_time,
          conversation: m.conversation,
        })),
      );
    }
  } finally {
    const finalStatus = await getAgentStatus(agentId);
    if (finalStatus !== "cancelled") {
      await updateAgentStatus(agentId, "done");
    }
  }
}
