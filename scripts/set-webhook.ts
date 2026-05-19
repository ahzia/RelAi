/**
 * Register Telegram webhook for production (HTTPS required).
 * Run after deploy: npm run webhook:set
 */
import { configureNodeTls } from "../lib/telegram/tls";

configureNodeTls();

import { getAppUrl, getTelegramBotToken, getWebhookSecret } from "../lib/telegram/env";

async function main() {
  const token = getTelegramBotToken();
  const baseUrl = getAppUrl();

  if (!baseUrl.startsWith("https://")) {
    console.error(
      "NEXT_PUBLIC_APP_URL must be your public HTTPS URL (not localhost).\n" +
        "Set it in .env.local for this script, or pass WEBHOOK_BASE_URL=https://your-domain",
    );
    process.exit(1);
  }

  const webhookUrl = `${baseUrl}/api/telegram/webhook`;
  const secret = getWebhookSecret();

  const body: Record<string, unknown> = {
    url: webhookUrl,
    allowed_updates: ["message", "callback_query"],
  };
  if (secret) {
    body.secret_token = secret;
  }

  const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = (await res.json()) as {
    ok: boolean;
    description?: string;
    result?: boolean;
  };

  if (!data.ok) {
    console.error("setWebhook failed:", data.description ?? data);
    process.exit(1);
  }

  console.log("Webhook registered:", webhookUrl);
  if (secret) {
    console.log("Secret token: configured (TELEGRAM_WEBHOOK_SECRET)");
  } else {
    console.warn(
      "No TELEGRAM_WEBHOOK_SECRET set — consider generating one for production.",
    );
  }

  const info = await fetch(
    `https://api.telegram.org/bot${token}/getWebhookInfo`,
  );
  console.log(await info.json());
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
