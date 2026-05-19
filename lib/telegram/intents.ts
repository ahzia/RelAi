export type UserIntent =
  | "welcome"
  | "help"
  | "onboard"
  | "networking"
  | "demo"
  | "dashboard"
  | "unknown";

const EXACT_BUTTONS: Record<string, UserIntent> = {
  "set up my profile": "onboard",
  "find matches": "networking",
  "mission control": "dashboard",
  "try demo": "demo",
  help: "help",
  "cancel setup": "help", // handled in onboarding flow first
};

const PATTERNS: Array<{ intent: UserIntent; re: RegExp }> = [
  { intent: "welcome", re: /^(hi|hello|hey|yo|start|good\s+(morning|afternoon|evening))[!.\s]*$/i },
  { intent: "help", re: /\b(help|commands|what can you do)\b/i },
  { intent: "onboard", re: /\b(onboard|sign\s*up|register|set\s*up|create\s*(my\s*)?(profile|agent)|get\s*started)\b/i },
  { intent: "networking", re: /\b(network(ing)?|find\s*matches|match\s*me|meet\s*people|run\s*matching)\b/i },
  { intent: "demo", re: /\b(demo|test\s*run|preview)\b/i },
  { intent: "dashboard", re: /\b(mission\s*control|dashboard|open\s*app)\b/i },
];

export function parseIntent(text: string): UserIntent {
  const normalized = text.trim().toLowerCase();

  if (EXACT_BUTTONS[normalized]) {
    return EXACT_BUTTONS[normalized]!;
  }

  for (const { intent, re } of PATTERNS) {
    if (re.test(normalized)) return intent;
  }

  return "unknown";
}

/** Onboarding confirm step — natural affirmatives. */
export function isOnboardingConfirm(text: string): boolean {
  const t = text.trim().toLowerCase();
  return [
    "yes",
    "y",
    "ok",
    "confirm",
    "yes, create my agent",
    "looks good",
    "correct",
  ].includes(t);
}

export function isOnboardingRestart(text: string): boolean {
  const t = text.trim().toLowerCase();
  return ["start over", "restart"].includes(t);
}

export function isOnboardingCancel(text: string): boolean {
  const t = text.trim().toLowerCase();
  return ["cancel", "cancel setup", "stop", "quit"].includes(t);
}
