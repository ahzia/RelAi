"use client";

import { useCallback, useEffect, useState } from "react";
import type { AgentStatus } from "@/lib/db/types";

const STATUS_LABEL: Record<AgentStatus, string> = {
  idle: "Standing by",
  scanning: "Scanning attendees",
  contacting: "Contacting agents",
  negotiating: "Negotiating meetings",
  done: "Networking complete",
  cancelled: "Stopped",
};

type AgentStatusPayload = {
  agentId: string;
  status: AgentStatus;
  attendeeName: string;
  networkingGoal: string | null;
  matchCount: number;
  pendingMatchCount: number;
  eventCount: number;
};

type AgentStatusHeaderProps = {
  agentId: string;
};

export function AgentStatusHeader({ agentId }: AgentStatusHeaderProps) {
  const [data, setData] = useState<AgentStatusPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/agents/${agentId}/status`, {
        cache: "no-store",
      });
      const body = (await res.json()) as AgentStatusPayload & { error?: string };
      if (!res.ok) {
        throw new Error(body.error ?? `Status unavailable (${res.status})`);
      }
      setData(body);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load status");
    }
  }, [agentId]);

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), 2000);
    return () => clearInterval(id);
  }, [load]);

  if (error) {
    return <p className="mt-2 text-sm text-amber-500/90">{error}</p>;
  }

  if (!data) {
    return (
      <div className="mt-2 h-5 w-48 animate-pulse rounded bg-zinc-800" aria-hidden />
    );
  }

  return (
    <div className="mt-2 space-y-1">
      <p className="text-sm text-zinc-300">
        <span className="font-medium text-zinc-100">{data.attendeeName}</span>
        {" · "}
        {STATUS_LABEL[data.status] ?? data.status}
      </p>
      <p className="text-xs text-zinc-500">
        {data.matchCount} match{data.matchCount === 1 ? "" : "es"}
        {data.pendingMatchCount > 0 &&
          ` · ${data.pendingMatchCount} awaiting your approval`}
        {data.networkingGoal && (
          <span className="mt-1 block line-clamp-2 text-zinc-600">
            Goal: {data.networkingGoal}
          </span>
        )}
      </p>
    </div>
  );
}
