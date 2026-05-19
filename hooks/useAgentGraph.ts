"use client";

import { useCallback, useEffect, useState } from "react";
import type { GraphResponse } from "@/lib/dashboard/types";

const POLL_MS = 1500;

export function useAgentGraph(agentId: string) {
  const [data, setData] = useState<GraphResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchGraph = useCallback(async () => {
    try {
      const res = await fetch(`/api/agents/${agentId}/graph`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`Graph ${res.status}`);
      const json = (await res.json()) as GraphResponse;
      setData(json);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load graph");
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    setLoading(true);
    void fetchGraph();
    const id = window.setInterval(() => void fetchGraph(), POLL_MS);
    return () => window.clearInterval(id);
  }, [fetchGraph]);

  return { data, error, loading, refetch: fetchGraph };
}
