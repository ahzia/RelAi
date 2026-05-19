import { getServerClient } from "./clients";
import {
  ONBOARDING_STORAGE_KEY,
  type OnboardingState,
} from "@/lib/telegram/onboarding-types";

const ONBOARDING_BIO_PREFIX = "__RELAI_ONBOARDING__:";

type AttendeeRow = {
  id: string;
  name: string;
  role: string;
  company: string | null;
  bio: string | null;
  interests: string[];
  goals: string | null;
  availability: unknown;
  telegram_chat_id: number | null;
  constraints?: Record<string, unknown> | null;
};

function parseOnboardingFromConstraints(
  constraints: Record<string, unknown> | null | undefined,
): OnboardingState | null {
  const raw = constraints?.[ONBOARDING_STORAGE_KEY];
  if (!raw || typeof raw !== "object") return null;
  const o = raw as OnboardingState;
  if (!o.step || !o.answers) return null;
  return o;
}

function encodeOnboardingBio(state: OnboardingState): string {
  return ONBOARDING_BIO_PREFIX + JSON.stringify(state);
}

function parseOnboardingFromBio(bio: string | null): OnboardingState | null {
  if (!bio?.startsWith(ONBOARDING_BIO_PREFIX)) return null;
  try {
    const o = JSON.parse(bio.slice(ONBOARDING_BIO_PREFIX.length)) as OnboardingState;
    if (!o.step || !o.answers) return null;
    return o;
  } catch {
    return null;
  }
}

function parseOnboarding(row: AttendeeRow): OnboardingState | null {
  return (
    parseOnboardingFromBio(row.bio) ??
    parseOnboardingFromConstraints(row.constraints)
  );
}

export async function getAttendeeByTelegramChatId(
  chatId: number,
): Promise<AttendeeRow | null> {
  const supabase = getServerClient();
  const { data, error } = await supabase
    .from("attendees")
    .select(
      "id, name, role, company, bio, interests, goals, availability, telegram_chat_id",
    )
    .eq("telegram_chat_id", chatId)
    .maybeSingle();

  if (error) throw new Error(`attendees select: ${error.message}`);
  return data as AttendeeRow | null;
}

export async function getOnboardingState(
  chatId: number,
): Promise<{ attendeeId: string; state: OnboardingState } | null> {
  const row = await getAttendeeByTelegramChatId(chatId);
  if (!row) return null;
  const state = parseOnboarding(row);
  if (!state) return null;
  return { attendeeId: row.id, state };
}

export async function upsertOnboardingStart(chatId: number): Promise<string> {
  const supabase = getServerClient();
  const existing = await getAttendeeByTelegramChatId(chatId);

  const initial: OnboardingState = {
    step: "ask_name",
    answers: {},
  };

  if (existing) {
    const { error } = await supabase
      .from("attendees")
      .update({ bio: encodeOnboardingBio(initial) })
      .eq("id", existing.id);
    if (error) throw new Error(`attendees update: ${error.message}`);
    return existing.id;
  }

  const { data, error } = await supabase
    .from("attendees")
    .insert({
      name: "Pending",
      role: "Pending",
      telegram_chat_id: chatId,
      bio: encodeOnboardingBio(initial),
    })
    .select("id")
    .single();

  if (error) throw new Error(`attendees insert: ${error.message}`);
  return data.id as string;
}

export async function saveOnboardingState(
  attendeeId: string,
  state: OnboardingState,
): Promise<void> {
  const supabase = getServerClient();
  const { error } = await supabase
    .from("attendees")
    .update({ bio: encodeOnboardingBio(state) })
    .eq("id", attendeeId);
  if (error) throw new Error(`attendees update: ${error.message}`);
}

export async function finalizeAttendeeFromProfile(
  attendeeId: string,
  profile: {
    name: string;
    role: string;
    company: string;
    interests: string[];
    networking_goal: string;
    availability: { start: string; end: string }[];
  },
): Promise<void> {
  const supabase = getServerClient();
  const { error } = await supabase
    .from("attendees")
    .update({
      name: profile.name,
      role: profile.role,
      company: profile.company || null,
      bio: profile.networking_goal || null,
      interests: profile.interests,
      goals: profile.networking_goal,
      availability: profile.availability,
    })
    .eq("id", attendeeId);
  if (error) throw new Error(`attendees finalize: ${error.message}`);
}

export async function listAttendeesForMatching(
  excludeAttendeeId: string,
): Promise<
  Array<{
    id: string;
    name: string;
    role: string;
    company: string | null;
    bio: string | null;
    interests: string[];
    goals: string | null;
    availability: { start: string; end: string }[];
  }>
> {
  const supabase = getServerClient();
  const { data, error } = await supabase
    .from("attendees")
    .select("id, name, role, company, bio, interests, goals, availability")
    .neq("id", excludeAttendeeId)
    .neq("name", "Pending");

  if (error) throw new Error(`attendees list: ${error.message}`);

  return (data ?? [])
    .filter((row) => !String(row.bio ?? "").startsWith(ONBOARDING_BIO_PREFIX))
    .map((row) => ({
      id: row.id as string,
      name: row.name as string,
      role: row.role as string,
      company: row.company as string | null,
      bio: row.bio as string | null,
      interests: (row.interests as string[]) ?? [],
      goals: row.goals as string | null,
      availability: Array.isArray(row.availability)
        ? (row.availability as { start: string; end: string }[])
        : [],
    }));
}
