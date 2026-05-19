import { Bot, InlineKeyboard } from "grammy";
import { getGrammyClientOptions } from "./client";
import { getAppUrl, getTelegramBotToken } from "./env";
import { canUseTelegramUrlButton } from "./urls";

export function createBot(): Bot {
  const client = getGrammyClientOptions();
  const bot = new Bot(getTelegramBotToken(), client ? { client } : undefined);

  bot.catch((err) => {
    console.error("[telegram] update failed:", err.message);
  });

  bot.command("start", async (ctx) => {
    const name = ctx.from?.first_name ?? "there";
    await ctx.reply(
      `Hi ${name}, I'm your RelAI networking agent. I'll help you find the most valuable people to meet at this event.\n\n` +
        `Reply with /onboard to set up your profile, or /demo to try the Mission Control dashboard.`,
    );
  });

  bot.command("onboard", async (ctx) => {
    await ctx.reply(
      "Onboarding is coming next — we'll ask for your name, role, interests, who you want to meet, and availability.\n\n" +
        "For now, use /demo to open the dashboard preview.",
    );
  });

  bot.command("demo", async (ctx) => {
    const appUrl = getAppUrl();
    const agentId = "seed-agent";
    const dashboardUrl = `${appUrl}/dashboard/${agentId}`;

    const useButton = canUseTelegramUrlButton(dashboardUrl);
    const localHint = useButton
      ? ""
      : "\n\n(Local dev: open the link above in your browser on this machine while `npm run dev` is running. Telegram cannot add a button for localhost.)";

    await ctx.reply(
      "Demo mode: your agent would start networking now.\n\n" +
        `Open Mission Control:\n${dashboardUrl}` +
        localHint +
        "\n\n(BE will wire POST /api/agents/seed-agent/start to animate the graph.)",
      useButton
        ? {
            reply_markup: new InlineKeyboard().url(
              "Open Mission Control",
              dashboardUrl,
            ),
          }
        : undefined,
    );
  });

  bot.on("message", async (ctx) => {
    if (ctx.message.text?.startsWith("/")) return;
    await ctx.reply(
      "I didn't understand that. Try /start, /onboard, or /demo.",
    );
  });

  return bot;
}

/** Singleton for webhook + scripts */
let botInstance: Bot | undefined;

export function getBot(): Bot {
  if (!botInstance) {
    botInstance = createBot();
  }
  return botInstance;
}
