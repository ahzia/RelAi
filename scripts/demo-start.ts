/**
 * Trigger the demo workflow for the seed agent (CLI).
 *
 * Run: pnpm demo:start
 */

import { SEED_AGENT_ID } from "@/lib/seed/constants";
import { runDemoFallback } from "@/lib/seed/demo-fallback";

async function main(): Promise<void> {
  const agentId = process.argv[2] ?? SEED_AGENT_ID;

  console.log(`→ Running demo workflow for agent ${agentId}…`);
  console.log(
    `  Dashboard: ${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/dashboard/${agentId}`,
  );

  await runDemoFallback(agentId);

  console.log("✓ Demo workflow finished.");
}

main().catch((err) => {
  console.error("✗", err instanceof Error ? err.message : String(err));
  process.exit(1);
});
