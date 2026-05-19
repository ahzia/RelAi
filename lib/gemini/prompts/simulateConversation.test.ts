/**
 * Standalone test for simulateConversation.
 *
 * Run with:
 *   pnpm exec tsx --env-file=.env lib/gemini/prompts/simulateConversation.test.ts
 */

import { randomUUID } from "node:crypto";
import { simulateConversation } from "./simulateConversation";
import type { Profile } from "@/lib/gemini/types";
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

async function main(): Promise<void> {
  const result = await simulateConversation({
    userProfile,
    target,
    matchReason:
      "Sarah is an AI infrastructure founder building agent infra, directly aligning with Ahzia's goal.",
  });

  console.log(JSON.stringify(result, null, 2));

  const speakers = result.conversation.map((t) => t.speaker);
  const alternating = speakers.every(
    (s, i) => i === 0 || s !== speakers[i - 1],
  );

  const checks: Array<[string, boolean]> = [
    [">= 4 turns", result.conversation.length >= 4],
    ["<= 8 turns", result.conversation.length <= 8],
    ["starts with user_agent", speakers[0] === "user_agent"],
    ["alternating speakers", alternating],
    [
      "all messages non-empty",
      result.conversation.every((t) => t.message.trim().length > 10),
    ],
    [
      "target_interest enum valid",
      ["high", "medium", "low"].includes(result.target_interest),
    ],
    ["should_meet is boolean", typeof result.should_meet === "boolean"],
    [
      "good match → should_meet true (high-fit case)",
      result.should_meet === true && result.target_interest !== "low",
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

  console.log("\n✓ simulateConversation OK");
}

main().catch((err) => {
  console.error("✗", err);
  process.exit(1);
});
