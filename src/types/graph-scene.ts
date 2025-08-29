export type VisualNode = {
  id: string;
  value: number;
  x: number;
  y: number;
  tag?: string | number;
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

export type GraphScene = {
  nodes: VisualNode[];
  edges: VisualEdge[];
  visitorNodeId: string | null;
  nodeStyles: Map<string, NodeStyle>;
  edgeStyles: Map<string, EdgeStyle>;
  toast?: ToastMessage;
  action?: Record<string, any>;
};

export interface GraphEventSink {
  visit(nodeId: string, value: number): void;
  unvisit(): void;
  highlightNode(nodeId: string, reason: 'found' | 'successor' | 'deletion'): void;
  hideNode(nodeId: string): void;
  hideEdge(edgeIds: string[]): void;
  updateLayout(nodes: VisualNode[], edges: VisualEdge[], unvisit?: boolean): void;
  toast(toast: ToastMessage): void;
}
