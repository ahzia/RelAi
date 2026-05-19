# Updates log

Append-only journal of **significant** changes to the project. Every entry should answer: *what changed, why, what's next, what's blocked*.

Used for async handoffs — between teammates working in different time zones, and between AI agent sessions picking up where another left off.

---

## When to write an entry

Write one when you:

- Land a feature, milestone, or full phase from `TODO.md`
- Change architecture (data model, API contract, infra)
- Add or rotate a secret / env var
- Hit a blocker that someone else needs to unblock
- End your work session and want to hand off cleanly

**Don't** write one for tiny tweaks, formatting, or single-file refactors — those live in commit messages.

---

## File naming

```
YYYY-MM-DD-HHMM-<role>.md
```

- `YYYY-MM-DD-HHMM` — UTC or local, just be consistent within an entry
- `<role>` — one of: `fe`, `be`, `ai`, `bot`, `ops`, `setup`, `pm`
- If multiple entries from the same role within the same minute, append a slug: `2026-05-19-1300-be-schema.md`

Example: `2026-05-19-1300-setup.md`

Files sort chronologically, which is what you want when scanning history.

---

## Template

Copy [`_template.md`](./_template.md) to start a new entry, or use this inline:

```markdown
# <Short title>

- **Date:** 2026-05-19 13:00 CEST
- **Author:** <name or "ai-session-01">
- **Role:** <fe | be | ai | bot | ops | setup | pm>
- **Phase (from TODO.md):** <0 | 1 | 2 | 3 | 4 | 5 | 6>

## What changed

<2–5 bullets, plain language>

## Why

<1–3 sentences. Skip if obvious.>

## Files touched

- `path/one.ts`
- `path/two.sql`

## How to verify

```bash
<command>
```

## Next steps / handoff

- [ ] Concrete action for next person
- [ ] Another action

## Blockers

<None / or description + who can unblock>
```

---

## Reading order

When picking up the project (or resuming an AI session):

1. `README.md` — the pitch + quick start
2. `ARCHITECTURE.md` — the system shape
3. `TODO.md` — the open work
4. `updates/` — sorted **newest to oldest**, read until you have enough context
5. Then start coding

The newest 1–2 entries should always give you enough state to continue. If they don't, the previous author didn't write enough.
