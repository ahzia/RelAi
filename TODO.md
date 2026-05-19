# RelAI — Task Board

Companion to `ARCHITECTURE.md` and `Idea.md`. Submission deadline: **May 19, 4:00 PM CEST**.

---

## ⚡ Current status — 2026-05-19 14:30 CEST

**Done:** Phase 0 fully · most of Phases 1, 3, 4 · all of Phase 5 backend wiring.
**Open:** FE dashboard · Vultr deploy · demo video · lablab submission · `package-lock.json` cleanup.

### Must-do before submission (priority order)

| # | Task | Owner | Est. |
|---|---|---|---|
| 1 | Delete `package-lock.json` (use pnpm only) — blocks Coolify build detection | OPS / BOT | 2 min |
| 2 | Provision Vultr VM + run Coolify (see `DEPLOY.md`) | OPS / BOT | 30 min |
| 3 | Apply `supabase/schema.sql` to Supabase (Dashboard SQL Editor) | anyone | 2 min |
| 4 | Run `pnpm db:seed` against Supabase | BE | 1 min |
| 5 | Build dashboard at `/dashboard/[agentId]` — minimum: header + graph + match cards | FE | 60–90 min |
| 6 | Record demo video (~3 min) | BOT | 15 min |
| 7 | Submit on lablab.ai | ALL | 10 min |

### What's NOT on the critical path (skip if time runs out)

- FE polling/animation polish — landing → graph snap-in is acceptable
- Approve/reject **from the dashboard** (Telegram inline buttons already work)
- Stretch features in the bottom section

---

## Roles

| Code | Role | Person |
|---|---|---|
| **FE** | Frontend / UI | _____ |
| **BE** | Backend / API | merged with BOT |
| **AI** | AI / Agents | _____ (done) |
| **BOT** | Telegram + Ops | _____ |

---

## Phase 0 — Project setup *(everyone, first 30 min)* — ✅ DONE

- [x] **ALL** Create GitHub repo, MIT license, Next.js + TS + Tailwind scaffold
- [x] **ALL** Branch model agreed
- [x] **BOT** Telegram bot created via @BotFather
- [x] **BOT** Supabase project provisioned
- [x] **AI** Google AI Studio key
- [ ] **BOT** Provision Vultr VM (still pending — see `DEPLOY.md`)
- [x] **ALL** `.env.example` copied; everyone can run `pnpm dev`

---

## Phase 1 — Visual demo first *(parallel, ~2–3h)*

### FE

- [x] Landing page `/` with hero + CTA
- [ ] **Route `/dashboard/[agentId]` shell with 3-column layout** ← CRITICAL
- [ ] `AgentStatusHeader` component reading from `/api/agents/:id/status`
- [ ] `AgentGraph` component using React Flow with status-colored nodes
- [ ] `ActivityFeed` component (scrollable, newest on top)
- [ ] `MatchCards` component with Approve / Reject buttons
- [ ] Tailwind dark theme polish

### BE — ✅ shipped by BOT

- [x] `supabase/schema.sql` exists
- [ ] **Schema actually applied to live Supabase** ← do this in dashboard SQL editor
- [x] `scripts/seed-attendees.ts` written
- [ ] **Seed actually run** (`pnpm db:seed`)
- [x] Read routes (status / graph / matches) — see `app/api/agents/[id]/`
- [x] `lib/db/` typed Supabase helpers (`agents.ts`, `attendees.ts`, `matches.ts`, `graph-events.ts`)

### BOT — partial

- [ ] **Pin DNS via `nip.io`** (`<VM_IP>.nip.io`) ← `DEPLOY.md` Step 2
- [ ] **HTTPS via Coolify auto-cert** ← `DEPLOY.md` Steps 3–6
- [ ] **Deploy to Vultr; confirm public URL renders landing**

### AI — ✅ DONE

- [x] `lib/gemini/client.ts` + `lib/gemini/types.ts` shipped
- [x] All 4 real prompts shipped (not canned)

---

## Phase 2 — Fake workflow + scripted animation *(~1–2h)*

### FE

- [ ] Polling: dashboard polls `/api/agents/:id/graph` every 1.5s
- [ ] Edge animation toggles based on `edges[].animated`
- [ ] Node color transitions CSS-animated
- [ ] Activity feed appends smoothly

### BE

- [ ] `lib/seed/demo-fallback.ts` — scripted graph_events sequence (only needed if Gemini gets rate-limited during the live demo)
- [x] `POST /api/agents/:id/start` wired (real orchestrator, not fallback)
- [x] `agents.status` transitions emitted via `onEvent`

### BOT — ✅ DONE

- [x] `/demo` command (`startDemoNetworking` in `lib/services/agent-start-service.ts`)

---

## Phase 3 — Telegram onboarding — ✅ DONE

### BOT

- [x] `lib/telegram/bot.ts` using `grammy`
- [x] `POST /api/telegram/webhook` wired
- [x] Onboarding FSM (`lib/telegram/onboarding-fsm.ts`)
- [x] Answers stored in DB
- [x] On completion: onboarding service called
- [x] "Open Mission Control" deep link sent

### BE

- [x] `POST /api/onboarding`
- [x] `POST /api/agents/create`
- [x] Inline button handlers (approve/reject)

### AI

- [x] `extractProfile` connected via `onboarding-service.ts`
- [x] Zod validation + retry-on-fail in `callGemini`

---

## Phase 4 — Real agent orchestration — ✅ DONE

### AI

- [x] `rankMatches.ts` (Flash)
- [x] `simulateConversation.ts` (Pro)
- [x] `summarizeMatch.ts` (Pro)
- [x] Prompts produce specific, non-generic reasons (verified in tests)

### BE

- [x] Real orchestrator in `POST /api/agents/:id/start` via `startAgentNetworking()`
- [x] Parallel candidate processing through `runAgentWorkflow`
- [x] Persists matches + conversations
- [ ] `tryWithFallback(prompt, cachedJson)` — partial: `USE_DEMO_FALLBACK` env gate exists but no scripted fallback events yet

### FE

- [ ] Show one expanded conversation transcript on click of a match card

---

## Phase 5 — Approval loop — ✅ DONE backend

### BE

- [x] `POST /api/matches/:id/approve` → flip status + Telegram confirm
- [x] `POST /api/matches/:id/reject` → flip status + Telegram confirm

### BOT

- [x] Telegram inline `Approve` / `Reject` callbacks wired (`handlers.ts`)
- [ ] Reflect approved status with a green ring on the graph node (FE-side)

### FE

- [ ] Match card Approve / Reject buttons hit the new endpoints

---

## Phase 6 — Submission *(last 60 min)*

### BOT / OPS

- [ ] **Delete `package-lock.json` (we use pnpm, not npm)** ← do this BEFORE deploy
- [ ] **Final deploy to Vultr** (`DEPLOY.md`)
- [ ] **Set Telegram webhook on the public URL** (`DEPLOY.md` Step 8)
- [ ] Record ≤3 min demo video: landing → bot onboarding → dashboard → approval
- [ ] Upload to YouTube (unlisted) or Loom
- [ ] Take cover image screenshot of the graph

### ALL

- [x] README in repo
- [ ] Fill lablab.ai submission form:
  - Title, short + long description
  - Tags: **Collaborative Systems**, Agentic Workflows, Enterprise Utility, **Gemini**, **Vultr**
  - GitHub URL, demo URL, video URL, cover image, slide deck
- [x] MIT license present
- [ ] **Submit before 4:00 PM CEST**

---

## Stretch (only if time remains)

- [ ] Supabase Realtime channel instead of polling
- [ ] One-line ethical disclaimer about simulated target agents in the UI
- [ ] "Try without Telegram" web onboarding form for judges
- [ ] Enterprise framing card: "Same pattern for internal offsites / sales roundtables"

---

## Daily standup template *(use in chat)*

```
[FE] Done: …  Today: …  Blocked: …
[BE] Done: …  Today: …  Blocked: …
[AI] Done: …  Today: …  Blocked: …
[BOT] Done: …  Today: …  Blocked: …
```
