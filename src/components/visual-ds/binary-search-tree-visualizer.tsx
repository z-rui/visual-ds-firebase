"use client";

import React, { useMemo } from 'react';
import type { VisualNode, VisualEdge } from '@/types/bst';
import { cn } from '@/lib/utils';

const NODE_DIAMETER = 48;
const NODE_RADIUS = NODE_DIAMETER / 2;

const Node = React.memo(({ id, value, x, y, isHighlighted }: VisualNode & { isHighlighted: boolean }) => (
  <div
    style={{
      left: `calc(50% + ${x}px)`,
      top: `${y}px`,
      width: `${NODE_DIAMETER}px`,
      height: `${NODE_DIAMETER}px`,
      transform: 'translate(-50%, 0)',
    }}
    className={cn(
      "absolute flex items-center justify-center rounded-full border-2 bg-card transition-all duration-500",
      isHighlighted ? "border-accent bg-accent/20 ring-2 ring-accent" : "border-primary",
    )}
  >
    <span className="text-lg font-medium text-foreground">{value}</span>
  </div>
));
Node.displayName = 'Node';


const Edge = React.memo(({ from, to }: { from: VisualNode; to: VisualNode }) => {
  const x1 = from.x;
  const y1 = from.y + NODE_RADIUS;
  const x2 = to.x;
  const y2 = to.y + NODE_RADIUS;

  const angle = Math.atan2(y2 - y1, x2 - x1);
  const startX = x1 + NODE_RADIUS * Math.cos(angle);
  const startY = y1 + NODE_RADIUS * Math.sin(angle);
  const endX = x2 - NODE_RADIUS * Math.cos(angle);
  const endY = y2 - NODE_RADIUS * Math.sin(angle);
  
  return (
      <line
        x1={`calc(50% + ${startX}px)`}
        y1={startY}
        x2={`calc(50% + ${endX}px)`}
        y2={endY}
        className="stroke-primary transition-all duration-500"
        strokeWidth="2"
      />
  );
});
Edge.displayName = 'Edge';


interface BinarySearchTreeVisualizerProps {
  nodes: VisualNode[];
  edges: VisualEdge[];
  visitorNodeId: string | null;
  highlightedNodeId: string | null;
}

export function BinarySearchTreeVisualizer({
  nodes,
  edges,
  visitorNodeId,
  highlightedNodeId,
}: BinarySearchTreeVisualizerProps) {
  const nodeMap = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes]);

  const visitorPosition = useMemo(() => {
    if (!visitorNodeId) return null;
    const node = nodeMap.get(visitorNodeId);
    return node ? { x: node.x, y: node.y } : null;
  }, [visitorNodeId, nodeMap]);

  return (
    <div className="relative w-full h-[500px] overflow-hidden" aria-label="Binary Search Tree visualization">
      <div className="absolute inset-0">
        {visitorPosition && (
          <div
            className="absolute rounded-full border-2 border-dashed border-accent ring-2 ring-accent/30 transition-all duration-500 ease-in-out"
            style={{
              width: `${NODE_DIAMETER + 8}px`,
              height: `${NODE_DIAMETER + 8}px`,
              left: `calc(50% + ${visitorPosition.x}px)`,
              top: `${visitorPosition.y}px`,
              transform: 'translate(-50%, -4px)',
            }}
            aria-hidden="true"
          />
        )}
        
        <svg width="100%" height="100%" className="absolute inset-0" aria-hidden="true">
          <defs>
             <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" className="fill-primary" />
             </marker>
          </defs>
          {edges.map((edge) => {
            const fromNode = nodeMap.get(edge.from);
            const toNode = nodeMap.get(edge.to);
            if (!fromNode || !toNode) return null;
            return <Edge key={edge.id} from={fromNode} to={toNode} />;
          })}
        </svg>

        {nodes.map((node) => (
          <Node key={node.id} {...node} isHighlighted={node.id === highlightedNodeId} />
        ))}
      </div>
    </div>
  );
}
