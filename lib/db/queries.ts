import { getServerClient } from "@/lib/db/clients";
import type {
  AgentWithAttendee,
  Attendee,
  AttendeeInsert,
  Conversation,
  GraphEvent,
  MatchWithTarget,
} from "@/lib/db/types";

const AGENT_SELECT = "*, attendee:attendees(*)";

function throwDb(context: string, error: { message: string }): never {
  throw new Error(`${context}: ${error.message}`);
}

export async function getAgentWithAttendee(
  agentId: string,
): Promise<AgentWithAttendee | null> {
  const sb = getServerClient();
  const { data, error } = await sb
    .from("agents")
    .select(AGENT_SELECT)
    .eq("id", agentId)
    .maybeSingle();

  if (error) throwDb("getAgentWithAttendee", error);
  if (!data) return null;

  const row = data as AgentWithAttendee & { attendee: Attendee | Attendee[] };
  const attendee = Array.isArray(row.attendee) ? row.attendee[0] : row.attendee;
  if (!attendee) return null;

  return { ...row, attendee };
}

export async function listAttendees(limit = 200): Promise<Attendee[]> {
  const sb = getServerClient();
  const { data, error } = await sb
    .from("attendees")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) throwDb("listAttendees", error);
  return (data ?? []) as Attendee[];
}

export async function getAttendeesByIds(ids: string[]): Promise<Attendee[]> {
  if (ids.length === 0) return [];

  const sb = getServerClient();
  const { data, error } = await sb.from("attendees").select("*").in("id", ids);

  if (error) throwDb("getAttendeesByIds", error);
  return (data ?? []) as Attendee[];
}

export async function listGraphEvents(
  requesterId: string,
  limit = 500,
): Promise<GraphEvent[]> {
  const sb = getServerClient();
  const { data, error } = await sb
    .from("graph_events")
    .select("*")
    .eq("requester_id", requesterId)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) throwDb("listGraphEvents", error);
  return (data ?? []) as GraphEvent[];
}

export async function listMatchesForAgent(
  agentId: string,
): Promise<MatchWithTarget[]> {
  const sb = getServerClient();
  const { data, error } = await sb
    .from("matches")
    .select("*")
    .eq("requester_id", agentId)
    .order("score", { ascending: false });

  if (error) throwDb("listMatchesForAgent", error);

  const matches = (data ?? []) as MatchWithTarget[];
  if (matches.length === 0) return [];

  const targets = await getAttendeesByIds(matches.map((m) => m.target_id));
  const targetById = new Map(targets.map((t) => [t.id, t]));

  return matches
    .map((m) => {
      const target = targetById.get(m.target_id);
      if (!target) return null;
      return { ...m, target };
    })
    .filter((m): m is MatchWithTarget => m !== null);
}

export async function getConversationsByMatchIds(
  matchIds: string[],
): Promise<Conversation[]> {
  if (matchIds.length === 0) return [];

  const sb = getServerClient();
  const { data, error } = await sb
    .from("conversations")
    .select("*")
    .in("match_id", matchIds);

  if (error) throwDb("getConversationsByMatchIds", error);
  return (data ?? []) as Conversation[];
}

export async function updateMatchStatus(
  matchId: string,
  status: "approved" | "rejected",
): Promise<MatchWithTarget | null> {
  const sb = getServerClient();
  const { data, error } = await sb
    .from("matches")
    .update({ status })
    .eq("id", matchId)
    .select("*")
    .maybeSingle();

  if (error) throwDb("updateMatchStatus", error);
  if (!data) return null;

  const row = data as MatchWithTarget;
  const targets = await getAttendeesByIds([row.target_id]);
  const target = targets[0];
  if (!target) return null;

  return { ...row, target };
}

export async function countMatchesForAgent(agentId: string): Promise<{
  total: number;
  pending: number;
}> {
  const sb = getServerClient();
  const { data, error } = await sb
    .from("matches")
    .select("status")
    .eq("requester_id", agentId);

  if (error) throwDb("countMatchesForAgent", error);

  const rows = data ?? [];
  return {
    total: rows.length,
    pending: rows.filter((r) => r.status === "pending").length,
  };
}

export async function deleteAttendeesByCompany(company: string): Promise<void> {
  const sb = getServerClient();
  const { error } = await sb.from("attendees").delete().eq("company", company);

  if (error) throwDb("deleteAttendeesByCompany", error);
}

export async function deleteAttendeeById(id: string): Promise<void> {
  const sb = getServerClient();
  const { error } = await sb.from("attendees").delete().eq("id", id);

  if (error) throwDb("deleteAttendeeById", error);
}

export async function deleteAgentCascade(agentId: string): Promise<void> {
  const sb = getServerClient();
  const { error } = await sb.from("agents").delete().eq("id", agentId);

  if (error) throwDb("deleteAgentCascade", error);
}

export async function insertAttendees(rows: AttendeeInsert[]): Promise<void> {
  if (rows.length === 0) return;

  const sb = getServerClient();
  const { error } = await sb.from("attendees").insert(
    rows.map((r) => ({
      ...r,
      interests: r.interests ?? [],
      availability: r.availability ?? [],
    })),
  );

  if (error) throwDb("insertAttendees", error);
}

export async function insertAgent(row: {
  id: string;
  attendee_id: string;
  persona?: Record<string, unknown>;
  networking_goal?: string | null;
  constraints?: Record<string, unknown>;
  status?: string;
}): Promise<void> {
  const sb = getServerClient();
  const { error } = await sb.from("agents").insert({
    persona: {},
    constraints: {},
    status: "idle",
    ...row,
  });

  if (error) throwDb("insertAgent", error);
}

export async function insertGraphEvents(
  rows: Array<{
    requester_id: string;
    type: string;
    source_node_id: string;
    target_node_id?: string | null;
    status?: string;
    message?: string | null;
  }>,
): Promise<void> {
  if (rows.length === 0) return;

  const sb = getServerClient();
  const { error } = await sb.from("graph_events").insert(
    rows.map((r) => ({
      status: "start",
      ...r,
    })),
  );

  if (error) throwDb("insertGraphEvents", error);
}

export async function insertMatchesWithConversations(
  matches: Array<{
    requester_id: string;
    target_id: string;
    score: number;
    reason: string;
    status?: string;
    proposed_time?: string | null;
    conversation: {
      messages_json: Array<{ speaker: string; message: string }>;
      summary: string;
    };
  }>,
): Promise<void> {
  const sb = getServerClient();

  for (const m of matches) {
    const { data: matchRow, error: matchError } = await sb
      .from("matches")
      .insert({
        requester_id: m.requester_id,
        target_id: m.target_id,
        score: m.score,
        reason: m.reason,
        status: m.status ?? "pending",
        proposed_time: m.proposed_time ?? null,
      })
      .select("id")
      .single();

    if (matchError) throwDb("insertMatches", matchError);

    const { error: convError } = await sb.from("conversations").insert({
      match_id: matchRow.id,
      messages_json: m.conversation.messages_json,
      summary: m.conversation.summary,
    });

    if (convError) throwDb("insertConversations", convError);
  }
}
