import type { Bot } from "grammy";
import { updateMatchStatus } from "@/lib/db/matches";
import { parseIntent } from "./intents";
import {
  handleFreeText,
  runDashboard,
  runDemo,
  runNetworking,
  runOnboard,
  sendHelp,
  sendWelcome,
} from "./actions";
import { mainMenuKeyboard } from "./keyboards";

export function registerBotHandlers(bot: Bot): void {
  bot.command("start", (ctx) => sendWelcome(ctx));
  bot.command("help", (ctx) => sendHelp(ctx));
  bot.command("onboard", async (ctx) => {
    const chatId = ctx.chat?.id;
    if (chatId) await runOnboard(ctx, chatId);
  });
  bot.command("networking", async (ctx) => {
    const chatId = ctx.chat?.id;
    if (chatId) await runNetworking(ctx, chatId);
  });
  bot.command("demo", async (ctx) => {
    const chatId = ctx.chat?.id;
    if (chatId) await runDemo(ctx, chatId);
  });

  bot.callbackQuery(/^approve:(.+)$/, async (ctx) => {
    const matchId = ctx.match[1];
    const chatId = ctx.chat?.id;
    if (!matchId || !chatId) return;

    const result = await updateMatchStatus(matchId, "approved");
    await ctx.answerCallbackQuery({ text: "Approved" });

    if (!result) {
      await ctx.reply("Match not found.", { reply_markup: mainMenuKeyboard() });
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
      { parse_mode: "Markdown", reply_markup: mainMenuKeyboard() },
    );
  });

  bot.callbackQuery(/^reject:(.+)$/, async (ctx) => {
    const matchId = ctx.match[1];
    if (!matchId) return;

    const result = await updateMatchStatus(matchId, "rejected");
    await ctx.answerCallbackQuery({ text: "Rejected" });

    if (result) {
      await ctx.reply(`Passed on meeting with ${result.targetName}.`, {
        reply_markup: mainMenuKeyboard(),
      });
    }
  });

  bot.on("message:text", async (ctx) => {
    const chatId = ctx.chat?.id;
    const text = ctx.message.text;
    if (!chatId || !text) return;

    // Slash commands are handled by bot.command above
    if (text.startsWith("/")) return;

    if (await handleFreeText(bot, ctx, chatId, text)) return;

    const intent = parseIntent(text);

    switch (intent) {
      case "welcome":
        await sendWelcome(ctx);
        return;
      case "help":
        await sendHelp(ctx);
        return;
      case "onboard":
        await ctx.replyWithChatAction("typing");
        await runOnboard(ctx, chatId);
        return;
      case "networking":
        await runNetworking(ctx, chatId);
        return;
      case "demo":
        await runDemo(ctx, chatId);
        return;
      case "dashboard":
        await runDashboard(bot, ctx, chatId);
        return;
      default:
        await ctx.reply(
          "I'm not sure what you mean. Try the buttons below, or type *help*.",
          {
            parse_mode: "Markdown",
            reply_markup: mainMenuKeyboard(),
          },
        );
    }
  });
}
