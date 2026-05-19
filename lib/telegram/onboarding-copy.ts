import type { OnboardingStep } from "./onboarding-types";

export const ONBOARDING_QUESTIONS: Record<
  Exclude<OnboardingStep, "idle" | "confirm" | "ready">,
  string
> = {
  ask_name: "What is your full name?",
  ask_role: "What is your role and company?",
  ask_interests: "What topics are you interested in?",
  ask_goal: "Who do you want to meet at this event?",
  ask_availability: "When are you available during the event? (e.g. May 19 afternoon)",
};

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
    "Reply **yes** to create your agent, or send /onboard to start over."
  );
}
