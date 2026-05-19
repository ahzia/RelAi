/**
 * Smoke-test for the Gemini integration.
 *
 * Run with:
 *   pnpm exec tsx --env-file=.env scripts/check-gemini.ts
 *
 * Calls Flash with a tiny prompt and verifies that:
 *   - GEMINI_API_KEY is set
 *   - The model returns valid JSON
 *   - Our Zod validation pipeline works
 */

import { z } from "zod";
import { callGemini } from "../lib/gemini/client";

const ProbeSchema = z.object({
  ok: z.boolean(),
  echo: z.string(),
});

async function main(): Promise<void> {
  if (!process.env.GEMINI_API_KEY) {
    console.error("✗ GEMINI_API_KEY is not set in .env");
    console.error("  Get one at https://aistudio.google.com/app/apikey");
    process.exit(1);
  }

  console.log("→ Calling Gemini Flash with a tiny JSON probe...");

  const result = await callGemini({
    model: "flash",
    systemInstruction:
      'You are a JSON echo. Always respond with: { "ok": true, "echo": "<the user input>" }.',
    userMessage: "hello relai",
    schema: ProbeSchema,
  });

  console.log("✓ Gemini Flash:", result);

  console.log("→ Calling Gemini Pro with the same probe...");

  const proResult = await callGemini({
    model: "pro",
    systemInstruction:
      'You are a JSON echo. Always respond with: { "ok": true, "echo": "<the user input>" }.',
    userMessage: "hello relai",
    schema: ProbeSchema,
  });

  console.log("✓ Gemini Pro:  ", proResult);
}

main().catch((err) => {
  console.error("✗", err instanceof Error ? err.message : String(err));
  process.exit(1);
});
