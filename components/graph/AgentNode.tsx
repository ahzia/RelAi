"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import type { NodeStatus } from "@/lib/dashboard/types";
import { NODE_STATUS_STYLES } from "./status-styles";

export interface AgentNodeData {
  label: string;
  subtitle?: string;
  role: "center" | "candidate";
  status: NodeStatus;
  score?: number;
}

function AgentNodeComponent({ data }: NodeProps<AgentNodeData>) {
  const visual = NODE_STATUS_STYLES[data.status];
  const isCenter = data.role === "center";

  return (
    <div
      className={[
        "agent-node-root relative flex flex-col items-center",
        "transition-all duration-700 ease-out",
        isCenter ? "min-w-[160px]" : "min-w-[108px]",
      ].join(" ")}
    >
      {isCenter ? (
        <span
          className="pointer-events-none absolute -inset-6 rounded-full border border-dashed border-indigo-500/20 agent-orbit"
          aria-hidden
        />
      ) : null}

      <div
        className={[
          "relative w-full rounded-2xl border backdrop-blur-xl",
          "transition-all duration-700 ease-out",
          visual.bg,
          visual.border,
          visual.glow,
          "ring-1",
          visual.ring,
          isCenter ? "px-4 py-3.5" : "px-2.5 py-2.5",
          visual.pulse ? "agent-node-pulse" : "",
          isCenter ? "agent-node-center" : "",
        ].join(" ")}
      >
        {visual.pulse ? (
          <span
            className="pointer-events-none absolute -inset-px rounded-2xl opacity-50 agent-node-ring"
            aria-hidden
          />
        ) : null}

        <div className="relative flex items-center gap-2">
          <span
            className={[
              "flex shrink-0 items-center justify-center rounded-xl font-bold",
              isCenter ? "h-10 w-10 text-sm" : "h-7 w-7 text-[10px]",
              isCenter
                ? "bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/30"
                : "bg-white/[0.06] text-zinc-300",
            ].join(" ")}
          >
            {isCenter ? "AI" : data.label.charAt(0)}
          </span>
          <div className="min-w-0 flex-1 text-left">
            <p
              className={[
                "truncate font-semibold leading-tight tracking-tight",
                isCenter ? "text-sm text-white" : "text-[11px] text-zinc-100",
              ].join(" ")}
            >
              {data.label}
            </p>
            {data.subtitle ? (
              <p className="mt-0.5 truncate text-[9px] leading-snug text-zinc-500">
                {data.subtitle}
              </p>
            ) : null}
          </div>
        </div>

        <div className="relative mt-2 flex items-center justify-between gap-1.5 border-t border-white/[0.06] pt-2">
          <span
            className={[
              "rounded-md px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider",
              visual.text,
              "bg-black/20",
            ].join(" ")}
          >
            {visual.label}
          </span>
          {data.score != null ? (
            <span className="font-mono text-[10px] font-bold tabular-nums text-white">
              {data.score}%
            </span>
          ) : null}
        </div>
      </div>

      <Handle type="target" position={Position.Top} className="!opacity-0 !w-1 !h-1" />
      <Handle type="source" position={Position.Bottom} className="!opacity-0 !w-1 !h-1" />
    </div>
  );
}

export const AgentNode = memo(AgentNodeComponent);
