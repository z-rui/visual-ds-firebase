
"use client";

import React, { useMemo, useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { VisualNode, VisualEdge, NodeStyle, EdgeStyle } from '@/types/graph-scene';

const NODE_RADIUS = 24;
const NODE_DIAMETER = NODE_RADIUS * 2;

const Node = React.memo(({ node, nodeStyle }: { node: VisualNode, nodeStyle?: NodeStyle }) => {
  const isHighlighted = nodeStyle?.highlight === 'default';
  const isDeletionHighlight = nodeStyle?.highlight === 'deletion';

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
      layoutId={node.id}
      initial={{ opacity: 0, scale: 0.5, x: node.x, y: node.y }}
      animate={{
        opacity: nodeStyle?.invisible ? 0 : 1,
        scale: 1,
        x: node.x,
        y: node.y
      }}
      exit={{ opacity: 0, scale: 0.5 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
    >
      <motion.circle
        r={NODE_RADIUS}
        fill="hsl(var(--card))"
        initial={{strokeWidth: 2}}
        animate={nodeBorderAnimate}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      />
      <text
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-foreground text-lg font-medium pointer-events-none select-none"
      >
        {node.value}
      </text>
    </motion.g>
  );
});
Node.displayName = 'Node';

const Edge = React.memo(({ from, to, edgeStyle }: { from: VisualNode; to: VisualNode, edgeStyle?: EdgeStyle }) => {
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
        opacity: edgeStyle?.invisible ? 0 : 1,
      }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      stroke="hsl(var(--primary))"
      strokeWidth="2"
    />
  );
});
Edge.displayName = 'Edge';

interface GraphRendererProps {
  nodes: VisualNode[];
  edges: VisualEdge[];
  visitorNodeId: string | null;
  nodeStyles?: Map<string, NodeStyle>;
  edgeStyles?: Map<string, EdgeStyle>;
}

export function GraphRenderer({
  nodes,
  edges,
  visitorNodeId,
  nodeStyles = new Map(),
  edgeStyles = new Map(),
}: GraphRendererProps) {
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
        className="h-full w-full min-h-[400px]"
        aria-label="Graph visualization"
        animate={{ viewBox }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
    >
        <AnimatePresence>
          {edges.map((edge) => {
              const fromNode = nodeMap.get(edge.from);
              const toNode = nodeMap.get(edge.to);
              if (!fromNode || !toNode) return null;
              return <Edge key={edge.id} from={fromNode} to={toNode} edgeStyle={edgeStyles.get(edge.id)} />;
          })}
          {nodes.map((node) => (
              <Node
                  key={node.id}
                  node={node}
                  nodeStyle={nodeStyles.get(node.id)}
              />
          ))}
          {visitorPosition && (
            <motion.circle
              layoutId="visitor-circle"
              r={NODE_RADIUS + 4}
              fill="none"
              stroke="hsl(var(--accent))"
              strokeWidth={4}
              strokeDasharray="4 4"
              initial={{ opacity: 0, cx: visitorPosition.x, cy: visitorPosition.y }}
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
