/**
 * Scripted Mission Control demo for `seed-agent`.
 * Cycles every ~48s so polling shows a live networking sequence.
 */

import type {
  ActivityItem,
  AgentStatusResponse,
  GraphEdgeDto,
  GraphNodeDto,
  GraphResponse,
  NodeStatus,
} from "@/lib/dashboard/types";

export const DEMO_CYCLE_MS = 48_000;
const CENTER_ID = "center-agent";

const CANDIDATES: Array<{
  id: string;
  label: string;
  subtitle: string;
  finalScore?: number;
  outcome: "matched" | "rejected" | "pending";
}> = [
  {
    id: "c-sarah",
    label: "Sarah Lin",
    subtitle: "Founder · InferLayer",
    finalScore: 92,
    outcome: "matched",
  },
  {
    id: "c-priya",
    label: "Priya Anand",
    subtitle: "Partner · Holt Capital",
    finalScore: 88,
    outcome: "matched",
  },
  {
    id: "c-marco",
    label: "Marco Rossi",
    subtitle: "CTO · NovaSaaS",
    finalScore: 81,
    outcome: "matched",
  },
  {
    id: "c-elena",
    label: "Elena Varga",
    subtitle: "VP Innovation · Helix Corp",
    finalScore: 54,
    outcome: "rejected",
  },
  {
    id: "c-tomas",
    label: "Tomáš Novák",
    subtitle: "VP Sales · CloudBridge",
    finalScore: 41,
    outcome: "rejected",
  },
  {
    id: "c-amelia",
    label: "Amelia Chen",
    subtitle: "AI Researcher · PoliMi",
    outcome: "pending",
  },
  {
    id: "c-james",
    label: "James Okonkwo",
    subtitle: "Mentor · Startup Studio",
    outcome: "pending",
  },
  {
    id: "c-luca",
    label: "Luca Bianchi",
    subtitle: "Product · FinAgent",
    outcome: "pending",
  },
];

type DemoPhase = "scanning" | "contacting" | "negotiating" | "done";

function getElapsedMs(): number {
  return Date.now() % DEMO_CYCLE_MS;
}

function getPhase(): DemoPhase {
  const t = getElapsedMs();
  if (t < 8_000) return "scanning";
  if (t < 22_000) return "contacting";
  if (t < 38_000) return "negotiating";
  return "done";
}

function nodeStatusForCandidate(
  candidateId: string,
  phase: DemoPhase,
): NodeStatus {
  const c = CANDIDATES.find((x) => x.id === candidateId);
  if (!c) return "idle";

  if (phase === "scanning") {
    return ["c-sarah", "c-priya", "c-marco", "c-elena"].includes(candidateId)
      ? "scanning"
      : "idle";
  }

  if (phase === "contacting") {
    if (["c-sarah", "c-priya", "c-marco", "c-elena", "c-tomas"].includes(candidateId)) {
      return "contacting";
    }
    return "idle";
  }

  if (phase === "negotiating") {
    if (c.outcome === "matched") return "negotiating";
    if (c.outcome === "rejected") return "rejected";
    return "idle";
  }

  // done
  if (c.outcome === "matched") return "matched";
  if (c.outcome === "rejected") return "rejected";
  return "idle";
}

function centerStatus(phase: DemoPhase): NodeStatus {
  if (phase === "done") return "matched";
  if (phase === "negotiating") return "negotiating";
  if (phase === "contacting") return "contacting";
  return "scanning";
}

export function buildDemoStatus(agentId = "seed-agent"): AgentStatusResponse {
  const phase = getPhase();
  const statusMap = {
    scanning: {
      status: "scanning" as const,
      phase_label: "Scanning the event network",
      counts: {
        attendees_scanned: 42,
        agents_contacted: 0,
        matches_found: 0,
        pending_approval: 0,
      },
    },
    contacting: {
      status: "contacting" as const,
      phase_label: "Contacting attendee agents",
      counts: {
        attendees_scanned: 42,
        agents_contacted: 5,
        matches_found: 0,
        pending_approval: 0,
      },
    },
    negotiating: {
      status: "negotiating" as const,
      phase_label: "Negotiating meeting slots",
      counts: {
        attendees_scanned: 42,
        agents_contacted: 5,
        matches_found: 3,
        pending_approval: 0,
      },
    },
    done: {
      status: "done" as const,
      phase_label: "3 strong matches ready for approval",
      counts: {
        attendees_scanned: 42,
        agents_contacted: 5,
        matches_found: 3,
        pending_approval: 3,
      },
    },
  };

  const block = statusMap[phase];

  return {
    agent_id: agentId,
    user_name: "Alex Morgan",
    event_name: "AI Week Milan 2026",
    updated_at: new Date().toISOString(),
    ...block,
  };
}

export function buildDemoGraph(agentId = "seed-agent"): GraphResponse {
  const phase = getPhase();
  const centerSt = centerStatus(phase);

  const nodes: GraphNodeDto[] = [
    {
      id: CENTER_ID,
      label: "Your Agent",
      subtitle: "Alex Morgan · AI Engineer",
      role: "center",
      status: centerSt,
    },
    ...CANDIDATES.map((c) => ({
      id: c.id,
      label: c.label,
      subtitle: c.subtitle,
      role: "candidate" as const,
      status: nodeStatusForCandidate(c.id, phase),
      score:
        nodeStatusForCandidate(c.id, phase) === "matched" ||
        nodeStatusForCandidate(c.id, phase) === "negotiating"
          ? c.finalScore
          : undefined,
    })),
  ];

  const activeTargets = new Set<string>();
  if (phase !== "scanning") {
    ["c-sarah", "c-priya", "c-marco", "c-elena", "c-tomas"].forEach((id) =>
      activeTargets.add(id),
    );
  } else {
    ["c-sarah", "c-priya", "c-marco", "c-elena"].forEach((id) =>
      activeTargets.add(id),
    );
  }

  const edges: GraphEdgeDto[] = [...activeTargets].map((targetId) => {
    const ns = nodeStatusForCandidate(targetId, phase);
    const edgeStatus =
      ns === "matched"
        ? "matched"
        : ns === "rejected"
          ? "rejected"
          : ns === "negotiating"
            ? "negotiating"
            : ns === "contacting"
              ? "contacting"
              : "scanning";

    return {
      id: `e-${CENTER_ID}-${targetId}`,
      source: CENTER_ID,
      target: targetId,
      animated: ["contacting", "negotiating", "scanning"].includes(edgeStatus),
      status: edgeStatus,
    };
  });

  const activity = buildDemoActivity(phase);

  return { nodes, edges, activity };
}

function buildDemoActivity(phase: DemoPhase): ActivityItem[] {
  const now = Date.now();
  const iso = (offsetSec: number) =>
    new Date(now - offsetSec * 1000).toISOString();

  const base: ActivityItem[] = [
    {
      id: "a-1",
      message: "Scanning 42 attendees in the event roster",
      created_at: iso(28),
    },
  ];

  if (phase === "scanning") return base;

  const contacting: ActivityItem[] = [
    ...base,
    {
      id: "a-2",
      message: "Contacting Sarah Lin's agent — InferLayer",
      created_at: iso(18),
    },
    {
      id: "a-3",
      message: "Contacting Priya Anand's agent — Holt Capital",
      created_at: iso(14),
    },
    {
      id: "a-4",
      message: "Sarah's agent is evaluating mutual fit",
      created_at: iso(10),
    },
  ];

  if (phase === "contacting") return contacting;

  const negotiating: ActivityItem[] = [
    ...contacting,
    {
      id: "a-5",
      message: "Match score with Sarah Lin: 92%",
      created_at: iso(8),
    },
    {
      id: "a-6",
      message: "Negotiating slot — proposed 14:30 CEST",
      created_at: iso(5),
    },
    {
      id: "a-7",
      message: "Tomáš Novák's agent declined — low strategic overlap",
      created_at: iso(3),
    },
  ];

  if (phase === "negotiating") return negotiating;

  return [
    ...negotiating,
    {
      id: "a-8",
      message: "3 meetings awaiting your approval in Telegram",
      created_at: iso(1),
    },
  ];
}

export function isDemoAgentId(agentId: string): boolean {
  return agentId === "seed-agent";
}
