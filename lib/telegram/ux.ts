import type { Api, Context } from "grammy";

/** Show "typing…" while a slow operation runs. */
export async function withTyping<T>(
  ctx: Context,
  work: () => Promise<T>,
): Promise<T> {
  await ctx.replyWithChatAction("typing");
  return work();
}

export async function sendTyping(bot: Api, chatId: number): Promise<void> {
  await bot.sendChatAction(chatId, "typing");
}
