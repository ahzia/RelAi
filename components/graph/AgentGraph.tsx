"use client";

import { useEffect, useMemo } from "react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  ReactFlowProvider,
  useReactFlow,
  type Edge,
  type Node,
} from "reactflow";
import "reactflow/dist/style.css";
import type { GraphResponse } from "@/lib/dashboard/types";
import { layoutGraphNodes } from "./graph-layout";
import { statusLegend } from "./status-styles";
import { AgentNode, type AgentNodeData } from "./AgentNode";
import { AgentEdge, type AgentEdgeData } from "./AgentEdge";

const nodeTypes = { agent: AgentNode };
const edgeTypes = { agent: AgentEdge };

interface AgentGraphProps {
  data: GraphResponse | null;
  loading: boolean;
  error: string | null;
}

function toFlowGraph(data: GraphResponse): { nodes: Node<AgentNodeData>[]; edges: Edge[] } {
  const positions = layoutGraphNodes(data.nodes);

  const nodes: Node<AgentNodeData>[] = data.nodes.map((n) => ({
    id: n.id,
    type: "agent",
    position: positions.get(n.id) ?? { x: 0, y: 0 },
    data: {
      label: n.label,
      subtitle: n.subtitle,
      role: n.role,
      status: n.status,
      score: n.score,
    },
  }));

  const edges: Edge<AgentEdgeData>[] = data.edges.map((e) => ({
    id: e.id,
    type: "agent",
    source: e.source,
    target: e.target,
    animated: e.animated,
    data: { status: e.status },
  }));

  return { nodes, edges };
}

function GraphViewportSync({ signature }: { signature: string }) {
  const { fitView } = useReactFlow();

  useEffect(() => {
    if (!signature) return;
    const timer = window.setTimeout(() => {
      void fitView({ padding: 0.28, maxZoom: 1.05, duration: 600 });
    }, 60);
    return () => window.clearTimeout(timer);
  }, [signature, fitView]);

  return null;
}

function GraphLegend() {
  const legend = statusLegend();
  return (
    <div className="pointer-events-none absolute bottom-3 left-3 z-10 max-w-[200px] rounded-xl border border-white/[0.08] bg-zinc-950/85 p-2.5 shadow-xl backdrop-blur-md">
      <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-wider text-zinc-500">
        Status
      </p>
      <ul className="grid grid-cols-2 gap-x-3 gap-y-1">
        {legend.map(({ status, label }) => (
          <li
            key={status}
            className="flex items-center gap-1.5 text-[10px] text-zinc-400"
          >
            <span
              className={`h-1.5 w-1.5 shrink-0 rounded-full agent-legend-dot agent-legend-${status}`}
            />
            {label}
          </li>
        ))}
      </ul>
    </div>
  );
}

function AgentGraphCanvas({
  nodes,
  edges,
  signature,
}: {
  nodes: Node<AgentNodeData>[];
  edges: Edge[];
  signature: string;
}) {
  return (
    <ReactFlowProvider>
      <div className="agent-flow-root absolute inset-0 h-full w-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          minZoom={0.4}
          maxZoom={1.35}
          proOptions={{ hideAttribution: true }}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          panOnDrag
          zoomOnScroll
          className="agent-flow-canvas"
        >
          <GraphViewportSync signature={signature} />
          <Background
            variant={BackgroundVariant.Dots}
            gap={24}
            size={1}
            color="rgba(255,255,255,0.04)"
          />
        </ReactFlow>
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(9,9,11,0.55)_100%)]"
          aria-hidden
        />
        <GraphLegend />
      </div>
    </ReactFlowProvider>
  );
}

export function AgentGraph({ data, loading, error }: AgentGraphProps) {

  const { nodes, edges } = useMemo(
    () => (data ? toFlowGraph(data) : { nodes: [], edges: [] }),
    [data],
  );

  const signature = useMemo(
    () =>
      nodes
        .map((n) => `${n.id}:${n.data.status}`)
        .concat(edges.map((e) => e.id))
        .join("|"),
    [nodes, edges],
  );

  const hasGraph = nodes.length > 0;

  return (
    <section className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-white/[0.06] bg-zinc-950/40">
      <div className="relative min-h-0 flex-1 w-full">
        {loading && !hasGraph ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-950/95 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3">
              <span className="h-9 w-9 animate-spin rounded-full border-2 border-indigo-500/20 border-t-indigo-400" />
              <p className="text-sm text-zinc-500">Synchronizing agent network…</p>
            </div>
          </div>
        ) : null}

        {error ? (
          <div className="absolute inset-x-3 top-3 z-20 rounded-lg border border-rose-500/30 bg-rose-950/60 px-3 py-2 text-xs text-rose-200 backdrop-blur-sm">
            {error}
          </div>
        ) : null}

        {!loading && !hasGraph && !error ? (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-zinc-500">
            No agents to display yet.
          </div>
        ) : null}

        {hasGraph ? (
          <AgentGraphCanvas nodes={nodes} edges={edges} signature={signature} />
        ) : null}
      </div>
    </section>
  );
}

