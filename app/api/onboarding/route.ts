import { jsonError, jsonOk } from "@/lib/api/response";
import { upsertAttendeeFromProfile } from "@/lib/db/queries";
import { extractProfileSafe } from "@/lib/onboarding/extract-profile-safe";
import { parseOnboardingBody } from "@/lib/onboarding/parse-answers";
import type { Profile } from "@/lib/gemini/types";

export const runtime = "nodejs";

export type OnboardingResponse = {
  attendee_id: string;
  profile: Profile;
};

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const parsed = parseOnboardingBody(body);
  if (!parsed.ok) {
    return jsonError(parsed.error, 400);
  }

  const { telegram_chat_id, ...answers } = parsed.data;

  const profile = await extractProfileSafe(answers);
  const attendee = await upsertAttendeeFromProfile(telegram_chat_id, profile);

  const response: OnboardingResponse = {
    attendee_id: attendee.id,
    profile,
  };

  return jsonOk(response);
}
