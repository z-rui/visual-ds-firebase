
import type { VisualNode, VisualEdge, AnimationStep, ToastMessage } from '@/types/bst';
import type { AnimationEvent } from '@/types/animation';
import { BinaryTreeNode } from '@/lib/ds/bst-v2';
import dagre from 'dagre';

const NODE_WIDTH = 60;
const NODE_HEIGHT = 60;
const HORIZONTAL_SPACING = 10;
const VERTICAL_SPACING = 10;

/**
 * Calculates node positions for a binary tree using dagre.
 * @param tree The root of the BinaryTreeNode tree.
 * @returns An object containing the calculated nodes and edges.
 */
function calculateLayoutFromTree(tree: BinaryTreeNode): { nodes: VisualNode[], edges: VisualEdge[] } {
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


/**
 * Generates a storyboard of animation steps from a series of animation events.
 * This function is the "director" that translates what the data structure
 * did into a visual representation.
 * @param events The array of AnimationEvent objects from the data structure.
 * @param initialLayout The current layout of the tree before the animation begins.
 * @returns An array of AnimationStep objects ready for the UI to render.
 */
export function generateAnimationSteps(events: AnimationEvent[], initialLayout?: AnimationStep): AnimationStep[] {
  const steps: AnimationStep[] = [];
  
  const cloneInitialLayout = (layout: AnimationStep) => {
    return {
      ...layout,
      nodes: [...layout.nodes.map(n => ({...n}))],
      edges: [...layout.edges.map(e => ({...e}))],
      invisibleNodes: new Set(layout.invisibleNodes),
      invisibleEdges: new Set(layout.invisibleEdges),
    };
  };

  let currentStepState = initialLayout 
      ? cloneInitialLayout(initialLayout)
      : {
          nodes: [],
          edges: [],
          visitorNodeId: null,
          highlightedNodeId: null,
          deletionHighlightNodeId: null,
          invisibleNodes: new Set<string>(),
          invisibleEdges: new Set<string>(),
          toast: undefined,
          action: { type: 'initial' }
      };

  // Helper to create a step from the current state
  const pushStep = (action: Record<string, any>, toast?: ToastMessage) => {
    steps.push({
        ...cloneInitialLayout(currentStepState),
        action,
        toast
    });
  };
  
  // Start with the initial layout as the first step
  if (initialLayout) {
    pushStep({ type: 'start' });
  }

  for (const event of events) {
    switch (event.type) {
      case 'VISIT_NODE':
        currentStepState.visitorNodeId = event.nodeId;
        pushStep({ type: event.type, value: event.value });
        break;

      case 'HIGHLIGHT_NODE':
        if (event.reason === 'deletion') {
            currentStepState.deletionHighlightNodeId = event.nodeId;
        } else {
            currentStepState.highlightedNodeId = event.nodeId;
        }
        pushStep({ type: event.type, reason: event.reason });
        break;

      case 'HIDE_NODE':
        currentStepState.invisibleNodes.add(event.nodeId);
        pushStep({ type: event.type, nodeId: event.nodeId });
        break;
      
      case 'HIDE_EDGE':
        event.edgeIds.forEach(edgeId => currentStepState.invisibleEdges.add(edgeId));
        pushStep({ type: event.type, edgeIds: event.edgeIds });
        break;
      
      case 'UPDATE_LAYOUT': {
        const newLayout = calculateLayoutFromTree(event.tree);
        
        const oldNodeMap = new Map(currentStepState.nodes.map(n => [n.id, n]));

        const newNodes = newLayout.nodes.filter(n => !oldNodeMap.has(n.id));
        const newEdges = newLayout.edges.filter(e => !currentStepState.edges.some(ce => ce.id === e.id));
        
        currentStepState.nodes = newLayout.nodes;
        currentStepState.edges = newLayout.edges;
        
        const newlyInvisibleNodes = new Set(newNodes.map(n => n.id));
        currentStepState.invisibleNodes = new Set([...currentStepState.invisibleNodes, ...newlyInvisibleNodes]);
        
        const newlyInvisibleEdges = new Set(newEdges.map(e => e.id));
        currentStepState.invisibleEdges = new Set([...currentStepState.invisibleEdges, ...newlyInvisibleEdges]);

        pushStep({ type: 're-layout' });
        
        if (newlyInvisibleNodes.size > 0) {
            newlyInvisibleNodes.forEach(id => currentStepState.invisibleNodes.delete(id));
            pushStep({ type: 'reveal-node' });
        }
        
        if (newlyInvisibleEdges.size > 0) {
            newlyInvisibleEdges.forEach(id => currentStepState.invisibleEdges.delete(id));
            pushStep({ type: 'reveal-edge' });
        }

        break;
      }
      
      case 'END_OPERATION':
        currentStepState.visitorNodeId = null;
        currentStepState.highlightedNodeId = null;
        currentStepState.deletionHighlightNodeId = null;
        pushStep({ type: 'end' }, event.toast);
        break;
    }
  }

  return steps;
}
