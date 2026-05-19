# Status reconcile: BOT shipped infra layer + lockfile cleanup

- **Date:** 2026-05-19 14:30 CEST
- **Author:** ai-session-01
- **Role:** pm
- **Phase (from TODO.md):** 6 (submission prep)

## What changed

Reviewed two commits from BOT teammate (`5da9464`, `0e22a89`) that landed since the agent layer was pushed. Updated `TODO.md` to reflect the new state.

### BOT shipped (1,475 + 8,185 LOC across two commits)

- `lib/telegram/` — full grammy bot, webhook route, onboarding FSM, copy strings, notify helpers, TLS/URL helpers, `client.ts`, `env.ts`
- `lib/db/` — `agents.ts`, `attendees.ts`, `matches.ts`, `graph-events.ts` typed Supabase helpers
- `lib/services/` — `onboarding-service.ts` calls `extractProfile`; `agent-start-service.ts` wraps `runAgentWorkflow` with DB writes via the `onEvent` callback, persists matches, sends Telegram notifications
- `app/api/` — all 6 API routes wired (`telegram/webhook`, `onboarding`, `agents/create`, `agents/[id]/start`, `matches/[id]/approve`, `matches/[id]/reject`)
- `scripts/seed-attendees.ts` — fake attendee seeder
- `scripts/bot-dev.ts` + `scripts/set-webhook.ts` — local long-polling + webhook registration

### What this means for the build plan

- **Phase 3 (Telegram onboarding):** done.
- **Phase 4 (orchestration):** done backend; FE transcript-on-click still open.
- **Phase 5 (approval loop):** done backend; FE buttons still open.
- **Phase 6 (submission):** open. Vultr deploy, demo video, lablab form still to go.

### Files I touched in this session

- `TODO.md` — rewrote: ticked completed checkboxes, added a "Current status" section at the top with priority-ordered remaining tasks.
- `package-lock.json` — **deleted** (BOT accidentally committed an npm lockfile alongside `pnpm-lock.yaml`).
- `.gitignore` — added `package-lock.json` and `yarn.lock` to block re-commit.
- This entry.

## Why

1. The team chat needs a single source of truth for "what's left" — `TODO.md` was 90% out of date.
2. The double lockfile is a deploy-time bug: Coolify's Nixpacks auto-detector picks the first one it finds. If it picks npm but pnpm-workspace.yaml expects pnpm, the build either fails or installs a divergent dep tree. Safer to delete now than debug under deadline pressure.

## How to verify

```bash
pnpm install       # → "Already up to date", exit 0
pnpm typecheck     # → no errors, exit 0
ls package-lock.json 2>/dev/null   # → no such file
```

## Next steps / handoff

**Priority order for the remaining ~90 minutes:**

1. **OPS / BOT** — Run `DEPLOY.md`. Steps 1–4 (provision VM + install Coolify) take 15 min, mostly waiting. Start immediately.
2. **FE** — Build the dashboard at `/dashboard/[agentId]`. Minimum viable: header + React Flow graph + match cards. Skip animation polish if behind. The API returns clean data already from `/api/agents/[id]/graph` and `/api/agents/[id]/matches`.
3. **OPS / BOT** — In parallel with FE, apply `supabase/schema.sql` via the Supabase dashboard SQL editor, then run `pnpm db:seed` to populate attendees.
4. **OPS / BOT** — Once `main` is on Vultr with a public URL, run `pnpm exec tsx --env-file=.env scripts/set-webhook.ts <PUBLIC_URL>` to point Telegram at it.
5. **ALL** — Record demo video, submit on lablab.ai before 4:00 PM CEST.

## Concerns

- **FE dashboard is the single highest-risk remaining task.** Without it there's no visual proof of multi-agent reasoning — that's our entire pitch to the Collaborative Systems judges. If FE is stuck, AI/BE can pitch in: even a single-page graph + match cards without polish is a win.
- **Demo latency is ~36s** for a real Gemini workflow run. Fine for a recorded demo (cut the wait), risky for a live demo. If we're recording, that's no issue.
- **`tryWithFallback` for Gemini failure is NOT built.** If Gemini rate-limits during the demo, `runAgentWorkflow` throws and `USE_DEMO_FALLBACK=true` is checked but no scripted seed events fire. Mitigation: record the demo on a successful run and submit the video; don't rely on a live demo.

## Blockers

None for now — every remaining task is independently startable. The 4 PM deadline is the real constraint.
