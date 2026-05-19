import type { OnboardingAnswers, OnboardingStep } from "./onboarding-types";

const STEP_ORDER: OnboardingStep[] = [
  "ask_name",
  "ask_role",
  "ask_interests",
  "ask_goal",
  "ask_availability",
  "confirm",
];

export function nextStep(current: OnboardingStep): OnboardingStep {
  const idx = STEP_ORDER.indexOf(current);
  if (idx === -1 || idx >= STEP_ORDER.length - 1) return "confirm";
  return STEP_ORDER[idx + 1]!;
}

export function applyAnswer(
  step: OnboardingStep,
  text: string,
  answers: OnboardingAnswers,
): OnboardingAnswers {
  const trimmed = text.trim();
  switch (step) {
    case "ask_name":
      return { ...answers, name: trimmed };
    case "ask_role":
      return { ...answers, role: trimmed };
    case "ask_interests":
      return { ...answers, interests: trimmed };
    case "ask_goal":
      return { ...answers, goal: trimmed };
    case "ask_availability":
      return { ...answers, availability: trimmed };
    default:
      return answers;
  }
}

export function isConfirmYes(text: string): boolean {
  const t = text.trim().toLowerCase();
  return ["yes", "y", "ok", "confirm", "да"].includes(t);
}

export function answersComplete(answers: OnboardingAnswers): boolean {
  return Boolean(
    answers.name &&
      answers.role &&
      answers.interests &&
      answers.goal &&
      answers.availability,
  );
}
