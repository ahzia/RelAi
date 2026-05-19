/**
 * Smoke test for Phase 3 onboarding + agent create APIs.
 *
 * Run: pnpm check:onboarding
 * Uses stub profile (no Gemini) unless USE_DEMO_FALLBACK is unset and GEMINI works.
 */

import { POST as postCreate } from "@/app/api/agents/create/route";
import { POST as postOnboarding } from "@/app/api/onboarding/route";
import {
  deleteAttendeeByTelegramChatId,
  getAgentWithAttendee,
} from "@/lib/db/queries";

const TEST_CHAT_ID = 9_999_999_901;

async function main(): Promise<void> {
  process.env.USE_DEMO_FALLBACK = "true";

  console.log("→ POST /api/onboarding…");
  const onboardRes = await postOnboarding(
    new Request("http://localhost/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        telegram_chat_id: TEST_CHAT_ID,
        answers: [
          "Test User",
          "Backend Engineer at RelAI",
          "multi-agent systems, events, APIs",
          "Meet AI founders and investors at Milan AI Week",
          "Tuesday afternoon and Wednesday morning",
        ],
      }),
    }),
  );

  if (onboardRes.status !== 200) {
    console.error("✗ onboarding failed:", await onboardRes.text());
    process.exit(1);
  }

  const onboardBody = (await onboardRes.json()) as {
    attendee_id: string;
    profile: { name: string };
  };
  console.log(`✓ onboarding → attendee ${onboardBody.attendee_id} (${onboardBody.profile.name})`);

  console.log("→ POST /api/agents/create…");
  const createRes = await postCreate(
    new Request("http://localhost/api/agents/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        telegram_chat_id: TEST_CHAT_ID,
        profile: onboardBody.profile,
      }),
    }),
  );

  if (createRes.status !== 201) {
    console.error("✗ agents/create failed:", await createRes.text());
    process.exit(1);
  }

  const createBody = (await createRes.json()) as {
    agentId: string;
    dashboard_url: string;
  };
  console.log(`✓ agents/create → ${createBody.agentId}`);
  console.log(`  ${createBody.dashboard_url}`);

  const agent = await getAgentWithAttendee(createBody.agentId);
  if (!agent || agent.attendee.name !== "Test User") {
    console.error("✗ agent row not found or name mismatch");
    process.exit(1);
  }
  console.log("✓ agent + attendee linked in DB");

  console.log("→ cleanup test rows…");
  await deleteAttendeeByTelegramChatId(TEST_CHAT_ID);
  console.log("✓ onboarding flow OK");
}

main().catch((err) => {
  console.error("✗", err instanceof Error ? err.message : String(err));
  process.exit(1);
});
