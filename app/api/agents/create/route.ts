import { NextResponse } from "next/server";
import {
  finalizeAttendeeFromProfile,
  getAttendeeByTelegramChatId,
} from "@/lib/db/attendees";
import { createAgentForAttendee } from "@/lib/db/agents";
import type { Profile } from "@/lib/gemini/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = (await req.json()) as {
    telegram_chat_id?: number;
    attendee_id?: string;
    profile?: Profile;
  };

  if (!body.profile) {
    return NextResponse.json({ error: "profile required" }, { status: 400 });
  }

  let attendeeId = body.attendee_id;

  if (!attendeeId && body.telegram_chat_id) {
    const row = await getAttendeeByTelegramChatId(body.telegram_chat_id);
    attendeeId = row?.id;
  }

  if (!attendeeId) {
    return NextResponse.json(
      { error: "attendee_id or telegram_chat_id required" },
      { status: 400 },
    );
  }

  await finalizeAttendeeFromProfile(attendeeId, {
    name: body.profile.name,
    role: body.profile.role,
    company: body.profile.company,
    interests: body.profile.interests,
    networking_goal: body.profile.networking_goal,
    availability: body.profile.availability,
  });

  const agentId = await createAgentForAttendee(attendeeId, body.profile);

  return NextResponse.json({ ok: true, agentId, attendeeId });
}
