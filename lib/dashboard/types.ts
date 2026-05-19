/**
 * Dashboard API contracts — keep in sync with ARCHITECTURE.md §6.
 */

export type AgentWorkflowStatus =
  | "idle"
  | "scanning"
  | "contacting"
  | "negotiating"
  | "done"
  | "cancelled";

export type NodeStatus =
  | "idle"
  | "scanning"
  | "contacting"
  | "negotiating"
  | "matched"
  | "rejected";

export type EdgeStatus =
  | "scanning"
  | "contacting"
  | "negotiating"
  | "matched"
  | "rejected";

export interface AgentStatusResponse {
  agent_id: string;
  status: AgentWorkflowStatus;
  user_name: string;
  event_name: string;
  phase_label: string;
  counts: {
    attendees_scanned: number;
    agents_contacted: number;
    matches_found: number;
    pending_approval: number;
  };
  updated_at: string;
}

export interface GraphNodeDto {
  id: string;
  label: string;
  role: "center" | "candidate";
  status: NodeStatus;
  score?: number;
  subtitle?: string;
}

export interface GraphEdgeDto {
  id: string;
  source: string;
  target: string;
  animated: boolean;
  status: EdgeStatus;
}

export interface ActivityItem {
  id: string;
  message: string;
  created_at: string;
}

export interface GraphResponse {
  nodes: GraphNodeDto[];
  edges: GraphEdgeDto[];
  activity: ActivityItem[];
}
