import { getSeedMatches } from "@/lib/seed/mock-matches";
import type { MatchesResponse } from "@/types/matches";

/**
 * GET /api/agents/:id/matches
 * Returns match proposals for the dashboard cards.
 * TODO(BE): read from Supabase `matches` + join attendees + conversations.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  const body: MatchesResponse = { matches: getSeedMatches(id) };
  return Response.json(body);
}
