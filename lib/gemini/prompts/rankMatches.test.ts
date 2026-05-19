/**
 * Standalone test for rankMatches.
 *
 * Run with:
 *   pnpm exec tsx --env-file=.env lib/gemini/prompts/rankMatches.test.ts
 */

import { randomUUID } from "node:crypto";
import { rankMatches, type AttendeeForRanking } from "./rankMatches";
import type { Profile } from "@/lib/gemini/types";

const profile: Profile = {
  name: "Ahzia Kirmani",
  role: "Senior AI Engineer",
  company: "Vertex Labs",
  interests: ["agentic workflows", "rag", "developer tooling"],
  networking_goal:
    "Meet AI infrastructure founders and enterprise investors who deploy agents in production.",
  ideal_matches: [
    "ai infrastructure founders",
    "enterprise investors",
    "cto of vertical saas",
  ],
  availability: [
    { start: "2026-05-19T14:00:00+02:00", end: "2026-05-19T17:00:00+02:00" },
  ],
};

const attendees: AttendeeForRanking[] = [
  {
    id: randomUUID(),
    name: "Sarah Lin",
    role: "Founder & CEO",
    company: "InferLayer",
    bio: "Building open-source agent infrastructure for enterprise. Previously platform lead at a Fortune 500.",
    interests: ["agentic workflows", "developer tooling", "open source"],
    goals: "Looking for design partners and AI infra investors.",
  },
  {
    id: randomUUID(),
    name: "Marco Rossi",
    role: "HR Innovation Manager",
    company: "Pirelli",
    bio: "Brings AI into recruiting and L&D.",
    interests: ["hr tech", "talent analytics", "employee experience"],
    goals: "Wants to meet HR vendors and consultants.",
  },
  {
    id: randomUUID(),
    name: "Priya Anand",
    role: "Partner",
    company: "Holt Capital",
    bio: "Early-stage investor in AI infrastructure and developer tools.",
    interests: ["ai infrastructure", "developer tools", "open source"],
    goals: "Deal flow for our new $80M fund.",
  },
  {
    id: randomUUID(),
    name: "Tomáš Novák",
    role: "VP Sales",
    company: "ChainGlow",
    bio: "Web3 SaaS for sales automation.",
    interests: ["sales automation", "crypto"],
    goals: "Find enterprise pilots.",
  },
  {
    id: randomUUID(),
    name: "Yuki Tanaka",
    role: "CTO",
    company: "Renkō Logistics",
    bio: "Building RAG-based copilots for supply chain ops.",
    interests: ["rag", "supply chain", "enterprise saas"],
    goals: "Hire AI engineers; meet RAG infra providers.",
  },
];

async function main(): Promise<void> {
  const result = await rankMatches({ profile, attendees, topN: 3 });

  console.log(JSON.stringify(result, null, 2));

  const knownIds = new Set(attendees.map((a) => a.id));

  const checks: Array<[string, boolean]> = [
    ["returned at least 1 match", result.matches.length >= 1],
    ["returned at most 3 matches", result.matches.length <= 3],
    [
      "all attendee_ids exist in input",
      result.matches.every((m) => knownIds.has(m.attendee_id)),
    ],
    [
      "scores in 0–100",
      result.matches.every((m) => m.score >= 0 && m.score <= 100),
    ],
    [
      "scores sorted descending",
      result.matches.every(
        (m, i) => i === 0 || m.score <= result.matches[i - 1]!.score,
      ),
    ],
    [
      "top match scores >= 70 (good fit expected)",
      (result.matches[0]?.score ?? 0) >= 70,
    ],
    [
      "no Tomáš (sales/crypto, weak fit)",
      !result.matches.some((m) => {
        const a = attendees.find((x) => x.id === m.attendee_id);
        return a?.name === "Tomáš Novák";
      }),
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

  console.log("\n✓ rankMatches OK");
}

main().catch((err) => {
  console.error("✗", err);
  process.exit(1);
});
