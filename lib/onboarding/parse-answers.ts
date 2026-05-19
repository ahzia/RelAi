import type { OnboardingAnswers } from "@/lib/gemini/prompts/extractProfile";

export type OnboardingRequestBody = {
  telegram_chat_id: number;
  /** Ordered: name, role, interests, goal, availability */
  answers?: string[];
  name?: string;
  role?: string;
  interests?: string;
  goal?: string;
  availability?: string;
};

export function parseOnboardingBody(
  body: unknown,
): { ok: true; data: OnboardingRequestBody & OnboardingAnswers } | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Request body must be a JSON object" };
  }

  const o = body as Record<string, unknown>;
  const telegram_chat_id = o.telegram_chat_id;

  if (typeof telegram_chat_id !== "number" || !Number.isFinite(telegram_chat_id)) {
    return { ok: false, error: "telegram_chat_id must be a number" };
  }

  if (Array.isArray(o.answers)) {
    const [name, role, interests, goal, availability] = o.answers.map(String);
    if (!name?.trim() || !role?.trim()) {
      return { ok: false, error: "answers must include at least name and role" };
    }
    return {
      ok: true,
      data: {
        telegram_chat_id,
        answers: o.answers.map(String),
        name: name.trim(),
        role: role.trim(),
        interests: (interests ?? "").trim(),
        goal: (goal ?? "").trim(),
        availability: (availability ?? "").trim(),
      },
    };
  }

  const name = typeof o.name === "string" ? o.name.trim() : "";
  const role = typeof o.role === "string" ? o.role.trim() : "";
  if (!name || !role) {
    return {
      ok: false,
      error: "Provide answers[] or structured name, role, interests, goal, availability",
    };
  }

  return {
    ok: true,
    data: {
      telegram_chat_id,
      name,
      role,
      interests: typeof o.interests === "string" ? o.interests.trim() : "",
      goal: typeof o.goal === "string" ? o.goal.trim() : "",
      availability: typeof o.availability === "string" ? o.availability.trim() : "",
    },
  };
}
