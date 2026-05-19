import type { Bot, Context } from "grammy";
import {
  getAttendeeByTelegramChatId,
  getOnboardingState,
} from "@/lib/db/attendees";
import { getAgentByAttendeeId } from "@/lib/db/agents";
import {
  startAgentNetworking,
  startDemoNetworking,
} from "@/lib/services/agent-start-service";
import {
  beginOnboarding,
  handleOnboardingText,
} from "@/lib/services/onboarding-service";
import {
  mainMenuKeyboard,
  onboardingConfirmKeyboard,
  onboardingProgressKeyboard,
} from "./keyboards";
import { sendDashboardLink, sendPlainMessage } from "./notify";
import { withTyping } from "./ux";

export async function sendWelcome(ctx: Context): Promise<void> {
  const name = ctx.from?.first_name ?? "there";
  await ctx.reply(
    `Hi ${name} — I'm your RelAI networking agent for *AI Week Milan*.\n\n` +
      `I'll learn what you're looking for, meet other attendees' *AI agents* on your behalf, and suggest meetings you can approve.\n\n` +
      `Tap *Set up my profile* to begin (about 2 min), or *Try demo* to see how it works.`,
    {
      parse_mode: "Markdown",
      reply_markup: mainMenuKeyboard(),
    },
  );
}

export async function sendHelp(ctx: Context): Promise<void> {
  await ctx.reply(
    "*How to use RelAI*\n\n" +
      "1️⃣ *Set up my profile* — 5 short questions\n" +
      "2️⃣ I find matches and propose times\n" +
      "3️⃣ You *Approve* or *Reject* each meeting\n" +
      "4️⃣ *Mission Control* — watch agents work (web dashboard)\n\n" +
      "_Other attendees are simulated AI agents for this demo — not live DMs._\n\n" +
      "Type naturally: “hello”, “find matches”, “help”.",
    { parse_mode: "Markdown", reply_markup: mainMenuKeyboard() },
  );
}

export async function runOnboard(ctx: Context, chatId: number): Promise<void> {
  const result = await beginOnboarding(chatId);
  for (const msg of result.messages) {
    await ctx.reply(msg, {
      parse_mode: "Markdown",
      reply_markup: msg.includes("Question 1")
        ? onboardingProgressKeyboard()
        : mainMenuKeyboard(),
    });
  }
}

export async function runNetworking(ctx: Context, chatId: number): Promise<void> {
  const attendee = await getAttendeeByTelegramChatId(chatId);
  if (!attendee) {
    await ctx.reply(
      "Let's set you up first — tap *Set up my profile* (about 2 minutes).",
      {
        parse_mode: "Markdown",
        reply_markup: mainMenuKeyboard(),
      },
    );
    return;
  }

  const agent = await getAgentByAttendeeId(attendee.id);
  if (!agent) {
    await ctx.reply(
      "Your profile isn't finished yet. Tap *Set up my profile* to complete onboarding.",
      { parse_mode: "Markdown", reply_markup: mainMenuKeyboard() },
    );
    return;
  }

  await ctx.reply(
    "Starting your networking run — I'll message you as each step completes (usually under a minute).",
    { reply_markup: mainMenuKeyboard() },
  );

  void startAgentNetworking({
    agentId: agent.id,
    notifyChatId: chatId,
  }).catch((err) => {
    console.error("[networking]", err);
    void ctx.reply(
      "I couldn't finish matching right now. Please try *Find matches* again in a moment.",
      { reply_markup: mainMenuKeyboard() },
    );
  });
}

export async function runDemo(ctx: Context, chatId: number): Promise<void> {
  await ctx.reply(
    "Running a quick demo with sample event data — matches coming up shortly.",
    { reply_markup: mainMenuKeyboard() },
  );

  void startDemoNetworking(chatId).catch((err) => {
    console.error("[demo]", err);
    void ctx.reply(
      "Demo didn't complete. Ask your team if the database is seeded, then try again.",
      { reply_markup: mainMenuKeyboard() },
    );
  });
}

export async function runDashboard(
  bot: Bot,
  ctx: Context,
  chatId: number,
): Promise<void> {
  const attendee = await getAttendeeByTelegramChatId(chatId);
  const agent = attendee ? await getAgentByAttendeeId(attendee.id) : null;

  if (!agent) {
    await ctx.reply(
      "No agent yet — tap *Set up my profile* first.",
      { reply_markup: mainMenuKeyboard() },
    );
    return;
  }

  await sendDashboardLink(bot, chatId, agent.id);
  await ctx.reply("Tap *Find matches* when you want new introductions.", {
    reply_markup: mainMenuKeyboard(),
  });
}

export async function handleFreeText(
  bot: Bot,
  ctx: Context,
  chatId: number,
  text: string,
): Promise<boolean> {
  const onboarding = await getOnboardingState(chatId);
  if (
    onboarding &&
    onboarding.state.step !== "idle" &&
    onboarding.state.step !== "ready"
  ) {
    const run = () => handleOnboardingText(chatId, text);
    const result =
      onboarding.state.step === "confirm" &&
      (text.toLowerCase().includes("yes") || text.includes("create my agent"))
        ? await withTyping(ctx, run)
        : await run();

    if (result) {
      for (const msg of result.messages) {
        const showConfirm = msg.includes("Yes, create my agent");
        const cancelled = msg.includes("cancelled");
        await ctx.reply(msg, {
          parse_mode: "Markdown",
          reply_markup: cancelled
            ? mainMenuKeyboard()
            : showConfirm
              ? onboardingConfirmKeyboard()
              : onboardingProgressKeyboard(),
        });
      }
    }
    return true;
  }

  return false;
}
