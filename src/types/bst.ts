
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

export type NodeStyle = {
  highlight?: 'default' | 'deletion';
  invisible?: boolean;
};

export type EdgeStyle = {
  invisible?: boolean;
};

// A complete snapshot of the visual state at a single point in time.
export type AnimationStep = {
  nodes: VisualNode[];
  edges: VisualEdge[];
  visitorNodeId: string | null;
  nodeStyles: Map<string, NodeStyle>;
  edgeStyles: Map<string, EdgeStyle>;
  toast?: ToastMessage;
  action?: Record<string, any>;
};
