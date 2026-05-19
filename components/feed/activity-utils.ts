import type { ActivityItem } from "@/lib/dashboard/types";

export type ActivityTone =
  | "scan"
  | "contact"
  | "match"
  | "schedule"
  | "reject"
  | "done"
  | "default";

export function inferActivityTone(message: string): ActivityTone {
  const m = message.toLowerCase();
  if (m.includes("declined") || m.includes("rejected")) return "reject";
  if (m.includes("approval") || m.includes("awaiting")) return "done";
  if (m.includes("match score") || m.includes("strong match")) return "match";
  if (m.includes("proposed") || m.includes("negotiat") || m.includes("slot"))
    return "schedule";
  if (m.includes("contacting") || m.includes("evaluating")) return "contact";
  if (m.includes("scanning")) return "scan";
  return "default";
}

export const ACTIVITY_TONE_STYLES: Record<
  ActivityTone,
  { dot: string; border: string; icon: string }
> = {
  scan: {
    dot: "bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.5)]",
    border: "border-sky-500/20",
    icon: "text-sky-400",
  },
  contact: {
    dot: "bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.5)]",
    border: "border-violet-500/20",
    icon: "text-violet-400",
  },
  match: {
    dot: "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]",
    border: "border-amber-500/20",
    icon: "text-amber-400",
  },
  schedule: {
    dot: "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.45)]",
    border: "border-amber-500/20",
    icon: "text-amber-300",
  },
  reject: {
    dot: "bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.45)]",
    border: "border-rose-500/20",
    icon: "text-rose-400",
  },
  done: {
    dot: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]",
    border: "border-emerald-500/20",
    icon: "text-emerald-400",
  },
  default: {
    dot: "bg-zinc-500",
    border: "border-white/[0.06]",
    icon: "text-zinc-500",
  },
};

export function formatActivityTime(iso: string): string {
  const ts = Date.parse(iso);
  if (Number.isNaN(ts)) return "";
  const sec = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (sec < 10) return "just now";
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  return `${Math.floor(min / 60)}h ago`;
}

export function sortActivitiesNewestFirst(items: ActivityItem[]): ActivityItem[] {
  return [...items].sort(
    (a, b) => Date.parse(b.created_at) - Date.parse(a.created_at),
  );
}
