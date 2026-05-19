"use client";

import { AgentGraph } from "@/components/graph/AgentGraph";
import { ActivityFeed } from "@/components/feed/ActivityFeed";
import { useAgentGraph } from "@/hooks/useAgentGraph";

interface MissionControlMainProps {
  agentId: string;
}

export function MissionControlMain({ agentId }: MissionControlMainProps) {
  const { data, error, loading } = useAgentGraph(agentId);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 lg:flex-row lg:gap-3">
      <div className="min-h-0 min-h-[50vh] flex-1 lg:min-h-0">
        <AgentGraph data={data} loading={loading} error={error} />
      </div>
      <div className="flex min-h-0 w-full max-h-[36vh] shrink-0 flex-col lg:max-h-none lg:w-72 xl:w-80">
        <ActivityFeed activities={data?.activity ?? []} loading={loading} />
      </div>
    </div>
  );
}
