/**
 * Backend smoke test — Supabase + read-only agent APIs.
 *
 * Prerequisites:
 *   - .env with Supabase keys
 *   - schema applied (supabase/schema.sql)
 *   - seed data (pnpm db:seed)
 *
 * Run: pnpm check:backend
 */

import { GET as getGraph } from "@/app/api/agents/[id]/graph/route";
import { GET as getMatches } from "@/app/api/agents/[id]/matches/route";
import { POST as postStart } from "@/app/api/agents/[id]/start/route";
import { GET as getStatus } from "@/app/api/agents/[id]/status/route";
import { getAgentStatus } from "@/lib/db/agents";
import { getServerClient } from "@/lib/db/clients";
import { SEED_AGENT_ID } from "@/lib/seed/constants";
import type { AgentStatusResponse, GraphResponse } from "@/lib/db/types";
import type { MatchesResponse } from "@/types/matches";

let failed = 0;

function fail(msg: string): void {
  console.error(`✗ ${msg}`);
  failed += 1;
}

function pass(msg: string): void {
  console.log(`✓ ${msg}`);
}

function routeContext(id: string) {
  return { params: Promise.resolve({ id }) };
}

async function checkEnv(): Promise<void> {
  const required = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_SECRET_KEY",
  ] as const;

  for (const key of required) {
    if (!process.env[key]) {
      fail(`${key} is not set in .env`);
    }
  }
  if (failed === 0) pass("required env vars present");
}

async function checkSupabase(): Promise<void> {
  const sb = getServerClient();

  const { count: attendeeCount, error: tableError } = await sb
    .from("attendees")
    .select("*", { count: "exact", head: true });

  if (tableError) {
    fail(
      `Supabase attendees table: ${tableError.message} (apply supabase/schema.sql?)`,
    );
    return;
  }

  pass(`Supabase connected (${attendeeCount ?? 0} attendees)`);

  if (!attendeeCount) {
    fail("no attendees in DB — run: pnpm db:seed");
    return;
  }

  const { count, error: agentError } = await sb
    .from("agents")
    .select("id", { count: "exact", head: true })
    .eq("id", SEED_AGENT_ID);

  if (agentError) {
    fail(`agents query: ${agentError.message}`);
    return;
  }

  if (!count) {
    fail(
      `demo agent ${SEED_AGENT_ID} not found — run: pnpm db:seed`,
    );
    return;
  }

  pass(`demo agent exists (${SEED_AGENT_ID})`);
}

function isAgentStatusResponse(v: unknown): v is AgentStatusResponse {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.agentId === "string" &&
    typeof o.status === "string" &&
    typeof o.attendeeName === "string" &&
    typeof o.matchCount === "number"
  );
}

function isGraphResponse(v: unknown): v is GraphResponse {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    Array.isArray(o.nodes) &&
    Array.isArray(o.edges) &&
    Array.isArray(o.activity) &&
    o.nodes.length >= 1
  );
}

function isMatchesResponse(v: unknown): v is MatchesResponse {
  if (!v || typeof v !== "object") return false;
  const matches = (v as MatchesResponse).matches;
  return (
    Array.isArray(matches) &&
    matches.every(
      (m) =>
        m &&
        typeof m.id === "string" &&
        typeof m.score === "number" &&
        typeof m.why_this_match_matters === "string" &&
        m.target?.name,
    )
  );
}

async function checkApiRoute(
  name: string,
  handler: typeof getStatus,
  validate: (body: unknown) => boolean,
  minExtra?: (body: unknown) => boolean,
): Promise<void> {
  const res = await handler(
    new Request(`http://localhost/api/agents/${SEED_AGENT_ID}/${name}`),
    routeContext(SEED_AGENT_ID),
  );

  if (res.status !== 200) {
    const err = await res.json().catch(() => ({}));
    fail(`GET /api/agents/:id/${name} → ${res.status} ${JSON.stringify(err)}`);
    return;
  }

  const body = await res.json();
  if (!validate(body)) {
    fail(`GET /api/agents/:id/${name} → invalid response shape`);
    return;
  }

  if (minExtra && !minExtra(body)) {
    fail(`GET /api/agents/:id/${name} → seed data looks empty`);
    return;
  }

  pass(`GET /api/agents/:id/${name} → 200`);
}

async function main(): Promise<void> {
  console.log("→ RelAI backend smoke test\n");

  await checkEnv();
  if (failed > 0) {
    process.exit(1);
  }

  await checkSupabase();
  if (failed > 0) {
    process.exit(1);
  }

  await checkApiRoute("status", getStatus, isAgentStatusResponse, (b) => {
    const s = b as AgentStatusResponse;
    return s.attendeeName.length > 0 && s.eventCount > 0;
  });

  await checkApiRoute("graph", getGraph, isGraphResponse, (b) => {
    const g = b as GraphResponse;
    return (
      g.nodes.some((n) => n.role === "center") &&
      g.nodes.some((n) => n.role === "candidate") &&
      g.activity.length > 0
    );
  });

  await checkApiRoute("matches", getMatches, isMatchesResponse, (b) => {
    return (b as MatchesResponse).matches.length >= 3;
  });

  console.log("\n→ POST /api/agents/:id/start (demo workflow)…");
  process.env.USE_DEMO_FALLBACK = "true";
  const startRes = await postStart(
    new Request(`http://localhost/api/agents/${SEED_AGENT_ID}/start`, {
      method: "POST",
    }),
    routeContext(SEED_AGENT_ID),
  );
  if (startRes.status !== 202) {
    fail(`POST /api/agents/:id/start → ${startRes.status}`);
  } else {
    pass("POST /api/agents/:id/start → 202");
    await new Promise((r) => setTimeout(r, 1200));
    const status = await getAgentStatus(SEED_AGENT_ID);
    if (status === "scanning" || status === "contacting" || status === "negotiating") {
      pass(`agent status is running (${status})`);
    } else if (status === "done") {
      pass("agent status already done (fast demo or prior run)");
    } else {
      fail(`expected running status after start, got ${status ?? "null"}`);
    }
  }

  console.log("");
  if (failed > 0) {
    console.error(`Failed ${failed} check(s).`);
    process.exit(1);
  }

  console.log("✓ All backend checks passed.");
  console.log(
    `  Dashboard: ${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/dashboard/${SEED_AGENT_ID}`,
  );
}

main().catch((err) => {
  console.error("✗", err instanceof Error ? err.message : String(err));
  process.exit(1);
});
