/**
 * Local Telegram bot — long polling (no HTTPS webhook required).
 * Run: npm run bot:dev
 */
import { getBot } from "../lib/telegram/bot";

async function main() {
  const bot = getBot();

  // Webhook and polling cannot run at the same time
  try {
    await bot.api.deleteWebhook({ drop_pending_updates: false });
    console.log("Webhook cleared — using long polling.");
  } catch (err) {
    console.warn("deleteWebhook failed (continuing):", err);
  }

  const me = await bot.api.getMe();
  console.log(`Bot running as @${me.username} (polling). Press Ctrl+C to stop.`);

  await bot.api.setMyCommands([
    { command: "start", description: "Welcome & menu" },
    { command: "onboard", description: "Set up your profile" },
    { command: "networking", description: "Find matches" },
    { command: "demo", description: "Try a demo run" },
    { command: "help", description: "How it works" },
  ]);

  await bot.start({
    onStart: () => {
      console.log("Listening for messages… Open https://t.me/" + me.username);
    },
  });
}

function printTelegramNetworkHelp(code: string): void {
  if (code === "UNABLE_TO_GET_ISSUER_CERT_LOCALLY") {
    console.error(
      "\nCould not verify Telegram’s SSL certificate (common with conda on macOS).\n" +
        "The bot auto-loads certifi; if it still fails, add to .env:\n" +
        "  TELEGRAM_INSECURE_SSL=true\n" +
        "(dev only — never use in production)\n",
    );
    return;
  }

  console.error(
    "\nCannot reach api.telegram.org from this network.\n" +
      "Your error often means DNS/firewall blocking (e.g. OpenDNS “block.opendns.com”).\n\n" +
      "Try:\n" +
      "  • Phone hotspot or another Wi‑Fi (not corporate/school DNS)\n" +
      "  • VPN that allows Telegram\n" +
      "  • Run the bot on your Vultr server after deploy (server is not blocked)\n\n" +
      "Quick check:\n" +
      "  curl -I https://api.telegram.org\n",
  );
}

main().catch((err) => {
  const cause = err instanceof Error && "cause" in err ? err.cause : err;
  const code =
    cause && typeof cause === "object" && "code" in cause
      ? String((cause as { code: string }).code)
      : "";

  if (code === "UNABLE_TO_GET_ISSUER_CERT_LOCALLY") {
    printTelegramNetworkHelp(code);
  } else {
    console.error(err);
    printTelegramNetworkHelp("");
  }
  process.exit(1);
});
