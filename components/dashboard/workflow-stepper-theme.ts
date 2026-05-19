import type { AgentWorkflowStatus } from "@/lib/dashboard/types";

/** Aligns with graph node status colors (ARCHITECTURE.md / status-styles.ts). */
export interface StepTheme {
  connector: string;
  nodeComplete: string;
  nodeActive: string;
  nodeUpcoming: string;
  labelComplete: string;
  labelActive: string;
  ringActive: string;
  glow: string;
}

export const WORKFLOW_STEP_THEME: Record<
  "scanning" | "contacting" | "negotiating" | "done",
  StepTheme
> = {
  scanning: {
    connector: "#38bdf8",
    nodeComplete: "bg-sky-500 border-sky-400 text-white",
    nodeActive:
      "bg-sky-500 border-sky-300 text-white shadow-[0_0_22px_rgba(56,189,248,0.55)]",
    nodeUpcoming: "border-zinc-700/90 bg-zinc-900 text-zinc-600",
    labelComplete: "text-sky-400/90",
    labelActive: "text-sky-300",
    ringActive: "ring-sky-400/40",
    glow: "rgba(56,189,248,0.45)",
  },
  contacting: {
    connector: "#a78bfa",
    nodeComplete: "bg-violet-500 border-violet-400 text-white",
    nodeActive:
      "bg-violet-500 border-violet-300 text-white shadow-[0_0_22px_rgba(167,139,250,0.55)]",
    nodeUpcoming: "border-zinc-700/90 bg-zinc-900 text-zinc-600",
    labelComplete: "text-violet-400/90",
    labelActive: "text-violet-300",
    ringActive: "ring-violet-400/40",
    glow: "rgba(167,139,250,0.45)",
  },
  negotiating: {
    connector: "#fbbf24",
    nodeComplete: "bg-amber-500 border-amber-400 text-white",
    nodeActive:
      "bg-amber-500 border-amber-300 text-white shadow-[0_0_22px_rgba(251,191,36,0.5)]",
    nodeUpcoming: "border-zinc-700/90 bg-zinc-900 text-zinc-600",
    labelComplete: "text-amber-400/90",
    labelActive: "text-amber-300",
    ringActive: "ring-amber-400/40",
    glow: "rgba(251,191,36,0.45)",
  },
  done: {
    connector: "#34d399",
    nodeComplete: "bg-emerald-500 border-emerald-400 text-white",
    nodeActive:
      "bg-emerald-500 border-emerald-300 text-white shadow-[0_0_22px_rgba(52,211,153,0.55)]",
    nodeUpcoming: "border-zinc-700/90 bg-zinc-900 text-zinc-600",
    labelComplete: "text-emerald-400/90",
    labelActive: "text-emerald-300",
    ringActive: "ring-emerald-400/40",
    glow: "rgba(52,211,153,0.45)",
  },
};

export function themeForStep(
  key: AgentWorkflowStatus,
): StepTheme {
  if (key in WORKFLOW_STEP_THEME) {
    return WORKFLOW_STEP_THEME[key as keyof typeof WORKFLOW_STEP_THEME];
  }
  return WORKFLOW_STEP_THEME.scanning;
}

export function themeForStatus(status: AgentWorkflowStatus): StepTheme {
  if (status === "idle" || status === "cancelled") {
    return WORKFLOW_STEP_THEME.scanning;
  }
  if (status in WORKFLOW_STEP_THEME) {
    return WORKFLOW_STEP_THEME[status as keyof typeof WORKFLOW_STEP_THEME];
  }
  return WORKFLOW_STEP_THEME.done;
}
