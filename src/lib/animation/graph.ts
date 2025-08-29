import type { VisualNode, VisualEdge, ToastMessage, GraphScene, GraphEventSink } from '@/types/graph-scene';

export class GraphAnimationProducer implements GraphEventSink {
  private steps: GraphScene[] = [];
  private current: GraphScene = {
    nodes: [],
    edges: [],
    visitorNodeId: null,
    nodeStyles: new Map(),
    edgeStyles: new Map(),
  };

  private pushStep(action: Record<string, any>, toast?: ToastMessage) {
    this.steps.push({
      ...this.current,
      nodeStyles: new Map(this.current.nodeStyles),
      edgeStyles: new Map(this.current.edgeStyles),
      action,
      toast,
    });
  }

  start(initialScene: GraphScene): void {
    this.current = initialScene;
    this.steps = [];
    this.pushStep({ type: 'start' });
  }

  finish(): GraphScene[] {
    this.current.nodeStyles.clear();
    this.current.edgeStyles.clear();
    this.pushStep({ type: 'end' });
    return this.steps;
  }

  visit(nodeId: string, value: number): void {
    this.current.visitorNodeId = nodeId;
    this.pushStep({ type: 'VISIT', value: value });
  }

  unvisit(): void {
    this.current.visitorNodeId = null;
    this.pushStep({ type: 'UNVISIT' });
  }

  highlightNode(nodeId: string, reason: 'found' | 'successor' | 'deletion'): void {
    this.current.nodeStyles.set(nodeId, {
      highlight: reason === 'deletion' ? 'deletion' : 'default',
    });
    this.pushStep({ type: 'HIGHLIGHT_NODE', reason: reason });
  }

  hideNode(nodeId: string): void {
    this.current.nodeStyles.set(nodeId, {
      ...this.current.nodeStyles.get(nodeId),
      invisible: true,
    });
    this.pushStep({ type: 'HIDE_NODE', nodeId: nodeId });
  }

  hideEdge(edgeIds: string[]): void {
    edgeIds.forEach(edgeId => {
      this.current.edgeStyles.set(edgeId, {
        ...this.current.edgeStyles.get(edgeId),
        invisible: true,
      });
    });
    this.pushStep({ type: 'HIDE_EDGE', edgeIds: edgeIds });
  }

  updateLayout(nodes: VisualNode[], edges: VisualEdge[], unvisit: boolean): void {
    if (unvisit) {
      this.current.visitorNodeId = null;
    }
    const edgeSet = new Set(edges.map(edge => edge.id));
    const remainingEdges = this.current.edges.filter(edge => edgeSet.has(edge.id));
    if (remainingEdges.length != this.current.edges.length) {
      // hide gone edges first
      this.current.edges = remainingEdges;
      this.pushStep({ type: 'UPDATE_LAYOUT_HIDE_EDGES'});
    }
    this.current.nodes = nodes;
    this.pushStep({ type: 'UPDATE_LAYOUT_NODES' });
    this.current.edges = edges;
    this.pushStep({ type: 'UPDATE_LAYOUT_EDGES' });
  }

  toast(toast: ToastMessage): void {
    this.pushStep({ type: 'TOAST' }, toast);
  }
}
