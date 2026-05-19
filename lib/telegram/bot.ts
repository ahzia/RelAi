import { Bot } from "grammy";
import { getGrammyClientOptions } from "./client";
import { getTelegramBotToken } from "./env";
import { registerBotHandlers } from "./handlers";

export function createBot(): Bot {
  const client = getGrammyClientOptions();
  const bot = new Bot(getTelegramBotToken(), client ? { client } : undefined);

  bot.catch((err) => {
    console.error("[telegram] update failed:", err.message);
  });

  registerBotHandlers(bot);

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
