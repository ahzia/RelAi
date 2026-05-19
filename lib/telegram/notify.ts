import { InlineKeyboard, type Bot } from "grammy";
import { getAppUrl } from "./env";
import { canUseTelegramUrlButton } from "./urls";

export async function sendPlainMessage(
  bot: Bot,
  chatId: number,
  text: string,
): Promise<void> {
  await bot.api.sendMessage(chatId, text, { parse_mode: "Markdown" });
}

export async function sendDashboardLink(
  bot: Bot,
  chatId: number,
  agentId: string,
): Promise<void> {
  const dashboardUrl = `${getAppUrl()}/dashboard/${agentId}`;
  const useButton = canUseTelegramUrlButton(dashboardUrl);

  const text =
    `Open Mission Control:\n${dashboardUrl}` +
    (useButton
      ? ""
      : "\n\n_(Open this link on your machine while the app is running.)_");

  await bot.api.sendMessage(chatId, text, {
    parse_mode: "Markdown",
    reply_markup: useButton
      ? new InlineKeyboard().url("Open Mission Control", dashboardUrl)
      : undefined,
  });
}

export type MatchForTelegram = {
  id: string;
  score: number;
  reason: string | null;
  proposed_time: string | null;
  target: { name: string; role: string; company: string | null };
  summary: string | null;
};

function formatProposedTime(iso: string | null): string {
  if (!iso) return "Time TBD";
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

function formatMatchCard(m: MatchForTelegram, index: number): string {
  const company = m.target.company ? ` @ ${m.target.company}` : "";
  return (
    `*${index}. ${m.target.name}* — ${m.score}/100\n` +
    `${m.target.role}${company}\n` +
    `${m.reason ?? m.summary ?? "Strong mutual fit."}\n` +
    `Proposed: ${formatProposedTime(m.proposed_time)}`
  );
}

export async function sendMatchResults(
  bot: Bot,
  chatId: number,
  matches: MatchForTelegram[],
): Promise<void> {
  const header = `I found ${matches.length} strong match${matches.length === 1 ? "" : "es"} for you:\n`;
  const body = matches.map((m, i) => formatMatchCard(m, i + 1)).join("\n\n");

  await bot.api.sendMessage(chatId, header + "\n" + body, {
    parse_mode: "Markdown",
  });

  for (const m of matches) {
    const keyboard = new InlineKeyboard()
      .text("Approve", `approve:${m.id}`)
      .text("Reject", `reject:${m.id}`);

    await bot.api.sendMessage(
      chatId,
      `Approve meeting with *${m.target.name}*?`,
      { parse_mode: "Markdown", reply_markup: keyboard },
    );
  }
}
