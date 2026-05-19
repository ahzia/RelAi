export type OnboardingStep =
  | "idle"
  | "ask_name"
  | "ask_role"
  | "ask_interests"
  | "ask_goal"
  | "ask_availability"
  | "confirm"
  | "ready";

export interface OnboardingAnswers {
  name?: string;
  role?: string;
  interests?: string;
  goal?: string;
  availability?: string;
}

export interface OnboardingState {
  step: OnboardingStep;
  answers: OnboardingAnswers;
}

export const ONBOARDING_STORAGE_KEY = "onboarding";
