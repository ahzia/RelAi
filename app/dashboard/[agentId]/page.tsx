import Link from "next/link";
import { AgentStatusHeader } from "@/components/dashboard/AgentStatusHeader";
import { MissionControlMain } from "@/components/dashboard/MissionControlMain";

interface DashboardPageProps {
  params: Promise<{ agentId: string }>;
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { agentId } = await params;

  return (
    <div className="mission-control flex h-dvh flex-col overflow-hidden bg-zinc-950 text-zinc-100">
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_40%_at_50%_0%,rgba(99,102,241,0.12),transparent_55%)]"
        aria-hidden
      />

      <AgentStatusHeader agentId={agentId} />

      <main className="relative flex min-h-0 flex-1 flex-col p-2 sm:p-3">
        <MissionControlMain agentId={agentId} />
      </main>

      <footer className="shrink-0 flex items-center justify-between border-t border-white/[0.04] px-3 py-1.5 text-[10px] text-zinc-600 sm:px-4">
        <code className="font-mono text-zinc-500">{agentId}</code>
        <Link href="/" className="transition-colors hover:text-zinc-400">
          Exit
        </Link>
      </footer>
    </div>
  );
}
