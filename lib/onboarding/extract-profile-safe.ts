import {
  extractProfile,
  type OnboardingAnswers,
} from "@/lib/gemini/prompts/extractProfile";
import type { Profile } from "@/lib/gemini/types";
import { DEFAULT_AVAILABILITY } from "@/lib/seed/constants";

function stubProfile(answers: OnboardingAnswers): Profile {
  const interestTags = answers.interests
    .split(/[,;]+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 8);

  return {
    name: answers.name,
    role: answers.role,
    company: answers.role.includes(" at ")
      ? answers.role.split(" at ").slice(1).join(" at ").trim()
      : "",
    interests: interestTags.length > 0 ? interestTags : ["networking", "ai"],
    networking_goal: answers.goal || "Meet relevant people at AI Week Milan.",
    ideal_matches: ["founders", "investors", "enterprise leads"],
    availability: DEFAULT_AVAILABILITY,
  };
}

/**
 * Calls Gemini unless USE_DEMO_FALLBACK=true or the API call fails.
 */
export async function extractProfileSafe(
  answers: OnboardingAnswers,
): Promise<Profile> {
  if (process.env.USE_DEMO_FALLBACK === "true") {
    return stubProfile(answers);
  }

  try {
    return await extractProfile(answers);
  } catch (err) {
    console.warn("[extractProfileSafe] Gemini failed, using stub:", err);
    return stubProfile(answers);
  }
}
