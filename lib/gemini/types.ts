/**
 * Output schemas for each Gemini prompt.
 *
 * These are the **contract with BE** — the orchestrator + DB writes consume
 * exactly these shapes. If you need to change a field name, update this file
 * AND post an entry in `updates/` so BE can adjust.
 *
 * Reference: ARCHITECTURE.md §8.
 */

import { z } from "zod";

// ---------- shared ----------

export const AvailabilitySlotSchema = z.object({
  start: z.string().describe("ISO 8601 timestamp"),
  end: z.string().describe("ISO 8601 timestamp"),
});

export type AvailabilitySlot = z.infer<typeof AvailabilitySlotSchema>;

// ---------- extractProfile (Gemini Flash) ----------

export const ProfileSchema = z.object({
  name: z.string(),
  role: z.string(),
  company: z.string().default(""),
  interests: z.array(z.string()).default([]),
  networking_goal: z.string().default(""),
  ideal_matches: z.array(z.string()).default([]),
  availability: z.array(AvailabilitySlotSchema).default([]),
});

export type Profile = z.infer<typeof ProfileSchema>;

// ---------- rankMatches (Gemini Flash) ----------

export const RankedMatchSchema = z.object({
  attendee_id: z.string().uuid(),
  score: z.number().int().min(0).max(100),
  reason: z.string(),
  shared_interests: z.array(z.string()).default([]),
  potential_value: z.string().default(""),
});

export const RankMatchesSchema = z.object({
  matches: z.array(RankedMatchSchema),
});

export type RankedMatch = z.infer<typeof RankedMatchSchema>;
export type RankMatches = z.infer<typeof RankMatchesSchema>;

// ---------- simulateConversation (Gemini Pro) ----------

export const ConversationTurnSchema = z.object({
  speaker: z.enum(["user_agent", "target_agent"]),
  message: z.string(),
});

export const ConversationSchema = z.object({
  conversation: z.array(ConversationTurnSchema).min(2),
  target_interest: z.enum(["high", "medium", "low"]),
  objections: z.array(z.string()).default([]),
  should_meet: z.boolean(),
});

export type ConversationTurn = z.infer<typeof ConversationTurnSchema>;
export type Conversation = z.infer<typeof ConversationSchema>;

// ---------- summarizeMatch (Gemini Pro) ----------

export const MatchSummarySchema = z.object({
  title: z.string(),
  summary: z.string(),
  why_this_match_matters: z.string(),
  suggested_opener: z.string(),
  meeting_agenda: z.array(z.string()).default([]),
  confidence_score: z.number().int().min(0).max(100),
});

export type MatchSummary = z.infer<typeof MatchSummarySchema>;
