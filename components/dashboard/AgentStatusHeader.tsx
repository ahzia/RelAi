"use client";

import Link from "next/link";
import type { AgentWorkflowStatus } from "@/lib/dashboard/types";
import { useAgentStatus } from "@/hooks/useAgentStatus";

import { WorkflowStepper } from "./WorkflowStepper";

interface AgentStatusHeaderProps {
  agentId: string;
}

export function AgentStatusHeader({ agentId }: AgentStatusHeaderProps) {
  const { data, error, loading } = useAgentStatus(agentId);
  const status = data?.status ?? "idle";

  const stats = data
    ? [
        { label: "Scanned", value: data.counts.attendees_scanned },
        { label: "Contacted", value: data.counts.agents_contacted },
        { label: "Matches", value: data.counts.matches_found },
        {
          label: "Pending",
          value: data.counts.pending_approval,
          accent: data.counts.pending_approval > 0,
        },
      ]
    : [];

  return (
    <header className="shrink-0 border-b border-white/[0.06] bg-zinc-950/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-2 px-3 py-2 sm:px-4 sm:py-2.5">
        {/* Row 1: identity + phase + stats */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <div className="flex min-w-0 items-center gap-2">
            <Link
              href="/"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.03] text-zinc-500 transition-colors hover:border-white/10 hover:text-zinc-200"
              aria-label="Back to home"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M15 18l-6-6 6-6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold tracking-tight text-white">
                  Mission Control
                </span>
                {!loading && data ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-1.5 py-px text-[9px] font-medium uppercase tracking-wider text-emerald-400">
                    <span className="h-1 w-1 rounded-full bg-emerald-400 agent-live-dot" />
                    Live
                  </span>
                ) : null}
              </div>
              <p className="truncate text-[11px] text-zinc-500">
                <span className="text-zinc-300">
                  {data?.user_name ?? "Your agent"}
                </span>
                <span className="mx-1 text-zinc-700">·</span>
                {data?.event_name ?? "AI Week Milan 2026"}
              </p>
            </div>
          </div>

          <div className="hidden h-6 w-px bg-white/[0.06] sm:block" aria-hidden />

          {stats.length > 0 ? (
            <div className="ml-auto flex items-center gap-1 sm:gap-1.5">
              {stats.map((s) => (
                <div
                  key={s.label}
                  className={[
                    "flex items-baseline gap-1 rounded-lg border px-2 py-1 transition-colors duration-300",
                    s.accent
                      ? "border-emerald-500/25 bg-emerald-500/[0.07]"
                      : "border-white/[0.05] bg-white/[0.02]",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "font-mono text-sm font-semibold tabular-nums leading-none",
                      s.accent ? "text-emerald-300" : "text-zinc-100",
                    ].join(" ")}
                  >
                    {s.value}
                  </span>
                  <span className="text-[9px] font-medium uppercase tracking-wide text-zinc-500">
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <WorkflowStepper
          status={status}
          phaseLabel={data?.phase_label ?? (loading ? "Initializing…" : undefined)}
        />

        {error ? (
          <p className="text-[11px] text-rose-400">{error}</p>
        ) : null}
      </div>
    </header>
  );
}
