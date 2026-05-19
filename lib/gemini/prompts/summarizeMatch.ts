/**
 * summarizeMatch — Gemini Pro
 *
 * Produces the final match-card copy: title, summary, why this matters,
 * a suggested conversation opener, a 2–4 item meeting agenda, and a
 * confidence score.
 *
 * Consumed by:
 *   - the dashboard match cards
 *   - the Telegram bot's final "I found 3 strong matches" message
 *
 * Output: MatchSummary (see lib/gemini/types.ts)
 */

import { callGemini } from "@/lib/gemini/client";
import {
  MatchSummarySchema,
  type Conversation,
  type MatchSummary,
  type Profile,
} from "@/lib/gemini/types";
import type { AttendeeForRanking } from "./rankMatches";

export interface SummarizeMatchInput {
  userProfile: Profile;
  target: AttendeeForRanking;
  rankScore: number;
  rankReason: string;
  conversation: Conversation;
  proposedTime?: string | null;
}

const SYSTEM_INSTRUCTION = `
You write a match summary card for a networking app at AI Week Milan 2026.

The card is read by the USER (the human represented by user_agent in the conversation) so they can decide whether to approve the proposed meeting. It is also sent verbatim in a Telegram message.

Field rules:
- "title": a short, scannable headline. Format: "<Target Name> · <one-line angle>". Example: "Sarah Lin · AI infra founder seeking design partners".
- "summary": 2–3 sentences. Mention who the target is, the strongest shared interest, and what came out of the agent-to-agent conversation.
- "why_this_match_matters": ONE sentence on the strategic value for the user specifically. Be concrete — name the outcome (e.g. "could become a design partner", "warm intro to Holt Capital's fund").
- "suggested_opener": a single sentence the user can literally say when they meet. Friendly, specific, not generic.
- "meeting_agenda": 2–4 short bullet phrases (no full sentences). Example: ["validate tooling fit", "discuss pilot scope", "compare benchmarks"].
- "confidence_score": integer 0–100. High if the agent dialogue showed mutual enthusiasm and concrete next step; lower if there were unresolved objections.

Output JSON only matching:
{
  "title": "",
  "summary": "",
  "why_this_match_matters": "",
  "suggested_opener": "",
  "meeting_agenda": [],
  "confidence_score": 0
}
`.trim();

export async function summarizeMatch(
  input: SummarizeMatchInput,
): Promise<MatchSummary> {
  return callGemini({
    model: "pro",
    systemInstruction: SYSTEM_INSTRUCTION,
    userMessage: JSON.stringify(
      {
        user_profile: input.userProfile,
        target: input.target,
        rank_score: input.rankScore,
        rank_reason: input.rankReason,
        conversation: input.conversation,
        proposed_time: input.proposedTime ?? null,
      },
      null,
      2,
    ),
    schema: MatchSummarySchema,
    temperature: 0.4,
  });
}
