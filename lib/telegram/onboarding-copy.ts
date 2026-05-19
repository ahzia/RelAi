import type { OnboardingStep } from "./onboarding-types";

const STEP_NUMBER: Record<
  Exclude<OnboardingStep, "idle" | "confirm" | "ready">,
  number
> = {
  ask_name: 1,
  ask_role: 2,
  ask_interests: 3,
  ask_goal: 4,
  ask_availability: 5,
};

export const ONBOARDING_TOTAL = 5;

export const ONBOARDING_QUESTIONS: Record<
  Exclude<OnboardingStep, "idle" | "confirm" | "ready">,
  string
> = {
  ask_name: "What is your full name?",
  ask_role: "What is your role and company?",
  ask_interests: "What topics are you interested in?",
  ask_goal: "Who do you want to meet at this event?",
  ask_availability:
    "When are you available during the event? (e.g. May 19 afternoon)",
};

export function formatOnboardingPrompt(
  step: Exclude<OnboardingStep, "idle" | "confirm" | "ready">,
): string {
  const n = STEP_NUMBER[step];
  return `*Question ${n} of ${ONBOARDING_TOTAL}*\n${ONBOARDING_QUESTIONS[step]}`;
}

export function formatConfirmSummary(answers: {
  name?: string;
  role?: string;
  interests?: string;
  goal?: string;
  availability?: string;
}): string {
  return (
    "Here's your profile:\n\n" +
    `• Name: ${answers.name ?? "—"}\n` +
    `• Role & company: ${answers.role ?? "—"}\n` +
    `• Interests: ${answers.interests ?? "—"}\n` +
    `• Looking for: ${answers.goal ?? "—"}\n` +
    `• Availability: ${answers.availability ?? "—"}\n\n` +
    "Tap *Yes, create my agent* below, or *Start over* to change your answers."
  );
}
