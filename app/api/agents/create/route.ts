import { jsonError, jsonOk } from "@/lib/api/response";
import {
  createAgentForAttendee,
  getAttendeeByTelegramChatId,
} from "@/lib/db/queries";
import { ProfileSchema, type Profile } from "@/lib/gemini/types";

export const runtime = "nodejs";

export type CreateAgentResponse = {
  agentId: string;
  attendee_id: string;
  dashboard_url: string;
};

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  if (!body || typeof body !== "object") {
    return jsonError("Request body must be a JSON object", 400);
  }

  const o = body as Record<string, unknown>;
  const telegram_chat_id =
    typeof o.telegram_chat_id === "number" ? o.telegram_chat_id : null;
  const attendee_id =
    typeof o.attendee_id === "string" ? o.attendee_id : null;

  if (!telegram_chat_id && !attendee_id) {
    return jsonError("telegram_chat_id or attendee_id is required", 400);
  }

  let profile: Profile;
  if (o.profile) {
    const parsed = ProfileSchema.safeParse(o.profile);
    if (!parsed.success) {
      return jsonError("Invalid profile shape", 400);
    }
    profile = parsed.data;
  } else {
    return jsonError("profile is required", 400);
  }

  let resolvedAttendeeId = attendee_id;
  if (telegram_chat_id) {
    const attendee = await getAttendeeByTelegramChatId(telegram_chat_id);
    if (!attendee) {
      return jsonError(
        "Attendee not found — call POST /api/onboarding first",
        404,
      );
    }
    resolvedAttendeeId = attendee.id;
  }

  if (!resolvedAttendeeId) {
    return jsonError("Could not resolve attendee", 400);
  }

  const agentId = await createAgentForAttendee(resolvedAttendeeId, profile);

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    "http://localhost:3000";

  const response: CreateAgentResponse = {
    agentId,
    attendee_id: resolvedAttendeeId,
    dashboard_url: `${baseUrl}/dashboard/${agentId}`,
  };

  return jsonOk(response, 201);
}
