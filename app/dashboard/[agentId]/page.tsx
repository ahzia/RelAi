import Link from "next/link";
import { AgentStatusHeader } from "@/components/dashboard/AgentStatusHeader";
import { MatchCards } from "@/components/matches/MatchCards";

type PageProps = {
  params: Promise<{ agentId: string }>;
};

export default async function DashboardPage({ params }: PageProps) {
  const { agentId } = await params;

  return (
    <div className="flex min-h-full flex-col bg-zinc-950 text-zinc-100">
      <header className="shrink-0 border-b border-zinc-900 px-4 py-4 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-wrap items-start justify-between gap-4">
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
              <AgentStatusHeader agentId={agentId} />
            </div>
            <p className="text-right text-sm text-zinc-500">
              AI Week Milan
              <span className="mt-0.5 block text-xs text-zinc-600">
                Live multi-agent networking
              </span>
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 p-4 sm:p-6 lg:flex-row lg:gap-6">
        <div className="flex min-h-[280px] flex-1 items-center justify-center rounded-xl border border-dashed border-zinc-800 bg-zinc-900/30 lg:min-h-[480px]">
          <p className="max-w-xs text-center text-sm text-zinc-500">
            Agent graph (React Flow) — next FE task. Match cards use live data
            from Supabase after <code className="text-zinc-400">pnpm db:seed</code>.
          </p>
        </div>

        <aside className="flex w-full shrink-0 flex-col lg:w-[400px] xl:w-[440px]">
          <div className="flex max-h-[70vh] min-h-[360px] flex-col rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 lg:max-h-[calc(100vh-8rem)]">
            <MatchCards agentId={agentId} />
          </div>
        </aside>
      </main>
    </div>
  );
}
