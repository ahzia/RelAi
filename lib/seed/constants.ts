/** Tag on seeded roster rows — used for idempotent re-seed. */
export const SEED_ROSTER_COMPANY = "RelAI Demo Seed";

/** Demo user + agent for FE dashboard before real Telegram users. */
export const SEED_ATTENDEE_ID = "a0000000-0000-4000-8000-000000000001";
export const SEED_AGENT_ID = "b0000000-0000-4000-8000-000000000001";

/** Featured match targets (subset of roster). */
export const SEED_MATCH_TARGET_IDS = [
  "c0000001-0000-4000-8000-000000000001",
  "c0000002-0000-4000-8000-000000000002",
  "c0000003-0000-4000-8000-000000000003",
] as const;

export const SEED_REJECTED_TARGET_IDS = [
  "c0000004-0000-4000-8000-000000000004",
  "c0000005-0000-4000-8000-000000000005",
] as const;

/** Default event-day availability slots (Milan AI Week). */
export const DEFAULT_AVAILABILITY = [
  {
    start: "2026-05-19T10:00:00.000Z",
    end: "2026-05-19T11:00:00.000Z",
  },
  {
    start: "2026-05-19T14:00:00.000Z",
    end: "2026-05-19T15:00:00.000Z",
  },
  {
    start: "2026-05-20T11:00:00.000Z",
    end: "2026-05-20T12:00:00.000Z",
  },
];
