import { NextResponse } from "next/server";
import { extractProfile } from "@/lib/gemini/prompts/extractProfile";
import type { OnboardingAnswers } from "@/lib/gemini/prompts/extractProfile";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = (await req.json()) as {
    telegram_chat_id?: number;
    answers?: OnboardingAnswers;
  };

  if (!body.answers) {
    return NextResponse.json(
      { error: "answers required" },
      { status: 400 },
    );
  }

  const profile = await extractProfile(body.answers);

  return NextResponse.json({
    ok: true,
    telegram_chat_id: body.telegram_chat_id,
    profile,
  });
}
