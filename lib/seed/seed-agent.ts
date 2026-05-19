import type { AttendeeInsert } from "@/lib/db/types";
import {
  DEFAULT_AVAILABILITY,
  SEED_AGENT_ID,
  SEED_ATTENDEE_ID,
  SEED_MATCH_TARGET_IDS,
  SEED_REJECTED_TARGET_IDS,
} from "@/lib/seed/constants";

export { SEED_AGENT_ID, SEED_ATTENDEE_ID } from "@/lib/seed/constants";

export function buildDemoUserAttendee(): AttendeeInsert {
  return {
    id: SEED_ATTENDEE_ID,
    name: "Alex Chen",
    role: "Founder",
    company: "RelAI Demo User",
    bio: "Building agent-native tools for professional networking at live events.",
    interests: ["multi-agent systems", "events", "Gemini", "enterprise SaaS"],
    goals:
      "Meet AI infrastructure founders, enterprise investors, and corporate innovation leads at AI Week Milan.",
    availability: DEFAULT_AVAILABILITY,
  };
}

export function buildDemoAgentRow() {
  return {
    id: SEED_AGENT_ID,
    attendee_id: SEED_ATTENDEE_ID,
    persona: {
      tone: "direct, curious, founder-to-founder",
      strengths: ["technical depth", "partnership building"],
    },
    networking_goal:
      "Find 3 high-signal meetings: one investor, one enterprise pilot lead, one infra founder.",
    constraints: { availability: DEFAULT_AVAILABILITY },
    status: "done" as const,
  };
}

export function buildDemoGraphEvents() {
  const agentId = SEED_AGENT_ID;
  const rows: Array<{
    requester_id: string;
    type: string;
    source_node_id: string;
    target_node_id?: string | null;
    status: string;
    message: string;
  }> = [
    {
      requester_id: agentId,
      type: "scanning",
      source_node_id: agentId,
      status: "start",
      message: "Scanning 38 attendees at AI Week Milan…",
    },
    {
      requester_id: agentId,
      type: "scanning",
      source_node_id: agentId,
      status: "end",
      message: "Shortlisted 8 candidates for agent-to-agent evaluation.",
    },
  ];

  for (const targetId of SEED_MATCH_TARGET_IDS) {
    rows.push(
      {
        requester_id: agentId,
        type: "contacting",
        source_node_id: agentId,
        target_node_id: targetId,
        status: "start",
        message: `Contacting ${labelFor(targetId)}'s agent…`,
      },
      {
        requester_id: agentId,
        type: "negotiating",
        source_node_id: agentId,
        target_node_id: targetId,
        status: "start",
        message: `Negotiating meeting slot with ${labelFor(targetId)}'s agent.`,
      },
      {
        requester_id: agentId,
        type: "matched",
        source_node_id: agentId,
        target_node_id: targetId,
        status: "end",
        message: `Strong match confirmed with ${labelFor(targetId)}.`,
      },
    );
  }

  for (const targetId of SEED_REJECTED_TARGET_IDS) {
    rows.push(
      {
        requester_id: agentId,
        type: "contacting",
        source_node_id: agentId,
        target_node_id: targetId,
        status: "start",
        message: `Contacting ${labelFor(targetId)}'s agent…`,
      },
      {
        requester_id: agentId,
        type: "rejected",
        source_node_id: agentId,
        target_node_id: targetId,
        status: "end",
        message: `Low mutual fit with ${labelFor(targetId)} — skipping.`,
      },
    );
  }

  return rows;
}

function labelFor(targetId: string): string {
  const labels: Record<string, string> = {
    "c0000001-0000-4000-8000-000000000001": "Sarah Okonkwo",
    "c0000002-0000-4000-8000-000000000002": "Marco Bellini",
    "c0000003-0000-4000-8000-000000000003": "Elena Vasquez",
    "c0000004-0000-4000-8000-000000000004": "James Whitfield",
    "c0000005-0000-4000-8000-000000000005": "Dr. Yuki Tanaka",
  };
  return labels[targetId] ?? "attendee";
}

export function buildDemoMatches() {
  return [
    {
      requester_id: SEED_AGENT_ID,
      target_id: SEED_MATCH_TARGET_IDS[0],
      score: 92,
      reason:
        "Shared focus on AI infrastructure and enterprise inference — complementary GTM vs platform depth.",
      status: "pending",
      proposed_time: "2026-05-19T14:00:00.000Z",
      conversation: {
        messages_json: [
          {
            speaker: "user_agent",
            message:
              "We're building multi-agent networking for live events — your inference platform could be a great integration partner.",
          },
          {
            speaker: "target_agent",
            message:
              "We're actively meeting teams shipping agent orchestration. Happy to explore a design-partner slot tomorrow afternoon.",
          },
        ],
        summary:
          "High alignment on enterprise AI infrastructure; both sides want a 30-minute technical + partnership conversation.",
      },
    },
    {
      requester_id: SEED_AGENT_ID,
      target_id: SEED_MATCH_TARGET_IDS[1],
      score: 88,
      reason:
        "Investor mandate matches your stage and vertical — strong fit for a fundraising intro at the event.",
      status: "pending",
      proposed_time: "2026-05-19T10:00:00.000Z",
      conversation: {
        messages_json: [
          {
            speaker: "user_agent",
            message:
              "We're pre-Series A with early enterprise pilots in agentic workflows — looking for lead investors who understand multi-agent systems.",
          },
          {
            speaker: "target_agent",
            message:
              "We lead rounds in applied AI with real workflows. Send metrics on pilot conversion — I have a 10:00 slot open.",
          },
        ],
        summary:
          "Investor explicitly interested in agentic enterprise pilots; proposed morning intro meeting.",
      },
    },
    {
      requester_id: SEED_AGENT_ID,
      target_id: SEED_MATCH_TARGET_IDS[2],
      score: 85,
      reason:
        "Corporate innovation lead seeking startup pilots — your event networking layer fits their digital transformation agenda.",
      status: "pending",
      proposed_time: "2026-05-20T11:00:00.000Z",
      conversation: {
        messages_json: [
          {
            speaker: "user_agent",
            message:
              "We help banks and enterprises run curated networking at offsites — could map to your 12-week pilot program.",
          },
          {
            speaker: "target_agent",
            message:
              "We're scouting event-tech pilots for Q3. A structured demo at the venue would help — 11:00 on day two works.",
          },
        ],
        summary:
          "Corporate pilot opportunity with clear next step: onsite demo + pilot scoping.",
      },
    },
  ];
}
