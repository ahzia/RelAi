import { getAgentById, updateAgentStatus } from "@/lib/db/agents";
import { listAttendeesForMatching } from "@/lib/db/attendees";
import { insertGraphEvent } from "@/lib/db/graph-events";
import { insertMatchRecord, listPendingMatchesForAgent } from "@/lib/db/matches";
import {
  runAgentWorkflow,
  type AgentWorkflowMatch,
} from "@/lib/orchestrator/workflow";
import { getBot } from "@/lib/telegram/bot";
import {
  sendDashboardLink,
  sendMatchResults,
  sendPlainMessage,
} from "@/lib/telegram/notify";

export interface StartAgentOptions {
  agentId: string;
  notifyChatId?: number;
  /** Cap Gemini calls for faster demos. */
  topN?: number;
}

export async function startAgentNetworking(
  options: StartAgentOptions,
): Promise<void> {
  const { agentId, notifyChatId, topN = 3 } = options;

  const agent = await getAgentById(agentId);
  if (!agent) {
    if (notifyChatId) {
      await sendPlainMessage(
        getBot(),
        notifyChatId,
        "Agent not found. Complete /onboard first.",
      );
    }
    return;
  }

  const userProfile = agent.persona;
  const userAvailability =
    agent.constraints.availability ?? userProfile.availability ?? [];

  const attendees = await listAttendeesForMatching(agent.attendee_id);

  if (attendees.length === 0) {
    await updateAgentStatus(agentId, "done");
    if (notifyChatId) {
      const bot = getBot();
      await sendDashboardLink(bot, notifyChatId, agentId);
      await sendPlainMessage(
        bot,
        notifyChatId,
        "No other attendees in the database yet. Ask your team to run `npm run db:seed`, then try /networking again.",
      );
    }
    return;
  }

  await updateAgentStatus(agentId, "scanning");

  if (notifyChatId) {
    const bot = getBot();
    await sendPlainMessage(
      bot,
      notifyChatId,
      "I'll now scan the event network and talk to other attendee agents.",
    );
    await sendDashboardLink(bot, notifyChatId, agentId);
  }

  const useFallback = process.env.USE_DEMO_FALLBACK === "true";

  let workflowMatches: AgentWorkflowMatch[] = [];

  try {
    const result = await runAgentWorkflow({
      userProfile,
      userAvailability,
      attendees,
      topN,
      onEvent: async (event) => {
        await insertGraphEvent(agentId, event);
        if (notifyChatId && event.type === "scanning" && event.status === "start") {
          await sendPlainMessage(
            getBot(),
            notifyChatId,
            "🔍 Scanning who's at the event…",
          );
        }
        if (notifyChatId && event.type === "scanning" && event.status === "end") {
          await sendPlainMessage(
            getBot(),
            notifyChatId,
            "🤝 Talking to the best candidate agents… (about 30–60 seconds)",
          );
        }
        if (event.type === "scanning" && event.status === "start") {
          await updateAgentStatus(agentId, "scanning");
        }
        if (event.type === "contacting" && event.status === "start") {
          await updateAgentStatus(agentId, "contacting");
        }
        if (event.type === "negotiating" && event.status === "start") {
          await updateAgentStatus(agentId, "negotiating");
        }
      },
    });
    workflowMatches = result.matches;
  } catch (err) {
    console.error("[agent-start] workflow failed:", err);
    if (!useFallback) throw err;
  }

  const toPersist = workflowMatches
    .filter((m) => m.should_meet && m.summary)
    .slice(0, 3);

  for (const m of toPersist) {
    await insertMatchRecord({
      requesterId: agentId,
      targetId: m.target.id,
      score: m.score,
      reason: m.reason,
      proposedTime: m.proposed_time,
      messagesJson: m.conversation.conversation,
      summary: m.summary?.summary ?? null,
    });
  }

  await updateAgentStatus(agentId, "done");

  if (notifyChatId) {
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
}

export async function startDemoNetworking(chatId: number): Promise<void> {
  const { ensureSeedAgent, SEED_AGENT_ID } = await import("@/lib/db/agents");
  await ensureSeedAgent();
  await startAgentNetworking({
    agentId: SEED_AGENT_ID,
    notifyChatId: chatId,
    topN: 3,
  });
}
