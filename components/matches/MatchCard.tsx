"use client";

import { useState } from "react";
import type { MatchProposal, MatchStatus } from "@/types/matches";

function formatProposedTime(iso: string | null): string | null {
  if (!iso) return null;
  try {
    return new Intl.DateTimeFormat(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function statusStyles(status: MatchStatus): string {
  switch (status) {
    case "approved":
      return "border-emerald-500/40 bg-emerald-500/10 ring-2 ring-emerald-500/50";
    case "rejected":
      return "border-red-500/30 bg-red-500/5 opacity-75";
    default:
      return "border-zinc-800 bg-zinc-900/60";
  }
}

function speakerLabel(speaker: string): string {
  return speaker === "user_agent" ? "Your agent" : "Their agent";
}

type MatchCardProps = {
  match: MatchProposal;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  actionPending?: boolean;
};

export function MatchCard({
  match,
  onApprove,
  onReject,
  actionPending = false,
}: MatchCardProps) {
  const [expanded, setExpanded] = useState(false);
  const proposedLabel = formatProposedTime(match.proposed_time);
  const isPending = match.status === "pending";

  return (
    <article
      className={`rounded-xl border p-4 transition-colors ${statusStyles(match.status)}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold text-zinc-100">
            {match.target.name}
          </h3>
          <p className="text-sm text-zinc-400">
            {match.target.role}
            {match.target.company ? ` · ${match.target.company}` : ""}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-indigo-500/20 px-2.5 py-1 text-sm font-semibold tabular-nums text-indigo-300">
          {match.score}%
        </span>
      </div>

      {match.status !== "pending" && (
        <p className="mt-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
          {match.status === "approved" ? "Approved" : "Rejected"}
        </p>
      )}

      <p className="mt-3 text-sm leading-relaxed text-zinc-300">
        {match.why_this_match_matters || match.reason}
      </p>

      {proposedLabel && (
        <p className="mt-2 text-xs text-zinc-500">
          Proposed:{" "}
          <span className="text-zinc-300">{proposedLabel}</span>
        </p>
      )}

      {match.suggested_opener && (
        <p className="mt-2 rounded-lg bg-zinc-950/50 px-3 py-2 text-xs italic text-zinc-400">
          &ldquo;{match.suggested_opener}&rdquo;
        </p>
      )}

      {match.conversation && match.conversation.length > 0 && (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-xs font-medium text-indigo-400 hover:text-indigo-300"
          >
            {expanded ? "Hide" : "View"} agent conversation
          </button>
          {expanded && (
            <ul className="mt-2 max-h-40 space-y-2 overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-950/80 p-2">
              {match.conversation.map((turn, i) => (
                <li key={i} className="text-xs">
                  <span className="font-medium text-zinc-500">
                    {speakerLabel(turn.speaker)}:
                  </span>{" "}
                  <span className="text-zinc-300">{turn.message}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {isPending && (
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            disabled={actionPending}
            onClick={() => onApprove(match.id)}
            className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
          >
            Approve
          </button>
          <button
            type="button"
            disabled={actionPending}
            onClick={() => onReject(match.id)}
            className="flex-1 rounded-lg border border-zinc-600 px-3 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:bg-zinc-800 disabled:opacity-50"
          >
            Reject
          </button>
        </div>
      )}
    </article>
  );
}
