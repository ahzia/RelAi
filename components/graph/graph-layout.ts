import type { GraphNodeDto } from "@/lib/dashboard/types";

const CENTER_RADIUS = 0;
const CANDIDATE_RADIUS = 340;

/**
 * Place center node at origin; candidates evenly on a ring.
 */
export function layoutGraphNodes(
  nodes: GraphNodeDto[],
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  const center = nodes.find((n) => n.role === "center");
  const candidates = nodes.filter((n) => n.role === "candidate");

  if (center) {
    positions.set(center.id, { x: CENTER_RADIUS, y: CENTER_RADIUS });
  }

  const count = candidates.length;
  candidates.forEach((node, index) => {
    const angle = (2 * Math.PI * index) / count - Math.PI / 2;
    positions.set(node.id, {
      x: Math.cos(angle) * CANDIDATE_RADIUS,
      y: Math.sin(angle) * CANDIDATE_RADIUS,
    });
  });

  return positions;
}
