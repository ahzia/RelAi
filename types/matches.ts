/**
 * Frontend contract for GET /api/agents/:id/matches
 * @see ARCHITECTURE.md §5 (matches) + Idea.md § Match Cards
 */

export type MatchStatus = "pending" | "approved" | "rejected";

export type ConversationTurn = {
  speaker: "user_agent" | "target_agent" | string;
  message: string;
};

export type MatchProposal = {
  id: string;
  target: {
    id: string;
    name: string;
    role: string;
    company: string;
  };
  score: number;
  reason: string;
  why_this_match_matters: string;
  suggested_opener?: string;
  proposed_time: string | null;
  status: MatchStatus;
  conversation?: ConversationTurn[];
};

export type MatchesResponse = {
  matches: MatchProposal[];
};
