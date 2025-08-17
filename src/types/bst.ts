export type VisualNode = {
  id: string;
  value: number;
  x: number;
  y: number;
};

export type VisualEdge = {
  id: string;
  from: string;
  to: string;
};

export type AnimationStep =
  | { type: 'visit'; nodeId: string }
  | { type: 'compare'; nodeId: string; value: number }
  | { type: 'insert'; parentId: string | null; nodeId: string; value: number; direction: 'left' | 'right' | 'root' }
  | { type: 'delete'; nodeId: string }
  | { type: 'replace'; oldNodeId: string; newNodeId: string; value: number }
  | { type: 'search-found'; nodeId: string }
  | { type: 'search-not-found'; message: string }
  | { type: 'highlight'; nodeId: string }
  | { type: 'unhighlight'; nodeId: string }
  | { type: 'traversal-end' }
  | { type: 'error'; message: string };

export type TraversalType = 'in-order' | 'pre-order' | 'post-order';
