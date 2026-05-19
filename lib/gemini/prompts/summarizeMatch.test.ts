/**
 * Standalone test for summarizeMatch.
 *
 * Run with:
 *   pnpm exec tsx --env-file=.env lib/gemini/prompts/summarizeMatch.test.ts
 */

import { randomUUID } from "node:crypto";
import { summarizeMatch } from "./summarizeMatch";
import type { Profile, Conversation } from "@/lib/gemini/types";
import type { AttendeeForRanking } from "./rankMatches";

const userProfile: Profile = {
  name: "Ahzia Kirmani",
  role: "Senior AI Engineer",
  company: "Vertex Labs",
  interests: ["agentic workflows", "rag", "developer tooling"],
  networking_goal:
    "Meet AI infrastructure founders and enterprise investors who deploy agents in production.",
  ideal_matches: ["ai infrastructure founders", "enterprise investors"],
  availability: [
    { start: "2026-05-19T14:00:00+02:00", end: "2026-05-19T17:00:00+02:00" },
  ],
};

const target: AttendeeForRanking = {
  id: randomUUID(),
  name: "Sarah Lin",
  role: "Founder & CEO",
  company: "InferLayer",
  bio: "Building open-source agent infrastructure for enterprise. Previously platform lead at a Fortune 500.",
  interests: ["agentic workflows", "developer tooling", "open source"],
  goals: "Looking for design partners and AI infra investors.",
};

const conversation: Conversation = {
  conversation: [
    {
      speaker: "user_agent",
      message:
        "My user wants to connect with AI infrastructure founders, and your work on open-source agent infra is a direct match.",
    },
    {
      speaker: "target_agent",
      message:
        "Acknowledged. My user is seeking potential design partners. Does Ahzia's team deploy agentic workflows in production?",
    },
    {
      speaker: "user_agent",
      message:
        "Yes, she leads a team deploying RAG-based agents and is evaluating new tooling.",
    },
    {
      speaker: "target_agent",
      message:
        "Strong fit. Time is constrained but feedback from experienced engineers is a priority. Let's schedule 30 minutes.",
    },
  ],
  target_interest: "high",
  objections: ["limited availability"],
  should_meet: true,
};

async function main(): Promise<void> {
  const result = await summarizeMatch({
    userProfile,
    target,
    rankScore: 95,
    rankReason:
      "Sarah is an AI infrastructure founder building open-source agent infra, directly aligning with Ahzia's goal.",
    conversation,
    proposedTime: "2026-05-19T15:00:00+02:00",
  });

  console.log(JSON.stringify(result, null, 2));

  const checks: Array<[string, boolean]> = [
    [
      "title mentions target name",
      result.title.includes("Sarah") || result.title.includes("Lin"),
    ],
    [
      "summary >= 80 chars (substantive)",
      result.summary.length >= 80,
    ],
    [
      "why_this_match_matters is one sentence",
      (result.why_this_match_matters.match(/\./g) ?? []).length <= 2,
    ],
    [
      "suggested_opener is concrete (>=40 chars)",
      result.suggested_opener.length >= 40,
    ],
    ["meeting_agenda 2–4 items", result.meeting_agenda.length >= 2 && result.meeting_agenda.length <= 4],
    ["confidence_score is integer", Number.isInteger(result.confidence_score)],
    [
      "confidence_score >= 70 (strong dialogue)",
      result.confidence_score >= 70,
    ],
  ];

  let failed = 0;
  for (const [label, ok] of checks) {
    console.log(`  ${ok ? "✓" : "✗"} ${label}`);
    if (!ok) failed++;
  }

  if (failed > 0) {
    console.error(`\n✗ ${failed} check(s) failed`);
    process.exit(1);
  }

  console.log("\n✓ summarizeMatch OK");
}

main().catch((err) => {
  console.error("✗", err);
  process.exit(1);
});
