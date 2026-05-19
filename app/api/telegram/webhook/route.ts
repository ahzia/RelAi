import { webhookCallback } from "grammy";
import { getBot } from "@/lib/telegram/bot";
import { getWebhookSecret } from "@/lib/telegram/env";

export const runtime = "nodejs";

const handleUpdate = webhookCallback(getBot(), "std/http");

export async function POST(req: Request) {
  const secret = getWebhookSecret();
  if (secret) {
    const header = req.headers.get("x-telegram-bot-api-secret-token");
    if (header !== secret) {
      return new Response("Unauthorized", { status: 401 });
    }
  }

  try {
    return await handleUpdate(req);
  } catch (err) {
    console.error("[telegram/webhook]", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
