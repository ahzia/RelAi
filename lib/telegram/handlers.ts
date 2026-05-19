import type { Bot } from "grammy";
import {
  getAttendeeByTelegramChatId,
  getOnboardingState,
} from "@/lib/db/attendees";
import { getAgentByAttendeeId } from "@/lib/db/agents";
import { updateMatchStatus } from "@/lib/db/matches";
import {
  startAgentNetworking,
  startDemoNetworking,
} from "@/lib/services/agent-start-service";
import {
  beginOnboarding,
  handleOnboardingText,
} from "@/lib/services/onboarding-service";
import { sendDashboardLink, sendPlainMessage } from "./notify";

export function registerBotHandlers(bot: Bot): void {
  bot.command("start", async (ctx) => {
    const name = ctx.from?.first_name ?? "there";
    await ctx.reply(
      `Hi ${name}, I'm your RelAI networking agent. I'll help you find the most valuable people to meet at this event.\n\n` +
        `• /onboard — set up your profile\n` +
        `• /networking — run matching (after onboard)\n` +
        `• /demo — preview Mission Control with demo data\n` +
        `• /help — command list`,
    );
  });

  bot.command("help", async (ctx) => {
    await ctx.reply(
      "*Commands*\n" +
        "/onboard — create your agent (5 questions)\n" +
        "/networking — start agent matching\n" +
        "/demo — demo dashboard + sample run\n" +
        "/start — welcome message",
      { parse_mode: "Markdown" },
    );
  });

  bot.command("onboard", async (ctx) => {
    const chatId = ctx.chat?.id;
    if (!chatId) return;
    const result = await beginOnboarding(chatId);
    for (const msg of result.messages) {
      await ctx.reply(msg, { parse_mode: "Markdown" });
    }
  });

  bot.command("networking", async (ctx) => {
    const chatId = ctx.chat?.id;
    if (!chatId) return;

    const attendee = await getAttendeeByTelegramChatId(chatId);
    if (!attendee) {
      await ctx.reply("Complete /onboard first.");
      return;
    }

    const agent = await getAgentByAttendeeId(attendee.id);
    if (!agent) {
      await ctx.reply("Complete /onboard first — your agent is not created yet.");
      return;
    }

    await ctx.reply(
      "Starting your networking run. This may take up to a minute…",
    );

    void startAgentNetworking({
      agentId: agent.id,
      notifyChatId: chatId,
    }).catch((err) => {
      console.error("[networking]", err);
      void ctx.reply(
        "Something went wrong during networking. Try again in a moment or use USE_DEMO_FALLBACK=true.",
      );
    });
  });

  bot.command("demo", async (ctx) => {
    const chatId = ctx.chat?.id;
    if (!chatId) return;

    await ctx.reply(
      "Demo mode: starting the seed agent workflow. You'll get a Mission Control link and sample matches.",
    );

    void startDemoNetworking(chatId).catch((err) => {
      console.error("[demo]", err);
      void ctx.reply(
        "Demo failed. Check Supabase + Gemini env vars and run `npm run db:seed`.",
      );
    });
  });

  bot.callbackQuery(/^approve:(.+)$/, async (ctx) => {
    const matchId = ctx.match[1];
    const chatId = ctx.chat?.id;
    if (!matchId || !chatId) return;

    const result = await updateMatchStatus(matchId, "approved");
    await ctx.answerCallbackQuery({ text: "Approved" });

    if (!result) {
      await ctx.reply("Match not found.");
      return;
    }

    const when = result.proposedTime
      ? new Date(result.proposedTime).toLocaleString("en-GB", {
          timeZone: "Europe/Rome",
          dateStyle: "medium",
          timeStyle: "short",
        })
      : "the proposed slot";

    await ctx.reply(
      `Meeting confirmed with *${result.targetName}* at ${when}.`,
      { parse_mode: "Markdown" },
    );
  });

  bot.callbackQuery(/^reject:(.+)$/, async (ctx) => {
    const matchId = ctx.match[1];
    if (!matchId) return;

    const result = await updateMatchStatus(matchId, "rejected");
    await ctx.answerCallbackQuery({ text: "Rejected" });

    if (result) {
      await ctx.reply(`Passed on meeting with ${result.targetName}.`);
    }
  });

  bot.on("message:text", async (ctx) => {
    const chatId = ctx.chat?.id;
    const text = ctx.message.text;
    if (!chatId || !text) return;
    if (text.startsWith("/")) return;

    const onboarding = await getOnboardingState(chatId);
    if (
      onboarding &&
      onboarding.state.step !== "idle" &&
      onboarding.state.step !== "ready"
    ) {
      const result = await handleOnboardingText(chatId, text);
      if (result) {
        for (const msg of result.messages) {
          await ctx.reply(msg, { parse_mode: "Markdown" });
        }
      }
      return;
    }

    const attendee = await getAttendeeByTelegramChatId(chatId);
    const agent = attendee ? await getAgentByAttendeeId(attendee.id) : null;
    if (agent) {
      await sendDashboardLink(bot, chatId, agent.id);
      await sendPlainMessage(
        bot,
        chatId,
        "Use /networking to find new matches, or /help for commands.",
      );
      return;
    }

    await ctx.reply(
      "I didn't understand that. Try /onboard to get started, or /help.",
    );
  });
}
