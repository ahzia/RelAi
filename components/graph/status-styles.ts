import type { EdgeStatus, NodeStatus } from "@/lib/dashboard/types";

export interface StatusVisual {
  label: string;
  ring: string;
  glow: string;
  bg: string;
  border: string;
  text: string;
  edge: string;
  pulse?: boolean;
}

export const NODE_STATUS_STYLES: Record<NodeStatus, StatusVisual> = {
  idle: {
    label: "Idle",
    ring: "ring-zinc-600/40",
    glow: "shadow-[0_0_0_rgba(113,113,122,0)]",
    bg: "bg-zinc-900/90",
    border: "border-zinc-700/80",
    text: "text-zinc-400",
    edge: "#52525b",
  },
  scanning: {
    label: "Scanning",
    ring: "ring-sky-400/50",
    glow: "shadow-[0_0_28px_rgba(56,189,248,0.35)]",
    bg: "bg-sky-950/80",
    border: "border-sky-400/60",
    text: "text-sky-200",
    edge: "#38bdf8",
    pulse: true,
  },
  contacting: {
    label: "Contacting",
    ring: "ring-violet-400/50",
    glow: "shadow-[0_0_28px_rgba(167,139,250,0.4)]",
    bg: "bg-violet-950/80",
    border: "border-violet-400/60",
    text: "text-violet-200",
    edge: "#a78bfa",
    pulse: true,
  },
  negotiating: {
    label: "Negotiating",
    ring: "ring-amber-400/50",
    glow: "shadow-[0_0_28px_rgba(251,191,36,0.35)]",
    bg: "bg-amber-950/80",
    border: "border-amber-400/60",
    text: "text-amber-200",
    edge: "#fbbf24",
    pulse: true,
  },
  matched: {
    label: "Matched",
    ring: "ring-emerald-400/50",
    glow: "shadow-[0_0_32px_rgba(52,211,153,0.45)]",
    bg: "bg-emerald-950/80",
    border: "border-emerald-400/60",
    text: "text-emerald-200",
    edge: "#34d399",
  },
  rejected: {
    label: "Rejected",
    ring: "ring-rose-400/40",
    glow: "shadow-[0_0_20px_rgba(251,113,133,0.25)]",
    bg: "bg-rose-950/70",
    border: "border-rose-500/50",
    text: "text-rose-300",
    edge: "#fb7185",
  },
};

export const EDGE_STATUS_STYLES: Record<EdgeStatus, StatusVisual> = {
  scanning: NODE_STATUS_STYLES.scanning,
  contacting: NODE_STATUS_STYLES.contacting,
  negotiating: NODE_STATUS_STYLES.negotiating,
  matched: NODE_STATUS_STYLES.matched,
  rejected: NODE_STATUS_STYLES.rejected,
};

export function statusLegend(): Array<{ status: NodeStatus; label: string }> {
  return (
    ["idle", "scanning", "contacting", "negotiating", "matched", "rejected"] as const
  ).map((status) => ({
    status,
    label: NODE_STATUS_STYLES[status].label,
  }));
}
