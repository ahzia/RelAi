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

export {
  SEED_AGENT_ID,
  SEED_ATTENDEE_ID,
} from "@/lib/seed/constants";

/** Ensures the canonical seed agent from `pnpm db:seed` exists (for /demo). */
export async function ensureSeedAgent(): Promise<string> {
  const { SEED_AGENT_ID } = await import("@/lib/seed/constants");
  const existing = await getAgentById(SEED_AGENT_ID);
  if (!existing) {
    throw new Error(
      `Seed agent not found. Run \`pnpm db:seed\` first (id: ${SEED_AGENT_ID}).`,
    );
  }
  return SEED_AGENT_ID;
}

export async function getAgentStatus(
  agentId: string,
): Promise<AgentStatus | null> {
  const agent = await getAgentById(agentId);
  return agent?.status ?? null;
}
