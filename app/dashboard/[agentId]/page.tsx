import Link from "next/link";
import { MatchCards } from "@/components/matches/MatchCards";

type PageProps = {
  params: Promise<{ agentId: string }>;
};

export default async function DashboardPage({ params }: PageProps) {
  const { agentId } = await params;

  return (
    <div className="flex min-h-full flex-col bg-zinc-950 text-zinc-100">
      <header className="shrink-0 border-b border-zinc-900 px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div>
            <Link
              href="/"
              className="text-xs font-medium text-zinc-500 hover:text-zinc-300"
            >
              ← RelAI
            </Link>
            <h1 className="mt-1 text-xl font-semibold tracking-tight">
              Mission Control
            </h1>
            <p className="text-sm text-zinc-500">
              Agent{" "}
              <code className="rounded bg-zinc-900 px-1.5 py-0.5 text-xs text-zinc-400">
                {agentId}
              </code>
            </p>
          </div>
          <p className="hidden text-right text-sm text-zinc-500 sm:block">
            AI Week Milan · Live networking
          </p>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 p-4 sm:p-6 lg:flex-row lg:gap-6">
        <div className="flex min-h-[280px] flex-1 items-center justify-center rounded-xl border border-dashed border-zinc-800 bg-zinc-900/30 lg:min-h-[480px]">
          <p className="max-w-xs text-center text-sm text-zinc-500">
            Agent graph (React Flow) — coming next. Match cards are live on the
            right.
          </p>
        </div>

        <aside className="flex w-full shrink-0 flex-col lg:w-[380px] xl:w-[420px]">
          <div className="flex max-h-[70vh] min-h-[320px] flex-col rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 lg:max-h-[calc(100vh-8rem)]">
            <MatchCards agentId={agentId} />
          </div>
        </aside>
      </main>
          </div>
  );
}
