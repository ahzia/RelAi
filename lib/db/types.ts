/**
 * Database row types and API response shapes (ARCHITECTURE.md §5–6).
 */

export type AgentStatus =
  | "idle"
  | "scanning"
  | "contacting"
  | "negotiating"
  | "done"
  | "cancelled";

export type MatchStatus = "pending" | "approved" | "rejected";

export type GraphEventType =
  | "scanning"
  | "contacting"
  | "negotiating"
  | "matched"
  | "rejected"
  | "scheduled";

export type GraphEventStatus = "start" | "end";

export type GraphNodeStatus =
  | "idle"
  | "scanning"
  | "contacting"
  | "negotiating"
  | "matched"
  | "rejected";

export type AvailabilitySlot = {
  start: string;
  end: string;
};

export type Attendee = {
  id: string;
  name: string;
  role: string;
  company: string | null;
  bio: string | null;
  interests: string[];
  goals: string | null;
  availability: AvailabilitySlot[];
  telegram_chat_id: number | null;
  created_at: string;
};

export type Agent = {
  id: string;
  attendee_id: string;
  persona: Record<string, unknown>;
  networking_goal: string | null;
  constraints: Record<string, unknown>;
  status: AgentStatus;
  created_at: string;
};

export type AgentWithAttendee = Agent & {
  attendee: Attendee;
};

export type Match = {
  id: string;
  requester_id: string;
  target_id: string;
  score: number;
  reason: string | null;
  status: MatchStatus;
  proposed_time: string | null;
  created_at: string;
};

export type MatchWithTarget = Match & {
  target: Attendee;
};

export type Conversation = {
  id: string;
  match_id: string;
  messages_json: Array<{ speaker: string; message: string }>;
  summary: string | null;
  created_at: string;
};

export type GraphEvent = {
  id: string;
  requester_id: string;
  type: GraphEventType;
  source_node_id: string;
  target_node_id: string | null;
  status: GraphEventStatus;
  message: string | null;
  created_at: string;
};

/** GET /api/agents/:id/status */
export type AgentStatusResponse = {
  agentId: string;
  status: AgentStatus;
  attendeeName: string;
  networkingGoal: string | null;
  matchCount: number;
  pendingMatchCount: number;
  eventCount: number;
};

/** GET /api/agents/:id/graph — ARCHITECTURE.md §6 */
export type GraphResponse = {
  nodes: Array<{
    id: string;
    label: string;
    role: "center" | "candidate";
    status: GraphNodeStatus;
    score?: number;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    animated: boolean;
    status: Exclude<GraphEventType, "scheduled">;
  }>;
  activity: Array<{ id: string; message: string; created_at: string }>;
};

/** GET /api/agents/:id/matches */
export type MatchCardResponse = {
  id: string;
  score: number;
  reason: string | null;
  status: MatchStatus;
  proposed_time: string | null;
  target: {
    id: string;
    name: string;
    role: string;
    company: string | null;
  };
  summary: string | null;
};

export type AttendeeInsert = {
  id?: string;
  name: string;
  role: string;
  company?: string | null;
  bio?: string | null;
  interests?: string[];
  goals?: string | null;
  availability?: AvailabilitySlot[];
  telegram_chat_id?: number | null;
};
