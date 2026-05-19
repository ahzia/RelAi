/**
 * rankMatches — Gemini Flash
 *
 * Given the user's profile and the full attendee list, returns the top
 * candidates ranked by score with concrete, specific reasons.
 *
 * Input: { profile, attendees }
 * Output: RankMatches (see lib/gemini/types.ts)
 */

import { callGemini } from "@/lib/gemini/client";
import { RankMatchesSchema, type RankMatches, type Profile } from "@/lib/gemini/types";

/** A trimmed attendee record — only the fields Gemini needs to reason about. */
export interface AttendeeForRanking {
  id: string;
  name: string;
  role: string;
  company?: string | null;
  bio?: string | null;
  interests?: string[] | null;
  goals?: string | null;
}

export interface RankMatchesInput {
  profile: Profile;
  attendees: AttendeeForRanking[];
  /** Cap the output size. Default 5. */
  topN?: number;
}

const SYSTEM_INSTRUCTION = `
You are a networking matchmaker for "AI Week Milan 2026".

You receive a user profile and a list of event attendees. Rank the attendees by how valuable a meeting between the user and each attendee would be for BOTH sides. Return only the top N matches.

Scoring rubric (0–100):
- 90–100: rare, high-value overlap of expertise AND goals
- 70–89: clear shared interests + a concrete reason to meet
- 50–69: useful but more exploratory
- below 50: do not include unless topN forces it

Field rules:
- "attendee_id": copy the exact "id" from the input — do not invent UUIDs.
- "score": integer 0–100.
- "reason": ONE specific sentence naming a shared interest or complementary goal. Avoid generic phrases like "great networking opportunity". Mention something concrete from the attendee's bio or goals.
- "shared_interests": 1–4 short tags both sides care about (lowercase).
- "potential_value": short sentence on what each side gains.

Output JSON only:
{ "matches": [ { "attendee_id": "...", "score": 0, "reason": "...", "shared_interests": [], "potential_value": "..." } ] }

Sort matches by score descending. Return AT MOST the requested topN.
`.trim();

export async function rankMatches(
  input: RankMatchesInput,
): Promise<RankMatches> {
  const topN = input.topN ?? 5;

  return callGemini({
    model: "flash",
    systemInstruction: SYSTEM_INSTRUCTION,
    userMessage: JSON.stringify(
      {
        topN,
        profile: input.profile,
        attendees: input.attendees,
      },
      null,
      2,
    ),
    schema: RankMatchesSchema,
    temperature: 0.3,
  });
}
