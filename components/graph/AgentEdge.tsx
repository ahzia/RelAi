"use client";

import { memo } from "react";
import {
  BaseEdge,
  getBezierPath,
  type EdgeProps,
} from "reactflow";
import { EDGE_STATUS_STYLES } from "./status-styles";
import type { EdgeStatus } from "@/lib/dashboard/types";

export interface AgentEdgeData {
  status?: EdgeStatus;
}

function AgentEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  markerEnd,
  data,
  animated,
}: EdgeProps<AgentEdgeData>) {
  const status = data?.status ?? "scanning";
  const color = EDGE_STATUS_STYLES[status]?.edge ?? "#6366f1";

  const [path] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    curvature: 0.22,
  });

  return (
    <>
      <defs>
        <linearGradient id={`edge-glow-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={color} stopOpacity={0.15} />
          <stop offset="50%" stopColor={color} stopOpacity={0.9} />
          <stop offset="100%" stopColor={color} stopOpacity={0.15} />
        </linearGradient>
      </defs>
      <BaseEdge
        id={id}
        path={path}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: `url(#edge-glow-${id})`,
          strokeWidth: animated ? 2.5 : 1.75,
          strokeLinecap: "round",
          strokeDasharray: animated ? "8 6" : undefined,
          animation: animated ? "agent-edge-dash 1.2s linear infinite" : undefined,
        }}
      />
      {animated ? (
        <circle r="3" fill={color} className="agent-edge-particle">
          <animateMotion dur="2.2s" repeatCount="indefinite" path={path} />
        </circle>
      ) : null}
    </>
  );
}

export const AgentEdge = memo(AgentEdgeComponent);
