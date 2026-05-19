/**
 * Standalone test for extractProfile.
 *
 * Run with:
 *   pnpm exec tsx --env-file=.env lib/gemini/prompts/extractProfile.test.ts
 */

import { extractProfile } from "./extractProfile";

async function main(): Promise<void> {
  const profile = await extractProfile({
    name: "Ahzia Kirmani",
    role: "Senior AI Engineer at Vertex Labs",
    interests:
      "agentic workflows, retrieval augmented generation, developer tooling, european AI policy",
    goal: "I want to meet AI infrastructure founders and enterprise investors who deploy agents in production.",
    availability: "Free Tuesday afternoon and most of Wednesday.",
  });

  console.log(JSON.stringify(profile, null, 2));

  const checks: Array<[string, boolean]> = [
    ["name non-empty", profile.name.length > 0],
    ["interests >= 3", profile.interests.length >= 3],
    ["ideal_matches >= 2", profile.ideal_matches.length >= 2],
    ["availability >= 1 slot", profile.availability.length >= 1],
    [
      "availability has ISO timestamps",
      profile.availability.every((a) => /T\d\d:\d\d/.test(a.start)),
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

  console.log("\n✓ extractProfile OK");
}

main().catch((err) => {
  console.error("✗", err);
  process.exit(1);
});
