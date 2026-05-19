/**
 * Run all fast local tests (no Gemini API calls).
 *
 * Run: pnpm test
 */

import { spawnSync } from "node:child_process";

const steps = [
  { label: "typecheck", cmd: ["pnpm", "typecheck"] },
  { label: "graph unit tests", cmd: ["pnpm", "exec", "tsx", "lib/db/graph.test.ts"] },
  {
    label: "backend smoke test",
    cmd: ["pnpm", "exec", "tsx", "--env-file=.env", "scripts/check-backend.ts"],
  },
];

for (const step of steps) {
  console.log(`\n→ ${step.label}…\n`);
  const result = spawnSync(step.cmd[0]!, step.cmd.slice(1), {
    stdio: "inherit",
    shell: true,
    cwd: process.cwd(),
  });
  if (result.status !== 0) {
    console.error(`\n✗ ${step.label} failed`);
    process.exit(result.status ?? 1);
  }
}

console.log("\n✓ All tests passed.");
