/**
 * Seed fake event roster + demo agent for Mission Control.
 *
 * Run: pnpm db:seed
 */

import { deleteAgentCascade, deleteAttendeeById, deleteAttendeesByCompany, insertAgent, insertAttendees, insertGraphEvents, insertMatchesWithConversations } from "@/lib/db/queries";
import { buildRosterAttendees } from "@/lib/seed/attendees";
import { SEED_ROSTER_COMPANY } from "@/lib/seed/constants";
import {
  SEED_AGENT_ID,
  SEED_ATTENDEE_ID,
  buildDemoAgentRow,
  buildDemoGraphEvents,
  buildDemoMatches,
  buildDemoUserAttendee,
} from "@/lib/seed/seed-agent";

async function main(): Promise<void> {
  console.log("→ Clearing previous seed data…");
  await deleteAgentCascade(SEED_AGENT_ID).catch(() => {
    /* agent may not exist yet */
  });
  await deleteAttendeeById(SEED_ATTENDEE_ID).catch(() => undefined);
  await deleteAttendeesByCompany(SEED_ROSTER_COMPANY);

  const roster = buildRosterAttendees();
  console.log(`→ Inserting ${roster.length} roster attendees…`);
  await insertAttendees(roster);

  console.log("→ Inserting demo user + agent…");
  await insertAttendees([buildDemoUserAttendee()]);
  await insertAgent(buildDemoAgentRow());

  console.log("→ Inserting demo graph events + matches…");
  await insertGraphEvents(buildDemoGraphEvents());
  await insertMatchesWithConversations(buildDemoMatches());

  console.log("");
  console.log("✓ Seed complete.");
  console.log(`  Roster:  ${roster.length} attendees (${SEED_ROSTER_COMPANY})`);
  console.log(`  Demo agent ID (share with FE): ${SEED_AGENT_ID}`);
  console.log(`  Dashboard: ${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/dashboard/${SEED_AGENT_ID}`);
}

main().catch((err) => {
  console.error("✗ Seed failed:", err instanceof Error ? err.message : String(err));
  process.exit(1);
});
