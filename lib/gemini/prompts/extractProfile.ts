/**
 * extractProfile — Gemini Flash
 *
 * Turns the raw onboarding Q&A from Telegram into a normalized profile JSON.
 *
 * Input shape:
 *   {
 *     "name":          string  // raw answer to "What is your full name?"
 *     "role":          string  // "What is your role and company?"
 *     "interests":     string  // "What topics are you interested in?"
 *     "goal":          string  // "Who do you want to meet?"
 *     "availability":  string  // "When are you available during the event?"
 *   }
 *
 * Output: Profile (see lib/gemini/types.ts)
 */

import { callGemini } from "@/lib/gemini/client";
import { ProfileSchema, type Profile } from "@/lib/gemini/types";

export interface OnboardingAnswers {
  name: string;
  role: string;
  interests: string;
  goal: string;
  availability: string;
}

const SYSTEM_INSTRUCTION = `
You are a networking profile extractor for an event called "AI Week Milan 2026".

Convert the user's raw onboarding answers into a structured JSON profile.

Rules:
- "name": exactly as written, trimmed.
- "role": the person's job title, capitalized normally (e.g. "CTO", "AI Researcher").
- "company": parse from the role answer if present, else "".
- "interests": split into 3–8 short topic tags (lowercase, no punctuation). Example: ["agentic ai","enterprise saas","developer tools"].
- "networking_goal": one concise sentence describing who they want to meet and why.
- "ideal_matches": 3–6 short personas describing the kinds of people they should meet. Example: ["enterprise ai investors","ai infrastructure founders","cto of vertical saas"].
- "availability": array of { "start", "end" } ISO timestamps for the event period (May 19–20, 2026, Milan, CEST timezone offset +02:00). If the user says "afternoon" use 13:00–18:00, "morning" 09:00–12:30, "all day" 09:00–18:00. If unclear, default to one slot per event day, 14:00–17:00.
- Use ISO 8601 with timezone offset, e.g. "2026-05-19T14:00:00+02:00".
- Output JSON only, no markdown, no commentary.
`.trim();

export async function extractProfile(
  answers: OnboardingAnswers,
): Promise<Profile> {
  return callGemini({
    model: "flash",
    systemInstruction: SYSTEM_INSTRUCTION,
    userMessage: JSON.stringify(answers, null, 2),
    schema: ProfileSchema,
    temperature: 0.2,
  });
}
