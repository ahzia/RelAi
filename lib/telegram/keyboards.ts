import { Keyboard } from "grammy";

/** Persistent bottom menu — no slash commands required. */
export function mainMenuKeyboard(): Keyboard {
  return new Keyboard()
    .text("Set up my profile")
    .text("Find matches")
    .row()
    .text("Mission Control")
    .text("Try demo")
    .row()
    .text("Help")
    .resized()
    .persistent();
}

export function onboardingConfirmKeyboard(): Keyboard {
  return new Keyboard()
    .text("Yes, create my agent")
    .text("Start over")
    .row()
    .text("Cancel")
    .resized()
    .oneTime();
}

/** Shown while answering onboarding questions. */
export function onboardingProgressKeyboard(): Keyboard {
  return new Keyboard()
    .text("Cancel setup")
    .resized()
    .persistent();
}
