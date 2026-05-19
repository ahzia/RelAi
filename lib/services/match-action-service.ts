/**
 * Approve / reject from HTTP API (dashboard) with graph_events + optional Telegram.
 */

import { insertGraphEvent } from "@/lib/db/graph-events";
import {
  getMatchById,
  updateMatchStatus,
  type MatchDetails,
} from "@/lib/db/matches";
import { getBot } from "@/lib/telegram/bot";
import { sendPlainMessage } from "@/lib/telegram/notify";

function formatWhen(iso: string | null): string {
  if (!iso) return "the proposed slot";
  try {
    return new Date(iso).toLocaleString("en-GB", {
      timeZone: "Europe/Rome",
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

async function notifyTelegram(
  details: MatchDetails,
  message: string,
): Promise<void> {
  if (!details.requesterTelegramChatId || !process.env.TELEGRAM_BOT_TOKEN) {
    return;
  }
  try {
    await sendPlainMessage(getBot(), details.requesterTelegramChatId, message);
  } catch (err) {
    console.error("[match-action] Telegram notify failed:", err);
  }
}

export async function approveMatch(matchId: string): Promise<{
  ok: true;
  id: string;
  status: "approved";
} | null> {
  const details = await getMatchById(matchId);
  if (!details) return null;

  await updateMatchStatus(matchId, "approved");

  await insertGraphEvent(details.requesterId, {
    type: "scheduled",
    targetId: details.targetId,
    proposed_time: details.proposedTime ?? new Date().toISOString(),
  }, `Meeting scheduled with ${details.targetName}.`);

  const when = formatWhen(details.proposedTime);
  await notifyTelegram(
    details,
    `Meeting confirmed with *${details.targetName}* at ${when}.`,
  );

  return { ok: true, id: matchId, status: "approved" };
}

export async function rejectMatch(matchId: string): Promise<{
  ok: true;
  id: string;
  status: "rejected";
} | null> {
  const details = await getMatchById(matchId);
  if (!details) return null;

  await updateMatchStatus(matchId, "rejected");

  await insertGraphEvent(
    details.requesterId,
    { type: "rejected", targetId: details.targetId },
    `You declined the meeting with ${details.targetName}.`,
  );

  await notifyTelegram(
    details,
    `You passed on meeting with ${details.targetName}.`,
  );

  return { ok: true, id: matchId, status: "rejected" };
}
