"use client";

import { useCallback, useEffect, useState } from "react";
import { MatchCard } from "@/components/matches/MatchCard";
import { fetchAgentMatches, postMatchAction } from "@/lib/matches/api";
import { SEED_AGENT_ID } from "@/lib/seed/constants";
import type { MatchProposal } from "@/types/matches";

const POLL_MS = 2000;

type MatchCardsProps = {
  agentId: string;
};

export function MatchCards({ agentId }: MatchCardsProps) {
  const [matches, setMatches] = useState<MatchProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const fetchMatches = useCallback(async () => {
    try {
      const data = await fetchAgentMatches(agentId);
      setMatches(data.matches);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load matches");
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    setLoading(true);
    void fetchMatches();
    const id = setInterval(() => void fetchMatches(), POLL_MS);
    return () => clearInterval(id);
  }, [fetchMatches]);

  const updateStatus = useCallback(
    async (matchId: string, status: "approved" | "rejected") => {
      setPendingId(matchId);
      setMatches((prev) =>
        prev.map((m) => (m.id === matchId ? { ...m, status } : m)),
      );

      try {
        await postMatchAction(
          matchId,
          status === "approved" ? "approve" : "reject",
        );
        await fetchMatches();
      } catch {
        setError("Could not save — refreshing…");
        await fetchMatches();
      } finally {
        setPendingId(null);
      }
    },
    [fetchMatches],
  );

  const pendingCount = matches.filter((m) => m.status === "pending").length;

  return (
    <section className="flex h-full min-h-0 flex-col">
      <header className="mb-3 shrink-0">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
          Top matches
        </h2>
        <p className="text-xs text-zinc-500">
          {loading && matches.length === 0
            ? "Loading proposals…"
            : pendingCount > 0
              ? `${pendingCount} awaiting your approval`
              : matches.length > 0
                ? "All proposals reviewed"
                : "Your agent is still networking"}
        </p>
      </header>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
        {loading && matches.length === 0 &&
          [1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-44 animate-pulse rounded-xl border border-zinc-800 bg-zinc-900/40"
            />
          ))}

        {error && (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}

        {!loading && !error && matches.length === 0 && (
          <p className="rounded-xl border border-dashed border-zinc-800 px-4 py-8 text-center text-sm text-zinc-500">
            No matches yet. Run{" "}
            <code className="text-zinc-400">pnpm db:seed</code> for demo data, or
            wait for your agent to finish networking.
            {agentId !== SEED_AGENT_ID && (
              <>
                <br />
                <a
                  href={`/dashboard/${SEED_AGENT_ID}`}
                  className="mt-2 inline-block text-xs text-indigo-400 hover:underline"
                >
                  Open demo dashboard →
                </a>
              </>
            )}
          </p>
        )}

        {matches.map((match) => (
          <MatchCard
            key={match.id}
            match={match}
            onApprove={(id) => void updateStatus(id, "approved")}
            onReject={(id) => void updateStatus(id, "rejected")}
            actionPending={pendingId === match.id}
          />
        ))}
      </div>
    </section>
  );
}
