import {
  extractProfile,
  type OnboardingAnswers as ExtractProfileAnswers,
} from "@/lib/gemini/prompts/extractProfile";
import type { OnboardingAnswers } from "@/lib/telegram/onboarding-types";
import {
  finalizeAttendeeFromProfile,
  getAttendeeByTelegramChatId,
  getOnboardingState,
  saveOnboardingState,
  upsertOnboardingStart,
} from "@/lib/db/attendees";
import { createAgentForAttendee, getAgentByAttendeeId } from "@/lib/db/agents";
import {
  formatConfirmSummary,
  formatOnboardingPrompt,
} from "@/lib/telegram/onboarding-copy";
import {
  applyAnswer,
  answersComplete,
  nextStep,
} from "@/lib/telegram/onboarding-fsm";
import {
  isOnboardingCancel,
  isOnboardingConfirm,
  isOnboardingRestart,
} from "@/lib/telegram/intents";
import type { OnboardingState } from "@/lib/telegram/onboarding-types";
import { startAgentNetworking } from "./agent-start-service";

export type OnboardingReply = { messages: string[]; agentId?: string };

export async function cancelOnboarding(chatId: number): Promise<OnboardingReply> {
  const row = await getAttendeeByTelegramChatId(chatId);
  if (row) {
    await saveOnboardingState(row.id, { step: "idle", answers: {} });
  }
  return {
    messages: [
      "Setup cancelled. Tap *Set up my profile* whenever you're ready.",
    ],
  };
}

export async function beginOnboarding(chatId: number): Promise<OnboardingReply> {
  await upsertOnboardingStart(chatId);
  return {
    messages: [
      "Let's set up your networking profile — about 2 minutes, five questions.\n\n" +
        formatOnboardingPrompt("ask_name"),
    ],
  };
}

export async function handleOnboardingText(
  chatId: number,
  text: string,
): Promise<OnboardingReply | null> {
  const row = await getAttendeeByTelegramChatId(chatId);
  const stored = await getOnboardingState(chatId);

  if (!row || !stored) return null;

  const { attendeeId, state } = stored;

  if (state.step === "ready") {
    const existing = await getAgentByAttendeeId(attendeeId);
    if (existing) {
      return {
        messages: [
          "You already have an agent. Tap *Find matches* or type *find matches* to run again, or *Try demo* for a preview.",
        ],
        agentId: existing.id,
      };
    }
  }

  if (isOnboardingCancel(text)) {
    return cancelOnboarding(chatId);
  }

  if (state.step === "confirm") {
    if (isOnboardingRestart(text)) {
      return beginOnboarding(chatId);
    }
    if (!isOnboardingConfirm(text)) {
      return {
        messages: [
          "Tap *Yes, create my agent* to confirm, or *Start over* to change your answers.",
        ],
      };
    }
    return completeOnboarding(chatId, attendeeId, state.answers);
  }

  if (state.step === "idle" || state.step === "ready") {
    return beginOnboarding(chatId);
  }

  const updatedAnswers = applyAnswer(state.step, text, state.answers);
  const following = nextStep(state.step);

  if (following === "confirm") {
    if (!answersComplete(updatedAnswers)) {
      const newState: OnboardingState = {
        step: "ask_name",
        answers: updatedAnswers,
      };
      await saveOnboardingState(attendeeId, newState);
      return {
        messages: [
          "Some answers are missing. Let's restart.\n\n" +
            formatOnboardingPrompt("ask_name"),
        ],
      };
    }

    const newState: OnboardingState = {
      step: "confirm",
      answers: updatedAnswers,
    };
    await saveOnboardingState(attendeeId, newState);
    return { messages: [formatConfirmSummary(updatedAnswers)] };
  }

  const newState: OnboardingState = {
    step: following,
    answers: updatedAnswers,
  };
  await saveOnboardingState(attendeeId, newState);

  return {
    messages: [
      formatOnboardingPrompt(
        following as Parameters<typeof formatOnboardingPrompt>[0],
      ),
    ],
  };
}

async function completeOnboarding(
  chatId: number,
  attendeeId: string,
  answers: OnboardingAnswers,
): Promise<OnboardingReply> {
  const payload: ExtractProfileAnswers = {
    name: answers.name!,
    role: answers.role!,
    interests: answers.interests!,
    goal: answers.goal!,
    availability: answers.availability!,
  };

  const profile = await extractProfile(payload);

  await finalizeAttendeeFromProfile(attendeeId, {
    name: profile.name,
    role: profile.role,
    company: profile.company,
    interests: profile.interests,
    networking_goal: profile.networking_goal,
    availability: profile.availability,
  });

  const agentId = await createAgentForAttendee(attendeeId, profile);

  const readyState: OnboardingState = { step: "ready", answers: payload };
  await saveOnboardingState(attendeeId, readyState);

  void startAgentNetworking({
    agentId,
    notifyChatId: chatId,
  }).catch((err) => {
    console.error("[onboarding] startAgentNetworking failed:", err);
  });

  return {
    messages: [
      "Great. I'm creating your AI networking agent now.\n\n" +
        "I'll scan the event network and talk to other attendee agents. " +
        "You'll get your Mission Control link and top matches here shortly.",
    ],
    agentId,
  };
}
