/**
 * runAgentWorkflow — the AI-side orchestrator.
 *
 * Pure workflow logic. Knows nothing about the database, HTTP, or Telegram.
 * BE wraps this with:
 *   - reading attendees from Supabase
 *   - persisting matches/conversations to Supabase
 *   - mapping `onEvent` callbacks to `graph_events` table writes
 *
 * Flow (see ARCHITECTURE.md §7):
 *   1. scanning(start) → rankMatches → scanning(end)
 *   2. for each candidate, in parallel:
 *        contacting(start) → simulateConversation
 *      → negotiating(start) → findAvailabilityOverlap
 *      → if should_meet: summarizeMatch → matched
 *        else:                            rejected
 *   3. return sorted matches
 */

import type {
  AvailabilitySlot,
  Conversation,
  MatchSummary,
  Profile,
} from "@/lib/gemini/types";
import {
  rankMatches,
  type AttendeeForRanking,
} from "@/lib/gemini/prompts/rankMatches";
import { simulateConversation } from "@/lib/gemini/prompts/simulateConversation";
import { summarizeMatch } from "@/lib/gemini/prompts/summarizeMatch";

// ---------- Types ----------

export interface AttendeeForWorkflow extends AttendeeForRanking {
  availability?: AvailabilitySlot[];
}

export type WorkflowEvent =
  | { type: "scanning"; status: "start" | "end" }
  | { type: "contacting"; status: "start" | "end"; targetId: string }
  | { type: "negotiating"; status: "start" | "end"; targetId: string }
  | { type: "matched"; targetId: string; score: number }
  | { type: "rejected"; targetId: string }
  | { type: "scheduled"; targetId: string; proposed_time: string };

export interface AgentWorkflowMatch {
  target: AttendeeForWorkflow;
  score: number;
  reason: string;
  shared_interests: string[];
  conversation: Conversation;
  summary: MatchSummary | null;
  proposed_time: string | null;
  should_meet: boolean;
}

export interface AgentWorkflowInput {
  userProfile: Profile;
  userAvailability: AvailabilitySlot[];
  attendees: AttendeeForWorkflow[];
  /** Max candidates to consider after ranking. Default 5. */
  topN?: number;
  /** Hook for emitting graph events to the dashboard. */
  onEvent?: (event: WorkflowEvent) => void | Promise<void>;
}

export interface AgentWorkflowResult {
  matches: AgentWorkflowMatch[];
}

// ---------- Scheduling (deterministic JS, no LLM) ----------

/**
 * Find the earliest overlapping window of at least `minMinutes` between two
 * sets of availability slots. Returns ISO start timestamp or null if no fit.
 */
export function findAvailabilityOverlap(
  a: AvailabilitySlot[],
  b: AvailabilitySlot[],
  minMinutes = 30,
): string | null {
  const minMs = minMinutes * 60_000;

  const candidates: Array<{ start: number; end: number }> = [];
  for (const sa of a) {
    const aStart = Date.parse(sa.start);
    const aEnd = Date.parse(sa.end);
    if (Number.isNaN(aStart) || Number.isNaN(aEnd)) continue;
    for (const sb of b) {
      const bStart = Date.parse(sb.start);
      const bEnd = Date.parse(sb.end);
      if (Number.isNaN(bStart) || Number.isNaN(bEnd)) continue;
      const start = Math.max(aStart, bStart);
      const end = Math.min(aEnd, bEnd);
      if (end - start >= minMs) {
        candidates.push({ start, end });
      }
    }
  }

  if (candidates.length === 0) return null;
  candidates.sort((x, y) => x.start - y.start);
  return new Date(candidates[0]!.start).toISOString();
}

// ---------- Orchestrator ----------

export async function runAgentWorkflow(
  input: AgentWorkflowInput,
): Promise<AgentWorkflowResult> {
  const {
    userProfile,
    userAvailability,
    attendees,
    topN = 5,
    onEvent = () => {},
  } = input;

  const emit = async (event: WorkflowEvent): Promise<void> => {
    try {
      await onEvent(event);
    } catch (err) {
      console.error("[orchestrator] onEvent threw:", err);
    }
  };

  // 1. Rank
  await emit({ type: "scanning", status: "start" });
  const ranked = await rankMatches({
    profile: userProfile,
    attendees,
    topN,
  });
  await emit({ type: "scanning", status: "end" });

  const attendeesById = new Map(attendees.map((a) => [a.id, a]));

  // 2. Per-candidate: simulate + schedule + (maybe) summarize, in parallel
  const candidateResults = await Promise.all(
    ranked.matches.map(async (rm): Promise<AgentWorkflowMatch | null> => {
      const target = attendeesById.get(rm.attendee_id);
      if (!target) {
        console.warn(
          `[orchestrator] rankMatches returned unknown attendee_id=${rm.attendee_id}`,
        );
        return null;
      }

      await emit({ type: "contacting", status: "start", targetId: target.id });

      const convo = await simulateConversation({
        userProfile,
        target,
        matchReason: rm.reason,
      });

      await emit({ type: "contacting", status: "end", targetId: target.id });
      await emit({
        type: "negotiating",
        status: "start",
        targetId: target.id,
      });

      const proposed = findAvailabilityOverlap(
        userAvailability,
        target.availability ?? [],
      );

      if (proposed) {
        await emit({
          type: "scheduled",
          targetId: target.id,
          proposed_time: proposed,
        });
      }

      let summary: MatchSummary | null = null;
      if (convo.should_meet) {
        summary = await summarizeMatch({
          userProfile,
          target,
          rankScore: rm.score,
          rankReason: rm.reason,
          conversation: convo,
          proposedTime: proposed,
        });
      }

      await emit({
        type: "negotiating",
        status: "end",
        targetId: target.id,
      });

      if (convo.should_meet) {
        await emit({
          type: "matched",
          targetId: target.id,
          score: rm.score,
        });
      } else {
        await emit({ type: "rejected", targetId: target.id });
      }

      return {
        target,
        score: rm.score,
        reason: rm.reason,
        shared_interests: rm.shared_interests,
        conversation: convo,
        summary,
        proposed_time: proposed,
        should_meet: convo.should_meet,
      };
    }),
  );

  const matches = candidateResults
    .filter((m): m is AgentWorkflowMatch => m !== null)
    .sort((a, b) => b.score - a.score);

  return { matches };
}
