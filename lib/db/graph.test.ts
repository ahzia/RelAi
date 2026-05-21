/**
 * Unit tests for buildGraphResponse (no network).
 *
 * Run: pnpm test:unit
 */

import { buildGraphResponse } from "@/lib/db/graph";
import type { Attendee, GraphEvent, MatchWithTarget } from "@/lib/db/types";

const AGENT_ID = "b0000000-0000-4000-8000-000000000001";
const TARGET_A = "c0000001-0000-4000-8000-000000000001";
const TARGET_B = "c0000002-0000-4000-8000-000000000002";

function attendee(id: string, name: string): Attendee {
  return {
    id,
    name,
    role: "Founder",
    company: "Test Co",
    bio: null,
    interests: ["AI"],
    goals: null,
    availability: [],
    telegram_chat_id: null,
    created_at: "2026-05-19T10:00:00.000Z",
  };
}

function event(
  partial: Partial<GraphEvent> & Pick<GraphEvent, "type">,
): GraphEvent {
  return {
    id: partial.id ?? crypto.randomUUID(),
    requester_id: AGENT_ID,
    type: partial.type,
    source_node_id: AGENT_ID,
    target_node_id: partial.target_node_id ?? null,
    status: partial.status ?? "start",
    message: partial.message ?? null,
    created_at: partial.created_at ?? "2026-05-19T10:00:00.000Z",
  };
}

function match(targetId: string, score: number): MatchWithTarget {
  const t = attendee(targetId, targetId === TARGET_A ? "Sarah" : "Marco");
  return {
    id: crypto.randomUUID(),
    requester_id: AGENT_ID,
    target_id: targetId,
    score,
    reason: "Strong fit",
    status: "pending",
    proposed_time: "2026-05-19T14:00:00.000Z",
    created_at: "2026-05-19T10:00:00.000Z",
    target: t,
  };
}

let passed = 0;
let failed = 0;

function assert(label: string, ok: boolean): void {
  if (ok) {
    console.log(`✓ ${label}`);
    passed += 1;
  } else {
    console.error(`✗ ${label}`);
    failed += 1;
  }
}

// --- center node + candidates from matches ---
{
  const graph = buildGraphResponse({
    agentId: AGENT_ID,
    agentStatus: "done",
    centerLabel: "Zia",
    events: [],
    matches: [match(TARGET_A, 92), match(TARGET_B, 88)],
    attendeesById: new Map([
      [TARGET_A, attendee(TARGET_A, "Sarah")],
      [TARGET_B, attendee(TARGET_B, "Marco")],
    ]),
  });

  assert("has center node", graph.nodes.some((n) => n.id === AGENT_ID && n.role === "center"));
  assert("has 2 candidate nodes", graph.nodes.filter((n) => n.role === "candidate").length === 2);
  assert(
    "center label is attendee name",
    graph.nodes.find((n) => n.id === AGENT_ID)?.label === "Zia",
  );
  assert(
    "candidate has score from match",
    graph.nodes.find((n) => n.id === TARGET_A)?.score === 92,
  );
}

// --- activity feed newest first ---
{
  const graph = buildGraphResponse({
    agentId: AGENT_ID,
    agentStatus: "scanning",
    centerLabel: "Alex",
    events: [
      event({ type: "scanning", message: "older", created_at: "2026-05-19T09:00:00.000Z" }),
      event({ type: "contacting", target_node_id: TARGET_A, message: "newer", created_at: "2026-05-19T11:00:00.000Z" }),
    ],
    matches: [],
    attendeesById: new Map([[TARGET_A, attendee(TARGET_A, "Sarah")]]),
  });

  assert("activity has 2 items", graph.activity.length === 2);
  assert(
    "activity sorted newest first",
    graph.activity[0]?.message === "newer",
  );
}

// --- edge from contacting event ---
{
  const graph = buildGraphResponse({
    agentId: AGENT_ID,
    agentStatus: "contacting",
    centerLabel: "Alex",
    events: [
      event({
        type: "contacting",
        target_node_id: TARGET_A,
        status: "start",
        message: "Contacting Sarah",
      }),
    ],
    matches: [],
    attendeesById: new Map([[TARGET_A, attendee(TARGET_A, "Sarah")]]),
  });

  assert("has edge to target", graph.edges.some((e) => e.target === TARGET_A));
  assert(
    "contacting edge is animated when status start",
    graph.edges.find((e) => e.target === TARGET_A)?.animated === true,
  );
}

// --- matched event sets candidate status ---
{
  const graph = buildGraphResponse({
    agentId: AGENT_ID,
    agentStatus: "done",
    centerLabel: "Alex",
    events: [
      event({ type: "matched", target_node_id: TARGET_A, status: "end", message: "Matched" }),
    ],
    matches: [match(TARGET_A, 90)],
    attendeesById: new Map([[TARGET_A, attendee(TARGET_A, "Sarah")]]),
  });

  assert(
    "candidate status matched",
    graph.nodes.find((n) => n.id === TARGET_A)?.status === "matched",
  );
}

console.log("");
if (failed > 0) {
  console.error(`${failed} failed, ${passed} passed`);
  process.exit(1);
}
console.log(`✓ graph.test.ts — ${passed} passed`);
