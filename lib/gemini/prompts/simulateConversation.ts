/**
 * simulateConversation — Gemini Pro
 *
 * Generates a short, realistic dialogue between two AI representative agents
 * (one for the user, one for the target attendee). The model must:
 *   - identify shared ground concretely
 *   - surface real objections, not filler
 *   - decide whether the humans should meet
 *
 * This is the highest-demo-value prompt — judges will read these transcripts.
 *
 * Output: Conversation (see lib/gemini/types.ts)
 */

import { callGemini } from "@/lib/gemini/client";
import {
  ConversationSchema,
  type Conversation,
  type Profile,
} from "@/lib/gemini/types";
import type { AttendeeForRanking } from "./rankMatches";

export interface SimulateConversationInput {
  userProfile: Profile;
  target: AttendeeForRanking;
  /** Optional context from rankMatches.reason — helps anchor the dialogue. */
  matchReason?: string;
}

const SYSTEM_INSTRUCTION = `
You simulate a short conversation between two AI "representative agents" at AI Week Milan 2026. One agent represents the user; the other represents a target attendee. Each agent's job is to evaluate whether their human should meet.

Behavior rules:
- Speak in first person as each agent. Be terse and professional.
- 4–8 total turns alternating "user_agent" and "target_agent", starting with "user_agent".
- Each turn must add NEW information: a specific shared interest, an open question, a concrete proposal, or an honest objection.
- The user_agent opens with a one-sentence purpose AND one specific reason this attendee was selected.
- The target_agent must reflect their human's actual interests/goals from the input — do not invent expertise that isn't in their bio.
- The target_agent must raise at least one realistic objection or qualifier (time pressure, fit, priority) — not blanket agreement.
- End with a clear "should_meet" decision: true only if both agents see mutual value.
- "target_interest": "high" if the target_agent expressed enthusiasm, "medium" if curious-but-cautious, "low" if not a fit.
- "objections": list 0–3 short tags (e.g. "limited availability", "unclear ROI", "wrong stage").

Output JSON only, matching:
{
  "conversation": [{"speaker":"user_agent"|"target_agent","message":"..."}],
  "target_interest": "high"|"medium"|"low",
  "objections": [],
  "should_meet": true|false
}
`.trim();

export async function simulateConversation(
  input: SimulateConversationInput,
): Promise<Conversation> {
  return callGemini({
    model: "pro",
    systemInstruction: SYSTEM_INSTRUCTION,
    userMessage: JSON.stringify(
      {
        user_profile: input.userProfile,
        target: input.target,
        match_reason: input.matchReason ?? null,
      },
      null,
      2,
    ),
    schema: ConversationSchema,
    temperature: 0.7,
  });
}
