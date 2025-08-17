
"use client";

import React, { useMemo, useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { VisualNode, VisualEdge, AnimationStep } from '@/types/bst';

const NODE_RADIUS = 24;
const NODE_DIAMETER = NODE_RADIUS * 2;

const Node = React.memo(({ id, value, x, y, isHighlighted, isDeletionHighlight }: VisualNode & { isHighlighted: boolean, isDeletionHighlight: boolean }) => {
  const nodeBorderAnimate = {
    stroke: isDeletionHighlight
      ? "hsl(var(--destructive))"
      : isHighlighted
      ? "hsl(var(--accent))"
      : "hsl(var(--primary))",
    strokeWidth: isHighlighted || isDeletionHighlight ? 4 : 2,
  };

  return (
    <motion.g
      layoutId={id}
      initial={{ opacity: 0, scale: 0.5, x, y }}
      animate={{ opacity: 1, scale: 1, x, y }}
      exit={{ opacity: 0, scale: 0.5 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
    >
      <motion.circle
        r={NODE_RADIUS}
        fill="hsl(var(--card))"
        animate={nodeBorderAnimate}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      />
      <text
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-foreground text-lg font-medium pointer-events-none select-none"
      >
        {value}
      </text>
    </motion.g>
  );
});
Node.displayName = 'Node';

const Edge = React.memo(({ from, to, isInvisible }: { from: VisualNode; to: VisualNode, isInvisible: boolean }) => {
  return (
    <motion.line
      layoutId={`edge-${from.id}-${to.id}`}
      initial={{ 
        opacity: 0,
        x1: from.x,
        y1: from.y,
        x2: to.x,
        y2: to.y,
      }}
      animate={{
        x1: from.x,
        y1: from.y,
        x2: to.x,
        y2: to.y,
        opacity: isInvisible ? 0 : 1,
      }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      stroke="hsl(var(--primary))"
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
  deletionHighlightNodeId: string | null;
  invisibleNodes: Set<string>;
  invisibleEdges: Set<string>;
}

export function BinarySearchTreeVisualizer({
  nodes,
  edges,
  visitorNodeId,
  highlightedNodeId,
  deletionHighlightNodeId,
  invisibleNodes,
  invisibleEdges,
}: BinarySearchTreeVisualizerProps) {
  const nodeMap = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes]);
  const svgRef = useRef<SVGSVGElement>(null);
  const [svgSize, setSvgSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const svgElement = svgRef.current;
    if (!svgElement) return;

    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        setSvgSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    setSvgSize({ width: svgElement.clientWidth, height: svgElement.clientHeight });
    resizeObserver.observe(svgElement);

    return () => resizeObserver.unobserve(svgElement);
  }, []);
  
  const viewBox = useMemo(() => {
    if (nodes.length === 0 || svgSize.width === 0 || svgSize.height === 0) {
      return `0 0 1 1`;
    }

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    nodes.forEach(node => {
      minX = Math.min(minX, node.x);
      maxX = Math.max(maxX, node.x);
      minY = Math.min(minY, node.y);
      maxY = Math.max(maxY, node.y);
    });

    const contentWidth = (maxX - minX) + NODE_DIAMETER;
    const contentHeight = (maxY - minY) + NODE_DIAMETER;
    
    if (contentWidth <= 0 || contentHeight <= 0) {
      return `0 0 1 1`;
    }
    
    const scaleX = svgSize.width / contentWidth;
    const scaleY = svgSize.height / contentHeight;
    const scale = Math.min(scaleX, scaleY, 1);

    const viewBoxWidth = svgSize.width / scale;
    const viewBoxHeight = svgSize.height / scale;
    const viewBoxX = minX + (contentWidth - NODE_DIAMETER) / 2 - viewBoxWidth / 2;
    const viewBoxY = minY + (contentHeight - NODE_DIAMETER) / 2 - viewBoxHeight / 2;
    
    return `${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}`;
  }, [nodes, svgSize]);

  const visitorPosition = useMemo(() => {
    if (!visitorNodeId) return null;
    const node = nodeMap.get(visitorNodeId);
    return node ? { x: node.x, y: node.y } : null;
  }, [visitorNodeId, nodeMap]);

  return (
    <motion.svg 
        ref={svgRef} 
        className="w-full h-[600px]" 
        aria-label="Binary Search Tree visualization"
        animate={{ viewBox }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
    >
        <g>
            <AnimatePresence>
            {edges.map((edge) => {
                const fromNode = nodeMap.get(edge.from);
                const toNode = nodeMap.get(edge.to);
                if (!fromNode || !toNode) return null;
                return <Edge key={edge.id} from={fromNode} to={toNode} isInvisible={invisibleEdges.has(edge.id)} />;
            })}
            </AnimatePresence>
        </g>
        <g>
            <AnimatePresence>
            {nodes.map((node) => {
                if (invisibleNodes.has(node.id)) return null;
                return (
                    <Node
                        key={node.id}
                        {...node}
                        isHighlighted={node.id === highlightedNodeId}
                        isDeletionHighlight={node.id === deletionHighlightNodeId}
                    />
                )
            })}
            </AnimatePresence>
        </g>
        <AnimatePresence>
          {visitorPosition && (
            <motion.circle
              layoutId="visitor-circle"
              r={NODE_RADIUS + 4}
              fill="none"
              stroke="hsl(var(--accent))"
              strokeWidth={2}
              strokeDasharray="4 4"
              initial={{ opacity: 0 }}
              animate={{ 
                opacity: 1,
                cx: visitorPosition.x,
                cy: visitorPosition.y
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            />
          )}
        </AnimatePresence>
    </motion.svg>
  );
}
