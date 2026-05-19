# RelAI

**Messaging-first multi-agent networking platform.** Every event attendee gets an AI networking agent inside Telegram that discovers relevant people, talks to their agents, evaluates fit, and proposes meetings for human approval.

Built for the [**AI Agent Olympics Hackathon**](https://lablab.ai) at Milan AI Week 2026.
**Tracks:** Collaborative Systems (main) · Agentic Workflows · Enterprise Utility
**Partners:** Google Gemini · Vultr

---

## Demo flow

1. User opens the landing page → clicks **Open Telegram Agent**.
2. Bot runs onboarding (name, role, interests, goal, availability).
3. Gemini Flash builds the user's representative agent.
4. Orchestrator ranks attendees, simulates agent-to-agent dialogue, and proposes meetings.
5. Browser **Mission Control** (`/dashboard/[agentId]`) animates the multi-agent workflow live.
6. Bot delivers top 3 matches with **Approve / Reject** buttons.

---

## Documentation

| File | Purpose |
|---|---|
| [`Idea.md`](./Idea.md) | Full product spec, UX flow, pitch framing |
| [`ARCHITECTURE.md`](./ARCHITECTURE.md) | Tech stack, data model, API contracts, agent orchestration |
| [`TODO.md`](./TODO.md) | Phase-by-phase task board with role assignments |
| [`hackathon_info.md`](./hackathon_info.md) | Deadlines, submission deliverables, judging criteria |
| [`CONTRIBUTING.md`](./CONTRIBUTING.md) | Branching, commits, PR workflow |

---

## Quick start

> Requires **Node 20+**, **pnpm**, a Vultr VM, a Supabase project, a Telegram bot token, and a Gemini API key.

```bash
git clone <repo>
cd RelAi
pnpm install
cp .env.example .env.local
# fill in secrets — see .env.example
pnpm dlx supabase db push   # apply supabase/schema.sql
pnpm db:seed                # seed 30–50 fake attendees
pnpm dev                    # http://localhost:3000
```

In a second terminal, register the Telegram webhook (or use long-polling locally):

```bash
pnpm bot:dev
```

---

## Tech stack

- **Frontend:** Next.js (App Router) + TypeScript + TailwindCSS + shadcn/ui + React Flow
- **Backend:** Next.js API routes (Node runtime)
- **AI:** Gemini Flash (extraction, ranking) + Gemini Pro (conversation, summary)
- **Messaging:** Telegram Bot API (`grammy`)
- **Database:** Supabase Postgres
- **Deployment:** Vultr VM + Coolify

See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for the full diagram and rationale.

---

## Team

| Role | Owner |
|---|---|
| Frontend / UI | _____ |
| Backend / API | _____ |
| AI / Agents | _____ |
| Telegram + Ops | _____ |

Fill in [`TODO.md`](./TODO.md#roles) with names + handles.

---

## License

MIT — see [`LICENSE`](./LICENSE). Required for hackathon submission.
