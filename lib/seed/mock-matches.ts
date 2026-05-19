import type { MatchProposal } from "@/types/matches";
import { SEED_AGENT_ID } from "@/lib/seed/constants";

export { SEED_AGENT_ID };

/**
 * Seeded match cards until BE reads from Supabase.
 * IDs are stable so approve/reject stubs can target them later.
 */
export const SEED_MATCHES: MatchProposal[] = [
  {
    id: "match-seed-001",
    target: {
      id: "attendee-sarah",
      name: "Sarah Lin",
      role: "Founder & CEO",
      company: "InferLayer",
    },
    score: 92,
    reason:
      "Both building agent infrastructure for enterprise; complementary GTM (open-source + design partners).",
    why_this_match_matters:
      "Sarah is actively looking for design partners in the same agentic stack you work on — a 20-minute meeting could unlock a pilot integration.",
    suggested_opener:
      "I saw InferLayer’s agent runtime work — we’re solving a similar orchestration problem from the application side.",
    proposed_time: "2026-05-19T14:30:00+02:00",
    status: "pending",
    conversation: [
      {
        speaker: "user_agent",
        message:
          "My principal builds production agent workflows and wants to meet infra founders deploying at scale.",
      },
      {
        speaker: "target_agent",
        message:
          "Sarah is prioritizing design partners who already run multi-step agents in production. Strong overlap on agentic workflows.",
      },
      {
        speaker: "user_agent",
        message: "Proposing a 30-minute intro at 14:30 — both calendars show availability.",
      },
    ],
  },
  {
    id: "match-seed-002",
    target: {
      id: "attendee-priya",
      name: "Priya Anand",
      role: "Partner",
      company: "Holt Capital",
    },
    score: 88,
    reason:
      "Investor thesis aligns with AI infrastructure and developer tools; user goal explicitly mentions enterprise investors.",
    why_this_match_matters:
      "Priya’s fund is actively deploying into agent infrastructure — your production agent story fits their current deal flow.",
    suggested_opener:
      "We’re seeing strong enterprise pull for agent orchestration — would love 15 minutes on how Holt evaluates infra bets.",
    proposed_time: "2026-05-19T15:00:00+02:00",
    status: "pending",
    conversation: [
      {
        speaker: "user_agent",
        message:
          "Principal is a senior AI engineer with live agent deployments seeking investor conversations.",
      },
      {
        speaker: "target_agent",
        message:
          "Priya is screening for teams with production traction in devtools / agent infra. Medium-high interest.",
      },
    ],
  },
  {
    id: "match-seed-003",
    target: {
      id: "attendee-yuki",
      name: "Yuki Tanaka",
      role: "CTO",
      company: "Renkō Logistics",
    },
    score: 79,
    reason:
      "Shared interest in RAG and enterprise copilots; potential technical partnership on retrieval layer.",
    why_this_match_matters:
      "Yuki is hiring AI engineers and evaluating RAG providers — relevant if you want a second path beyond founders/investors.",
    suggested_opener:
      "Your supply-chain copilot work overlaps with our RAG orchestration layer — happy to compare notes.",
    proposed_time: "2026-05-19T16:00:00+02:00",
    status: "pending",
    conversation: [
      {
        speaker: "user_agent",
        message: "Looking for technical peers in enterprise RAG deployments.",
      },
      {
        speaker: "target_agent",
        message: "Yuki wants RAG infra intros; fit is solid but lower priority than fundraising meetings today.",
      },
    ],
  },
];

export function getSeedMatches(agentId: string): MatchProposal[] {
  if (agentId !== SEED_AGENT_ID) return [];
  return SEED_MATCHES.map((m) => ({ ...m }));
}
