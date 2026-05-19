import { getServerClient } from "./clients";

export async function insertMatchRecord(input: {
  requesterId: string;
  targetId: string;
  score: number;
  reason: string;
  proposedTime: string | null;
  messagesJson: unknown[];
  summary: string | null;
}): Promise<string> {
  const supabase = getServerClient();

  const { data: matchRow, error: matchErr } = await supabase
    .from("matches")
    .insert({
      requester_id: input.requesterId,
      target_id: input.targetId,
      score: input.score,
      reason: input.reason,
      status: "pending",
      proposed_time: input.proposedTime,
    })
    .select("id")
    .single();

  if (matchErr) throw new Error(`matches insert: ${matchErr.message}`);

  const matchId = matchRow.id as string;

  const { error: convErr } = await supabase.from("conversations").insert({
    match_id: matchId,
    messages_json: input.messagesJson,
    summary: input.summary,
  });

  if (convErr) throw new Error(`conversations insert: ${convErr.message}`);

  return matchId;
}

export async function updateMatchStatus(
  matchId: string,
  status: "approved" | "rejected",
): Promise<{
  matchId: string;
  targetName: string;
  proposedTime: string | null;
} | null> {
  const supabase = getServerClient();

  const { data: match, error: fetchErr } = await supabase
    .from("matches")
    .select("id, proposed_time, target_id")
    .eq("id", matchId)
    .maybeSingle();

  if (fetchErr) throw new Error(`matches select: ${fetchErr.message}`);
  if (!match) return null;

  const { data: attendee, error: attErr } = await supabase
    .from("attendees")
    .select("name")
    .eq("id", match.target_id as string)
    .maybeSingle();

  if (attErr) throw new Error(`attendees select: ${attErr.message}`);

  const { error } = await supabase
    .from("matches")
    .update({ status })
    .eq("id", matchId);

  if (error) throw new Error(`matches update: ${error.message}`);

  return {
    matchId,
    targetName: (attendee?.name as string) ?? "your match",
    proposedTime: match.proposed_time as string | null,
  };
}

export async function listPendingMatchesForAgent(agentId: string): Promise<
  Array<{
    id: string;
    score: number;
    reason: string | null;
    proposed_time: string | null;
    target: { name: string; role: string; company: string | null };
    summary: string | null;
  }>
> {
  const supabase = getServerClient();
  const { data: matches, error } = await supabase
    .from("matches")
    .select("id, score, reason, proposed_time, target_id")
    .eq("requester_id", agentId)
    .eq("status", "pending")
    .order("score", { ascending: false })
    .limit(3);

  if (error) throw new Error(`matches list: ${error.message}`);
  if (!matches?.length) return [];

  const results: Array<{
    id: string;
    score: number;
    reason: string | null;
    proposed_time: string | null;
    target: { name: string; role: string; company: string | null };
    summary: string | null;
  }> = [];

  for (const row of matches) {
    const { data: target } = await supabase
      .from("attendees")
      .select("name, role, company")
      .eq("id", row.target_id as string)
      .maybeSingle();

    const { data: conv } = await supabase
      .from("conversations")
      .select("summary")
      .eq("match_id", row.id as string)
      .maybeSingle();

    results.push({
      id: row.id as string,
      score: row.score as number,
      reason: row.reason as string | null,
      proposed_time: row.proposed_time as string | null,
      target: {
        name: (target?.name as string) ?? "Unknown",
        role: (target?.role as string) ?? "",
        company: (target?.company as string | null) ?? null,
      },
      summary: (conv?.summary as string | null) ?? null,
    });
  }

  return results;
}
