# Contributing to RelAI

Hackathon mode — optimize for speed and zero merge conflicts. Read this once before you push.

---

## Branching

- `main` is always deployable. Vultr auto-deploys from `main`.
- Work on short-lived branches named by role + topic:
  ```
  fe/dashboard-layout
  be/agents-create-route
  ai/match-prompt
  bot/onboarding-fsm
  ```
- Rebase on `main` before opening a PR. Merge with **squash**.

---

## File-ownership map (avoid stepping on each other)

| Path | Primary owner |
|---|---|
| `app/page.tsx`, `app/dashboard/**` | FE |
| `components/**` | FE |
| `app/api/**` | BE |
| `lib/db/**`, `supabase/**`, `scripts/**` | BE |
| `lib/gemini/**` | AI |
| `lib/orchestrator/**` | BE + AI (coordinate) |
| `lib/telegram/**`, `app/api/telegram/**` | BOT |
| `.env.example`, `README.md`, deploy scripts | BOT |
| `ARCHITECTURE.md`, `TODO.md` | anyone (note in PR) |

If you need to edit a file outside your lane, **ping the owner first**.

---

## Commit messages

Use a short prefix matching your role:

```
fe: add React Flow node colors
be: wire /api/agents/create to supabase
ai: tighten match-ranking prompt schema
bot: onboarding state machine v1
docs: clarify deploy step in README
```

Keep the body to one paragraph max.

---

## Pull requests

- Open as **Draft** the moment you push; flip to Ready when green.
- Title format: `[FE|BE|AI|BOT] short description`
- Body: 2–3 lines on what + why. Link the `TODO.md` checkbox you closed.
- Require **1 approval** from any teammate. No long reviews — we're shipping.
- Squash-merge. Delete the branch after merge.

---

## Definition of Done (per task)

A task isn't done until:

1. Code is merged to `main`.
2. The matching checkbox in `TODO.md` is ticked.
3. The acceptance criterion for the phase still passes (run the demo path locally).
4. No new TypeScript errors (`pnpm typecheck`) and no new lint errors.
5. If the change is significant (phase milestone, new API, schema change, env var, blocker resolved) — add an entry to [`updates/`](./updates/). Use `updates/_template.md`.

---

## Secrets

- **Never** commit `.env`, `.env.local`, keys, or tokens.
- Share secrets in the private team chat — not in commits, not in PR descriptions.
- If a secret leaks, rotate it (BotFather `/revoke`, Supabase regenerate, AI Studio new key) and force-push the cleaned commit.

---

## Local checks before pushing

```bash
pnpm typecheck
pnpm lint
pnpm dev   # smoke-test the route you changed
```

---

## When in doubt

Ping the team chat. We have hours, not days — no silent blockers.
