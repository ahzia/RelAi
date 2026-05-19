import Link from "next/link";
import { SEED_AGENT_ID } from "@/lib/seed/constants";

const TELEGRAM_BOT_USERNAME =
  process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME?.replace(/^@/, "") ?? "";

const telegramUrl = TELEGRAM_BOT_USERNAME
  ? `https://t.me/${TELEGRAM_BOT_USERNAME}`
  : null;

export default function Home() {
  return (
    <div className="relative min-h-full overflow-hidden bg-zinc-950 text-zinc-100">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.25),transparent)]"
        aria-hidden
      />

      <div className="relative mx-auto flex min-h-full max-w-5xl flex-col px-6 py-16 sm:px-10 sm:py-24">
        <header className="flex items-center justify-between">
          <span className="text-lg font-semibold tracking-tight">RelAI</span>
          <span className="rounded-full border border-zinc-800 bg-zinc-900/80 px-3 py-1 text-xs text-zinc-400">
            AI Agent Olympics · Milan 2026
          </span>
        </header>

        <main className="mt-20 flex flex-1 flex-col justify-center sm:mt-28">
          <p className="mb-4 text-sm font-medium uppercase tracking-widest text-indigo-400">
            Collaborative multi-agent networking
          </p>
          <h1 className="max-w-2xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl sm:leading-[1.1]">
            Your AI representative networks while you focus on the event.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-zinc-400">
            RelAI gives every attendee a Telegram agent that discovers relevant
            people, negotiates with other agents, and proposes meetings — you
            approve the matches that matter.
          </p>

          <ul className="mt-10 grid gap-3 text-sm text-zinc-300 sm:grid-cols-3 sm:gap-6">
            <li className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3">
              <span className="font-medium text-zinc-100">Telegram-first</span>
              <p className="mt-1 text-zinc-500">Onboard and approve in chat</p>
            </li>
            <li className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3">
              <span className="font-medium text-zinc-100">Mission Control</span>
              <p className="mt-1 text-zinc-500">Live agent graph on the web</p>
            </li>
            <li className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3">
              <span className="font-medium text-zinc-100">Human in the loop</span>
              <p className="mt-1 text-zinc-500">You decide every meeting</p>
            </li>
          </ul>

          <div className="mt-12 flex flex-col gap-4 sm:flex-row sm:items-center">
            {telegramUrl ? (
              <a
                href={telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center justify-center rounded-full bg-indigo-500 px-8 text-sm font-semibold text-white transition-colors hover:bg-indigo-400"
              >
                Open Telegram Agent
              </a>
            ) : (
              <span
                className="inline-flex h-12 cursor-not-allowed items-center justify-center rounded-full bg-zinc-800 px-8 text-sm font-semibold text-zinc-500"
                title="Set NEXT_PUBLIC_TELEGRAM_BOT_USERNAME in .env"
              >
                Open Telegram Agent
              </span>
            )}
            <Link
              href={`/dashboard/${SEED_AGENT_ID}`}
              className="inline-flex h-12 items-center justify-center rounded-full border border-zinc-700 px-8 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-zinc-100"
            >
              Preview Mission Control
            </Link>
          </div>

          {!telegramUrl && (
            <p className="mt-4 text-sm text-amber-500/90">
              Add{" "}
              <code className="rounded bg-zinc-900 px-1.5 py-0.5 text-amber-200">
                NEXT_PUBLIC_TELEGRAM_BOT_USERNAME
              </code>{" "}
              to your <code className="rounded bg-zinc-900 px-1.5 py-0.5">.env</code>{" "}
              after @BotFather creates the bot.
            </p>
          )}
        </main>

        <footer className="mt-20 border-t border-zinc-900 pt-8 text-sm text-zinc-600">
          Built for enterprise event networking — Gemini + Vultr.
        </footer>
      </div>
    </div>
  );
}
