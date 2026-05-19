"use client";

import { useCallback, useEffect, useState } from "react";
import type { AgentStatusResponse } from "@/lib/dashboard/types";

const POLL_MS = 1500;

export function useAgentStatus(agentId: string) {
  const [data, setData] = useState<AgentStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/agents/${agentId}/status`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const json = (await res.json()) as AgentStatusResponse;
      setData(json);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load status");
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    setLoading(true);
    void fetchStatus();
    const id = window.setInterval(() => void fetchStatus(), POLL_MS);
    return () => window.clearInterval(id);
  }, [fetchStatus]);

  return { data, error, loading, refetch: fetchStatus };
}
