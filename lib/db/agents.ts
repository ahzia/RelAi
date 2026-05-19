import { getServerClient } from "./clients";
import type { Profile } from "@/lib/gemini/types";

export type AgentStatus =
  | "idle"
  | "scanning"
  | "contacting"
  | "negotiating"
  | "done"
  | "cancelled";

export async function createAgentForAttendee(
  attendeeId: string,
  profile: Profile,
): Promise<string> {
  const supabase = getServerClient();
  const { data, error } = await supabase
    .from("agents")
    .insert({
      attendee_id: attendeeId,
      persona: profile,
      networking_goal: profile.networking_goal,
      constraints: { availability: profile.availability },
      status: "idle",
    })
    .select("id")
    .single();

  if (error) throw new Error(`agents insert: ${error.message}`);
  return data.id as string;
}

export async function getAgentById(agentId: string): Promise<{
  id: string;
  attendee_id: string;
  persona: Profile;
  networking_goal: string | null;
  constraints: { availability?: Profile["availability"] };
  status: AgentStatus;
} | null> {
  const supabase = getServerClient();
  const { data, error } = await supabase
    .from("agents")
    .select("id, attendee_id, persona, networking_goal, constraints, status")
    .eq("id", agentId)
    .maybeSingle();

  if (error) throw new Error(`agents select: ${error.message}`);
  if (!data) return null;
  return {
    id: data.id as string,
    attendee_id: data.attendee_id as string,
    persona: data.persona as Profile,
    networking_goal: data.networking_goal as string | null,
    constraints: (data.constraints ?? {}) as {
      availability?: Profile["availability"];
    },
    status: data.status as AgentStatus,
  };
}

export async function getAgentByAttendeeId(attendeeId: string): Promise<{
  id: string;
} | null> {
  const supabase = getServerClient();
  const { data, error } = await supabase
    .from("agents")
    .select("id")
    .eq("attendee_id", attendeeId)
    .maybeSingle();

  if (error) throw new Error(`agents select: ${error.message}`);
  return data ? { id: data.id as string } : null;
}

export async function updateAgentStatus(
  agentId: string,
  status: AgentStatus,
): Promise<void> {
  const supabase = getServerClient();
  const { error } = await supabase
    .from("agents")
    .update({ status })
    .eq("id", agentId);
  if (error) throw new Error(`agents update: ${error.message}`);
}

/** Fixed id for dashboard demo — created on first /demo if missing. */
export const SEED_AGENT_ID = "00000000-0000-4000-8000-000000000001";
export const SEED_ATTENDEE_ID = "00000000-0000-4000-8000-000000000002";

export async function ensureSeedAgent(): Promise<string> {
  const existing = await getAgentById(SEED_AGENT_ID);
  if (existing) return SEED_AGENT_ID;

  const supabase = getServerClient();

  const { error: attErr } = await supabase.from("attendees").upsert(
    {
      id: SEED_ATTENDEE_ID,
      name: "Demo User",
      role: "Founder",
      company: "RelAI",
      interests: ["agentic ai", "enterprise networking"],
      goals: "Meet AI founders and investors",
      availability: [
        {
          start: "2026-05-19T14:00:00+02:00",
          end: "2026-05-19T17:00:00+02:00",
        },
      ],
      telegram_chat_id: null,
    },
    { onConflict: "id" },
  );
  if (attErr) throw new Error(`seed attendee: ${attErr.message}`);

  const { error: agentErr } = await supabase.from("agents").upsert(
    {
      id: SEED_AGENT_ID,
      attendee_id: SEED_ATTENDEE_ID,
      persona: {
        name: "Demo User",
        role: "Founder",
        company: "RelAI",
        interests: ["agentic ai", "enterprise networking"],
        networking_goal: "Meet AI founders and investors",
        ideal_matches: ["ai investors", "infra founders"],
        availability: [
          {
            start: "2026-05-19T14:00:00+02:00",
            end: "2026-05-19T17:00:00+02:00",
          },
        ],
      },
      networking_goal: "Meet AI founders and investors",
      constraints: {
        availability: [
          {
            start: "2026-05-19T14:00:00+02:00",
            end: "2026-05-19T17:00:00+02:00",
          },
        ],
      },
      status: "idle",
    },
    { onConflict: "id" },
  );
  if (agentErr) throw new Error(`seed agent: ${agentErr.message}`);

  return SEED_AGENT_ID;
}
