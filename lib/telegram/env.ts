export function getTelegramBotToken(): string {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!token) {
    throw new Error(
      "TELEGRAM_BOT_TOKEN is missing. Add it to .env (see .env.example).",
    );
  }
  return token;
}

export function getAppUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "") ??
    "http://localhost:3000"
  );
}

export function getWebhookSecret(): string | undefined {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
  return secret || undefined;
}
