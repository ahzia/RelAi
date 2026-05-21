"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  Handle,
  Position,
  type Edge,
  type Node,
  type NodeProps,
} from "reactflow";
import "reactflow/dist/style.css";
import type { GraphNodeStatus, GraphResponse } from "@/lib/db/types";

const POLL_MS = 1500;

type AgentNodeData = {
  label: string;
  role: "center" | "candidate";
  status: GraphNodeStatus;
  score?: number;
};

type EdgeStatus = GraphResponse["edges"][number]["status"];

type StatusStyle = {
  label: string;
  border: string;
  bg: string;
  dot: string;
  pulse: boolean;
};

const STATUS_STYLE: Record<GraphNodeStatus, StatusStyle> = {
  idle: {
    label: "Idle",
    border: "border-zinc-700",
    bg: "bg-zinc-900/80",
    dot: "bg-zinc-500",
    pulse: false,
  },
  scanning: {
    label: "Scanning",
    border: "border-blue-500/60",
    bg: "bg-blue-500/10",
    dot: "bg-blue-400",
    pulse: true,
  },
  contacting: {
    label: "Contacting",
    border: "border-amber-500/60",
    bg: "bg-amber-500/10",
    dot: "bg-amber-400",
    pulse: true,
  },
  negotiating: {
    label: "Negotiating",
    border: "border-purple-500/60",
    bg: "bg-purple-500/10",
    dot: "bg-purple-400",
    pulse: true,
  },
  matched: {
    label: "Matched",
    border: "border-emerald-500/60",
    bg: "bg-emerald-500/15",
    dot: "bg-emerald-400",
    pulse: false,
  },
  rejected: {
    label: "Rejected",
    border: "border-red-500/40",
    bg: "bg-red-500/5",
    dot: "bg-red-500",
    pulse: false,
  },
};

const EDGE_COLOR: Record<EdgeStatus, string> = {
  scanning: "#3b82f6",
  contacting: "#f59e0b",
  negotiating: "#a855f7",
  matched: "#10b981",
  rejected: "#ef4444",
};

function AgentNode({ data }: NodeProps<AgentNodeData>) {
  const style = STATUS_STYLE[data.status];
  const isCenter = data.role === "center";
  const isRejected = data.status === "rejected";

  return (
    <div
      className={`relative rounded-2xl border ${style.border} ${style.bg} backdrop-blur-sm shadow-lg transition-colors ${
        isCenter ? "px-5 py-3" : "px-4 py-2.5"
      } ${isRejected ? "opacity-60" : ""}`}
    >
      <Handle type="target" position={Position.Top} className="!opacity-0" />
      <Handle type="source" position={Position.Bottom} className="!opacity-0" />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="!opacity-0"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!opacity-0"
      />

      {style.pulse && (
        <span
          className={`pointer-events-none absolute -inset-1 rounded-2xl ${style.border} border-2 animate-pulse`}
          aria-hidden
        />
      )}

      <div className="relative flex items-center gap-3">
        <span
          className={`h-2.5 w-2.5 shrink-0 rounded-full ${style.dot} ${
            style.pulse ? "animate-pulse" : ""
          }`}
          aria-hidden
        />
        <div className="flex min-w-0 flex-col">
          <span
            className={`truncate font-semibold ${
              isCenter ? "text-base text-zinc-50" : "text-sm text-zinc-100"
            }`}
          >
            {data.label}
          </span>
          <span className="text-[10px] uppercase tracking-wider text-zinc-400">
            {isCenter ? "You" : style.label}
            {typeof data.score === "number" && ` · ${data.score}% match`}
          </span>
        </div>
      </div>
    </div>
  );
}

const NODE_TYPES = { agent: AgentNode };

const CENTER_X = 360;
const CENTER_Y = 220;
const RADIUS = 220;

function computeLayout(graph: GraphResponse): {
  nodes: Node<AgentNodeData>[];
  edges: Edge[];
} {
  const center = graph.nodes.find((n) => n.role === "center");
  const candidates = graph.nodes.filter((n) => n.role === "candidate");

  const flowNodes: Node<AgentNodeData>[] = [];

  if (center) {
    flowNodes.push({
      id: center.id,
      type: "agent",
      position: { x: CENTER_X - 90, y: CENTER_Y - 28 },
      data: {
        label: center.label,
        role: "center",
        status: center.status,
        score: center.score,
      },
      draggable: false,
      selectable: false,
    });
  }

  candidates.forEach((node, i) => {
    const angle = (i / Math.max(candidates.length, 1)) * Math.PI * 2 - Math.PI / 2;
    flowNodes.push({
      id: node.id,
      type: "agent",
      position: {
        x: CENTER_X + RADIUS * Math.cos(angle) - 90,
        y: CENTER_Y + RADIUS * Math.sin(angle) - 24,
      },
      data: {
        label: node.label,
        role: "candidate",
        status: node.status,
        score: node.score,
      },
      draggable: false,
      selectable: false,
    });
  });

  const flowEdges: Edge[] = graph.edges.map((edge) => {
    const color = EDGE_COLOR[edge.status];
    return {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      animated: edge.animated,
      style: { stroke: color, strokeWidth: 2 },
      type: "default",
    };
  });

  return { nodes: flowNodes, edges: flowEdges };
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(diff) || diff < 0) return "just now";
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return new Date(iso).toLocaleDateString();
}

type AgentGraphProps = {
  agentId: string;
};

export function AgentGraph({ agentId }: AgentGraphProps) {
  const [graph, setGraph] = useState<GraphResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const stopped = useRef(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/agents/${agentId}/graph`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`Graph unavailable (${res.status})`);
      const body = (await res.json()) as GraphResponse;
      if (!stopped.current) {
        setGraph(body);
        setError(null);
      }
    } catch (e) {
      if (!stopped.current) {
        setError(e instanceof Error ? e.message : "Could not load graph");
      }
    }
  }, [agentId]);

  useEffect(() => {
    stopped.current = false;
    void load();
    const id = setInterval(() => void load(), POLL_MS);
    return () => {
      stopped.current = true;
      clearInterval(id);
    };
  }, [load]);

  const { nodes, edges } = useMemo(() => {
    if (!graph) return { nodes: [], edges: [] };
    return computeLayout(graph);
  }, [graph]);

  const recentActivity = useMemo(
    () => (graph?.activity ?? []).slice(0, 5),
    [graph],
  );

  if (error && !graph) {
    return (
      <div className="flex h-full items-center justify-center rounded-xl border border-red-500/30 bg-red-500/5">
        <p className="text-sm text-red-300">{error}</p>
      </div>
    );
  }

  if (!graph) {
    return (
      <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-zinc-800 bg-zinc-900/30">
        <p className="text-sm text-zinc-500">Loading agent graph…</p>
      </div>
    );
  }

  if (graph.nodes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-zinc-800 bg-zinc-900/30">
        <p className="max-w-xs text-center text-sm text-zinc-500">
          Your agent hasn&apos;t started networking yet. Trigger the workflow to
          populate the graph.
        </p>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/60">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={NODE_TYPES}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        minZoom={0.4}
        maxZoom={1.4}
        panOnDrag
        zoomOnScroll={false}
        zoomOnPinch
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color="#27272a"
        />
      </ReactFlow>

      <div className="pointer-events-none absolute left-3 top-3 flex flex-wrap gap-1.5">
        {(
          [
            "scanning",
            "contacting",
            "negotiating",
            "matched",
            "rejected",
          ] as const
        ).map((s) => (
          <span
            key={s}
            className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-950/80 px-2 py-0.5 text-[10px] uppercase tracking-wider text-zinc-400 backdrop-blur"
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${STATUS_STYLE[s].dot}`}
              aria-hidden
            />
            {STATUS_STYLE[s].label}
          </span>
        ))}
      </div>

      {recentActivity.length > 0 && (
        <div className="pointer-events-none absolute inset-x-3 bottom-3 max-h-32 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/85 p-2 backdrop-blur">
          <p className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Live activity
          </p>
          <ul className="space-y-0.5">
            {recentActivity.map((event) => (
              <li
                key={event.id}
                className="flex items-baseline justify-between gap-2 px-1 text-xs text-zinc-300"
              >
                <span className="truncate">{event.message}</span>
                <span className="shrink-0 text-[10px] text-zinc-500 tabular-nums">
                  {relativeTime(event.created_at)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
