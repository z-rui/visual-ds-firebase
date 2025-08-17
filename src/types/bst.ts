
export type VisualNode = {
  id: string;
  value: number;
  x: number;
  y: number;
};

export type VisualEdge = {
  id:string; // ID of the `to` node
  from: string;
  to: string;
};

export type ToastMessage = {
  title: string;
  description: string;
  variant?: 'default' | 'destructive'
}

// A complete snapshot of the visual state at a single point in time.
export type AnimationStep = {
  nodes: VisualNode[];
  edges: VisualEdge[];
  visitorNodeId: string | null;
  highlightedNodeId: string | null;
  deletionHighlightNodeId: string | null;
  invisibleNodes: Set<string>;
  invisibleEdges: Set<string>;
  toast?: ToastMessage;
  action?: Record<string, any>;
};
