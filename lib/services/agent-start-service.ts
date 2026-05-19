/**
 * Single entry point for agent networking (Telegram + HTTP POST /start).
 */

import {
  getAgentById,
  getAgentStatus,
  updateAgentStatus,
  type AgentStatus,
} from "@/lib/db/agents";
import { listAttendeesForMatching } from "@/lib/db/attendees";
import {
  deleteGraphEventsForAgent,
  insertGraphEvent,
} from "@/lib/db/graph-events";
import {
  deleteMatchesForAgent,
  insertMatchRecord,
  listPendingMatchesForAgent,
} from "@/lib/db/matches";
import {
  runAgentWorkflow,
  type AgentWorkflowMatch,
  type WorkflowEvent,
} from "@/lib/orchestrator/workflow";
import { runDemoFallback } from "@/lib/seed/demo-fallback";
import { getBot } from "@/lib/telegram/bot";
import {
  sendDashboardLink,
  sendMatchResults,
  sendPlainMessage,
} from "@/lib/telegram/notify";

const RUNNING: AgentStatus[] = ["scanning", "contacting", "negotiating"];

export interface StartAgentOptions {
  agentId: string;
  notifyChatId?: number;
  topN?: number;
}

async function isCancelled(agentId: string): Promise<boolean> {
  return (await getAgentStatus(agentId)) === "cancelled";
}

function eventMessage(
  event: WorkflowEvent,
  names: Map<string, string>,
  rosterSize: number,
): string {
  switch (event.type) {
    case "scanning":
      return event.status === "start"
        ? `Scanning ${rosterSize} attendees at AI Week Milan…`
        : "Shortlisted top candidates for evaluation.";
    case "contacting": {
      const n = names.get(event.targetId) ?? "attendee";
      return event.status === "start"
        ? `Contacting ${n}'s agent…`
        : `Finished outreach to ${n}'s agent.`;
    }
    case "negotiating": {
      const n = names.get(event.targetId) ?? "attendee";
      return event.status === "start"
        ? `Negotiating with ${n}'s agent…`
        : `Negotiation complete.`;
    }
    case "scheduled": {
      const n = names.get(event.targetId) ?? "attendee";
      return `Proposed meeting time with ${n}.`;
    }
    case "matched": {
      const n = names.get(event.targetId) ?? "attendee";
      return `Strong match with ${n} (score ${event.score}%).`;
    }
    case "rejected": {
      const n = names.get(event.targetId) ?? "attendee";
      return `Low mutual fit with ${n} — skipping.`;
    }
    default:
      return "Agent activity";
  }
}

async function persistWorkflowMatches(
  agentId: string,
  workflowMatches: AgentWorkflowMatch[],
): Promise<void> {
  const toPersist = workflowMatches
    .filter((m) => m.should_meet)
    .slice(0, 3);

  for (const m of toPersist) {
    await insertMatchRecord({
      requesterId: agentId,
      targetId: m.target.id,
      score: m.score,
      reason: m.reason,
      proposedTime: m.proposed_time,
      messagesJson: m.conversation.conversation,
      summary:
        m.summary?.why_this_match_matters ??
        m.summary?.summary ??
        m.reason,
    });
  }
}

async function runGeminiWorkflow(options: StartAgentOptions): Promise<void> {
  const { agentId, notifyChatId, topN = 5 } = options;

  const agent = await getAgentById(agentId);
  if (!agent) {
    throw new Error(`Agent not found: ${agentId}`);
  }

  if (await isCancelled(agentId)) return;

  const userProfile = agent.persona;
  const userAvailability =
    agent.constraints.availability ?? userProfile.availability ?? [];

  const attendees = await listAttendeesForMatching(agent.attendee_id);
  if (attendees.length === 0) {
    throw new Error("No attendees available to match against");
  }

  const names = new Map(attendees.map((a) => [a.id, a.name]));
  const rosterSize = attendees.length;

  await updateAgentStatus(agentId, "scanning");
  await deleteGraphEventsForAgent(agentId);
  await deleteMatchesForAgent(agentId);

  if (notifyChatId) {
    const bot = getBot();
    await sendPlainMessage(
      bot,
      notifyChatId,
      "I'll now scan the event network and talk to other attendee agents.",
    );
    await sendDashboardLink(bot, notifyChatId, agentId);
  }

  const result = await runAgentWorkflow({
    userProfile,
    userAvailability,
    attendees,
    topN,
    onEvent: async (event) => {
      if (await isCancelled(agentId)) return;

      if (event.type === "scanning" && event.status === "start") {
        await updateAgentStatus(agentId, "scanning");
      }
      if (event.type === "contacting" && event.status === "start") {
        await updateAgentStatus(agentId, "contacting");
      }
      if (event.type === "negotiating" && event.status === "start") {
        await updateAgentStatus(agentId, "negotiating");
      }

      await insertGraphEvent(
        agentId,
        event,
        eventMessage(event, names, rosterSize),
      );
    },
  });

  if (await isCancelled(agentId)) return;

  await persistWorkflowMatches(agentId, result.matches);
}

async function notifyResults(
  agentId: string,
  notifyChatId?: number,
): Promise<void> {
  if (!notifyChatId || !process.env.TELEGRAM_BOT_TOKEN) return;

  const bot = getBot();
  const pending = await listPendingMatchesForAgent(agentId);

  if (pending.length === 0) {
    await sendPlainMessage(
      bot,
      notifyChatId,
      "Networking finished. No strong matches this round — try again after more attendees join the event.",
    );
  } else {
    await sendMatchResults(bot, notifyChatId, pending);
  }
}

export async function startAgentNetworking(
  options: StartAgentOptions,
): Promise<void> {
  const { agentId, notifyChatId, topN = 5 } = options;

  const agent = await getAgentById(agentId);
  if (!agent) {
    if (notifyChatId && process.env.TELEGRAM_BOT_TOKEN) {
      await sendPlainMessage(
        getBot(),
        notifyChatId,
        "Agent not found. Complete /onboard first.",
      );
    }
    return;
  }

  const status = agent.status;
  if (RUNNING.includes(status)) {
    return;
  }

  const attendees = await listAttendeesForMatching(agent.attendee_id);
  if (attendees.length === 0) {
    await updateAgentStatus(agentId, "done");
    if (notifyChatId && process.env.TELEGRAM_BOT_TOKEN) {
      const bot = getBot();
      await sendDashboardLink(bot, notifyChatId, agentId);
      await sendPlainMessage(
        bot,
        notifyChatId,
        "No other attendees in the database yet. Run `pnpm db:seed`, then try /networking again.",
      );
    }
    return;
  }

  const useDemoOnly = process.env.USE_DEMO_FALLBACK === "true";

  try {
    if (useDemoOnly) {
      await runDemoFallback(agentId);
    } else {
      await runGeminiWorkflow({ agentId, notifyChatId, topN });
    }
  } catch (err) {
    console.error("[agent-start] workflow failed, using demo fallback:", err);
    await runDemoFallback(agentId);
  } finally {
    const final = await getAgentStatus(agentId);
    if (final !== "cancelled") {
      await updateAgentStatus(agentId, "done");
    }
    await notifyResults(agentId, notifyChatId);
  }
}

export async function startDemoNetworking(chatId: number): Promise<void> {
  const { ensureSeedAgent } = await import("@/lib/db/agents");
  const { SEED_AGENT_ID } = await import("@/lib/seed/constants");
  await ensureSeedAgent();
  await startAgentNetworking({
    agentId: SEED_AGENT_ID,
    notifyChatId: chatId,
    topN: 3,
  });
}
