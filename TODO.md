# RelAI — Task Board

Companion to `ARCHITECTURE.md` and `Idea.md`. Submission deadline: **May 19, 4:00 PM CEST**.

---

## Roles

Pick one owner per role. If you're 3 people, merge **BOT** into **BE**. If you're 5, split **OPS** off from **BOT**.

| Code | Role | Primary responsibilities |
|---|---|---|
| **FE** | Frontend / UI | Landing page, dashboard, React Flow graph, match cards, activity feed |
| **BE** | Backend / API | Next.js API routes, DB schema, Supabase wiring, orchestrator glue |
| **AI** | AI / Agents | Gemini prompts, JSON schemas, conversation/match logic |
| **BOT** | Telegram + Ops | Bot, onboarding state machine, Vultr deploy, demo video |

**Assign your team here:**

| Code | Person | Telegram/Discord |
|---|---|---|
| FE | _____ | |
| BE | _____ | |
| AI | _____ | |
| BOT | _____ | |

---

## Phase 0 — Project setup *(everyone, first 30 min)*

- [ ] **ALL** Create GitHub repo, MIT license, push initial Next.js + TS + Tailwind + shadcn scaffold
- [ ] **ALL** Agree on branch model (e.g. `main` + short-lived feature branches, PRs auto-merge)
- [ ] **BOT** Create Telegram bot via @BotFather, share token in private team channel
- [ ] **BOT** Provision Supabase project; share URL + service key
- [ ] **AI** Create Google AI Studio key for Gemini Flash + Pro
- [ ] **BOT** Provision Vultr VM (smallest viable, Ubuntu 22.04); install Docker + Coolify
- [ ] **ALL** Copy `.env.example` to `.env.local`; verify each owner can run `pnpm dev` locally

**Acceptance:** repo runs locally for all four owners; secrets are in `.env.local` only.

---

## Phase 1 — Visual demo first *(parallel, ~2–3h)*

> Goal from `Idea.md`: dashboard works visually before AI is wired up.

### FE

- [ ] Landing page `/` with hero + "Open Telegram Agent" CTA linking to `https://t.me/<bot_username>`
- [ ] Route `/dashboard/[agentId]` shell with 3-column layout (header, left chat, center graph, right feed + matches)
- [ ] `AgentStatusHeader` component reading from `/api/agents/:id/status`
- [ ] `AgentGraph` component using React Flow with custom node colors per status (see `ARCHITECTURE.md` §10)
- [ ] `ActivityFeed` component (scrollable, newest on top)
- [ ] `MatchCards` component with Approve / Reject buttons (no-op for now)
- [ ] Tailwind dark theme polish; ensure no layout shift on mobile

### BE

- [ ] Supabase project + run `supabase/schema.sql` to create all 5 tables from `ARCHITECTURE.md` §5
- [ ] Seed `attendees` with 30–50 fake profiles from `Idea.md` §Fake Data Strategy via `scripts/seed-attendees.ts`
- [ ] Implement read-only routes returning **seeded** data:
  - [ ] `GET /api/agents/:id/status`
  - [ ] `GET /api/agents/:id/graph`
  - [ ] `GET /api/agents/:id/matches`
- [ ] `lib/db/` typed Supabase client + query helpers

### BOT

- [ ] Pin DNS / temporary domain on Vultr (Cloudflare or `nip.io`)
- [ ] Get HTTPS working on the VM (Coolify auto-cert)
- [ ] Deploy the current empty Next.js app to Vultr; confirm public URL renders landing page

### AI

- [ ] Stub `lib/gemini/` with `callGemini(prompt, schema)` returning **canned JSON** for each of the 4 prompt files
- [ ] Pre-generate one realistic example output per prompt and save under `lib/seed/examples/`

**Acceptance:** opening `/dashboard/seed-agent` on the deployed URL shows a populated, animated graph and match cards driven entirely by seeded data.

---

## Phase 2 — Fake workflow + scripted animation *(~1–2h)*

### FE

- [ ] Polling: dashboard polls `/api/agents/:id/graph` every 1.5s
- [ ] Edge animation toggles based on `edges[].animated` flag
- [ ] Node color transitions are CSS-animated (not jump cuts)
- [ ] Live activity feed appends new events smoothly (no full re-renders)

### BE

- [ ] `lib/seed/demo-fallback.ts` — scripted sequence of `graph_events` writes that walks: scanning → contacting → negotiating → matched/rejected → scheduled
- [ ] `POST /api/agents/:id/start` (initially) just calls `demo-fallback`
- [ ] Add `agents.status` transitions matching the script

### BOT

- [ ] `/demo` command on the bot that calls `POST /api/agents/seed-agent/start` and replies with the dashboard URL

**Acceptance:** running `/demo` in Telegram triggers the full animated sequence on the dashboard within 30 seconds.

---

## Phase 3 — Telegram onboarding *(~2h)*

### BOT

- [ ] `lib/telegram/bot.ts` using `grammy` (recommended) or `node-telegram-bot-api`
- [ ] Wire `POST /api/telegram/webhook` to the bot; register webhook at startup
- [ ] Implement onboarding state machine (`ask_name → ask_role → ask_interests → ask_goal → ask_availability → confirm`)
- [ ] Store partial answers in `attendees` row keyed by `telegram_chat_id`
- [ ] On completion: call `POST /api/onboarding` then `POST /api/agents/create`
- [ ] Send "Open Mission Control: …" message with deep link

### BE

- [ ] `POST /api/onboarding` — persist answers, return normalized profile
- [ ] `POST /api/agents/create` — insert `agents` row, return `agentId`
- [ ] Inline button callback handlers for `approve:<matchId>` and `reject:<matchId>` → call respective endpoints

### AI

- [ ] Connect `extractProfile.ts` (Gemini Flash) to onboarding completion; replace canned output with real call
- [ ] JSON-schema validation with retry-on-fail

**Acceptance:** new Telegram user can complete onboarding, receive a real dashboard link, and see their own name in the header.

---

## Phase 4 — Real agent orchestration *(~2–3h)*

### AI

- [ ] `rankMatches.ts` — Gemini Flash, ranks all attendees against the user profile
- [ ] `simulateConversation.ts` — Gemini Pro, generates the agent-to-agent dialogue + `should_meet`
- [ ] `summarizeMatch.ts` — Gemini Pro, generates match card copy + suggested opener
- [ ] Tune prompts so reasons are specific (shared interests, complementary goals, one concrete meeting reason)

### BE

- [ ] Replace `demo-fallback` body of `POST /api/agents/:id/start` with real orchestrator
- [ ] Orchestrator loop (see `ARCHITECTURE.md` §7):
  - emit `scanning(start)` → call `rankMatches` → cap at top 5
  - per candidate (parallel up to 5): emit `contacting` → `simulateConversation` → emit `negotiating` → deterministic scheduling → `summarizeMatch` → insert `matches` + `conversations` → emit `matched`/`rejected`
- [ ] `tryWithFallback(prompt, cachedJson)` wrapper so any Gemini failure cleanly falls back to seed data

### FE

- [ ] Show one expanded conversation transcript on click of a match card (proves multi-agent reasoning to judges)

**Acceptance:** a fresh Telegram user completes onboarding and within ~30s sees 3 real Gemini-generated matches in both Telegram and the dashboard.

---

## Phase 5 — Approval loop *(~1h)*

### BE

- [ ] `POST /api/matches/:id/approve` — flip status, send Telegram confirmation
- [ ] `POST /api/matches/:id/reject` — flip status, send Telegram confirmation

### BOT

- [ ] Bot receives callback, sends "Meeting confirmed with X at Y" message
- [ ] Reflect approved status with a green ring on the graph node

### FE

- [ ] Match card Approve / Reject buttons hit the new endpoints and optimistically update UI

**Acceptance:** approving a match in Telegram updates the dashboard within 2s and vice versa.

---

## Phase 6 — Submission *(last 60 min)*

### BOT (OPS)

- [ ] Final deploy to Vultr; confirm public URL + Telegram webhook
- [ ] Record ≤3 min demo video: landing → bot onboarding → dashboard animation → approval → bot confirmation
- [ ] Upload demo video to YouTube (unlisted) or Loom
- [ ] Take cover image screenshot of the graph in full color

### ALL

- [ ] Write README in repo (setup, env vars, architecture link)
- [ ] Fill lablab.ai submission form:
  - Title, short + long description
  - Tags: **Collaborative Systems**, Agentic Workflows, Enterprise Utility, **Gemini**, **Vultr**
  - GitHub URL, demo URL, video URL, cover image, slide deck
- [ ] Confirm MIT license file is present
- [ ] **Submit before 4:00 PM CEST**

---

## Stretch (only if time remains)

- [ ] Supabase Realtime channel instead of polling
- [ ] One-line ethical disclaimer about simulated target agents in the UI
- [ ] "Try without Telegram" web onboarding form for judges who don't want to install Telegram
- [ ] Enterprise framing card: "Same pattern for internal offsites / sales roundtables"

---

## Daily standup template *(use in chat)*

```
[FE] Done: …  Today: …  Blocked: …
[BE] Done: …  Today: …  Blocked: …
[AI] Done: …  Today: …  Blocked: …
[BOT] Done: …  Today: …  Blocked: …
```
