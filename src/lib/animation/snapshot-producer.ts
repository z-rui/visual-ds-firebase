
import type { VisualNode, VisualEdge, AnimationStep, ToastMessage, NodeStyle, EdgeStyle } from '@/types/bst';
import type { AnimationProducer } from '@/types/animation-producer';
import { BinaryTreeNode } from '@/lib/ds/bst';
import dagre from 'dagre';

const NODE_WIDTH = 60;
const NODE_HEIGHT = 60;
const HORIZONTAL_SPACING = 10;
const VERTICAL_SPACING = 10;

/**
 * Implements the AnimationProducer interface to generate a step-by-step
 * animation storyboard from a series of method calls from a data structure
 * algorithm.
 */
export class SnapshotProducer implements AnimationProducer {
  private steps: AnimationStep[] = [];
  private currentState: AnimationStep;

  constructor(initialLayout: AnimationStep) {
    this.currentState = initialLayout;
    // Start with the initial layout as the first "step"
    this.pushStep({ type: 'start' });
  }

  private cloneStep(step: AnimationStep): AnimationStep {
    return {
      ...step,
      nodes: [...step.nodes.map(n => ({ ...n }))],
      edges: [...step.edges.map(e => ({ ...e }))],
      nodeStyles: new Map(step.nodeStyles),
      edgeStyles: new Map(step.edgeStyles),
    };
  }

  private pushStep(action: Record<string, any>, toast?: ToastMessage) {
      this.steps.push({
        ...this.currentState,
        nodeStyles: new Map(this.currentState.nodeStyles),
        edgeStyles: new Map(this.currentState.edgeStyles),
        action,
        toast,
      });
  }

  visitNode(nodeId: string, value: number): void {
    this.currentState.visitorNodeId = nodeId;
    this.pushStep({ type: 'VISIT_NODE', value: value });
  }

  highlightNode(nodeId: string, reason: 'found' | 'successor' | 'deletion'): void {
    this.currentState.nodeStyles.set(nodeId, {
      highlight: reason === 'deletion' ? 'deletion' : 'default',
    });
    this.pushStep({ type: 'HIGHLIGHT_NODE', reason: reason });
  }

  hideNode(nodeId: string): void {
    this.currentState.nodeStyles.set(nodeId, {
      ...this.currentState.nodeStyles.get(nodeId),
      invisible: true,
    });
    this.pushStep({ type: 'HIDE_NODE', nodeId: nodeId });
  }

  hideEdge(edgeIds: string[]): void {
    edgeIds.forEach(edgeId => {
      this.currentState.edgeStyles.set(edgeId, {
        ...this.currentState.edgeStyles.get(edgeId),
        invisible: true,
      });
    });
    this.pushStep({ type: 'HIDE_EDGE', edgeIds: edgeIds });
  }

  updateLayout(tree: BinaryTreeNode | null): void {
    const newLayout = this.calculateLayoutFromTree(tree);

    this.currentState.nodeStyles.clear();
    this.currentState.visitorNodeId = null;
    this.currentState.nodes = newLayout.nodes;
    this.pushStep({ type: 'UPDATE_LAYOUT_NODES' });
    this.currentState.edgeStyles.clear();
    this.currentState.edges = newLayout.edges;
    this.pushStep({ type: 'UPDATE_LAYOUT_EDGES' });
  }

  endOperation(toast?: ToastMessage): void {
    this.currentState.visitorNodeId = null;
    this.currentState.nodeStyles.clear();
    this.pushStep({ type: 'end' }, toast);
  }

  getSteps(): AnimationStep[] {
    return this.steps;
  }

  private calculateLayoutFromTree(tree: BinaryTreeNode | null): { nodes: VisualNode[], edges: VisualEdge[] } {
    if (!tree) {
      return { nodes: [], edges: [] };
    }

    const g = new dagre.graphlib.Graph();
    g.setGraph({ rankdir: 'TB', nodesep: HORIZONTAL_SPACING, ranksep: VERTICAL_SPACING });
    g.setDefaultEdgeLabel(() => ({}));

    const finalNodes: VisualNode[] = [];
    const finalEdges: VisualEdge[] = [];
    let dummyIdCounter = 0;

    const traverseForLayout = (node: BinaryTreeNode | null) => {
      if (!node) {
        return;
      }

      finalNodes.push({ id: node.id, value: node.value, x: 0, y: 0 });
      g.setNode(node.id, { label: node.value.toString(), width: NODE_WIDTH, height: NODE_HEIGHT });

      if (node.left) {
        finalEdges.push({ id: `${node.id}-${node.left.id}`, from: node.id, to: node.left.id });
        g.setEdge(node.id, node.left.id);
        traverseForLayout(node.left);
      } else if (node.right) {
        const dummyId = `dummy-left-${dummyIdCounter++}`;
        g.setNode(dummyId, { width: 0, height: 0 });
        g.setEdge(node.id, dummyId, { style: 'visibility: hidden' });
      }

      if (node.right) {
        finalEdges.push({ id: `${node.id}-${node.right.id}`, from: node.id, to: node.right.id });
        g.setEdge(node.id, node.right.id);
        traverseForLayout(node.right);
      } else if (node.left) {
        const dummyId = `dummy-right-${dummyIdCounter++}`;
        g.setNode(dummyId, { width: 0, height: 0 });
        g.setEdge(node.id, dummyId, { style: 'visibility: hidden' });
      }
    };

    traverseForLayout(tree);
    dagre.layout(g);

    const positionedNodes = finalNodes.map(node => {
      const dagreNode = g.node(node.id);
      return { ...node, x: dagreNode?.x || 0, y: dagreNode?.y || 0 };
    });

    return { nodes: positionedNodes, edges: finalEdges };
  }
}
