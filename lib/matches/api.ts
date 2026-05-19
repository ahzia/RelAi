import type { MatchesResponse } from "@/types/matches";

type ApiErrorBody = { error?: string };

export async function fetchAgentMatches(
  agentId: string,
): Promise<MatchesResponse> {
  const res = await fetch(`/api/agents/${agentId}/matches`, {
    cache: "no-store",
  });

  const body = (await res.json()) as MatchesResponse & ApiErrorBody;

  if (!res.ok) {
    throw new Error(body.error ?? `Failed to load matches (${res.status})`);
  }

  if (!Array.isArray(body.matches)) {
    throw new Error("Invalid matches response from server");
  }

  return { matches: body.matches };
}

export async function postMatchAction(
  matchId: string,
  action: "approve" | "reject",
): Promise<void> {
  const res = await fetch(`/api/matches/${matchId}/${action}`, {
    method: "POST",
  });

  const body = (await res.json()) as ApiErrorBody & { ok?: boolean };

  if (!res.ok) {
    throw new Error(body.error ?? `Action failed (${res.status})`);
  }
}
