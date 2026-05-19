# Backend completion — unified orchestrator + match actions

- **Date:** 2026-05-19 18:00 CEST
- **Role:** be

## What changed

- **Single orchestrator:** `lib/services/agent-start-service.ts` is the source of truth for Telegram + HTTP `POST /start`.
- **Gemini fallback:** On failure (or `USE_DEMO_FALLBACK=true`), runs `runDemoFallback` automatically.
- **Fresh runs:** Clears `graph_events` + `matches` before each Gemini workflow.
- **Match actions:** `lib/services/match-action-service.ts` — approve/reject update DB, emit `graph_events`, notify Telegram when possible.
- **Aligned seed IDs:** `lib/db/agents.ts` re-exports `SEED_AGENT_ID` from `lib/seed/constants.ts`.
- **DB helpers:** `deleteGraphEventsForAgent`, `deleteMatchesForAgent`, `getMatchById`, `getAgentStatus`.

## Verify

```bash
pnpm test
pnpm db:seed
pnpm dev
pnpm demo:start
```
