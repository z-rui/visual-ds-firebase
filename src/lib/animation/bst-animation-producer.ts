
import type { VisualNode, VisualEdge, AnimationStep } from '@/types/bst';
import { BinarySearchTree, BstNode } from '@/lib/ds/bst';
import dagre from 'dagre';

const NODE_WIDTH = 60;
const NODE_HEIGHT = 60;
const HORIZONTAL_SPACING = 10;
const VERTICAL_SPACING = 10;

export function calculateLayout(tree: BinarySearchTree): { nodes: VisualNode[], edges: VisualEdge[] } {
  if (!tree.root) {
      return { nodes: [], edges: [] };
  }

  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: 'TB', nodesep: HORIZONTAL_SPACING, ranksep: VERTICAL_SPACING });
  g.setDefaultEdgeLabel(() => ({}));

  const finalNodes: VisualNode[] = [];
  const finalEdges: VisualEdge[] = [];
  let dummyIdCounter = 0;

  const traverseForLayout = (node: BstNode | null) => {
      if (!node) {
          return;
      }

      finalNodes.push({
          id: node.id,
          value: node.value,
          x: 0,
          y: 0,
      });

      g.setNode(node.id, { label: node.value.toString(), width: NODE_WIDTH, height: NODE_HEIGHT });

      if (node.left) {
          finalEdges.push({ id: `${node.id}-${node.left.id}`, from: node.id, to: node.left.id });
          g.setEdge(node.id, node.left.id);
          traverseForLayout(node.left);
      } else if (node.right) {
          // Add dummy node to preserve structure for single right children
          const dummyId = `dummy-left-${dummyIdCounter++}`;
          g.setNode(dummyId, { width: 0, height: 0 });
          g.setEdge(node.id, dummyId, { style: 'visibility: hidden' });
      }

      if (node.right) {
          finalEdges.push({ id: `${node.id}-${node.right.id}`, from: node.id, to: node.right.id });
          g.setEdge(node.id, node.right.id);
          traverseForLayout(node.right);
      } else if (node.left) {
          // Add dummy node to preserve structure for single left children
          const dummyId = `dummy-right-${dummyIdCounter++}`;
          g.setNode(dummyId, { width: 0, height: 0 });
          g.setEdge(node.id, dummyId, { style: 'visibility: hidden' });
      }
  };

  traverseForLayout(tree.root);
  dagre.layout(g);

  const positionedNodes = finalNodes.map(node => {
      const dagreNode = g.node(node.id);
      return { ...node, x: dagreNode?.x || 0, y: dagreNode?.y || 0 };
  });

  return { nodes: positionedNodes, edges: finalEdges };
}


export function generateSearchSteps(tree: BinarySearchTree, value: number): AnimationStep[] {
    const { nodes, edges } = calculateLayout(tree);
    const { traversalPath, foundNodeId } = tree.search(value);
    const steps: AnimationStep[] = [];
    let currentSnapshot: AnimationStep = { 
        nodes,
        edges,
        invisibleNodes: new Set<string>(),
        invisibleEdges: new Set<string>(),
        visitorNodeId: null,
        highlightedNodeId: null,
        deletionHighlightNodeId: null,
        action: {type: 'start-search', value}
    };
    steps.push(currentSnapshot);

    for (const nodeId of traversalPath) {
      const node = nodes.find(n => n.id === nodeId);
        currentSnapshot = { ...currentSnapshot, visitorNodeId: nodeId, action: {type: 'visit', value: node?.value }};
        steps.push(currentSnapshot);
    }

    if (foundNodeId) {
        currentSnapshot = { ...currentSnapshot, visitorNodeId: null, highlightedNodeId: foundNodeId, action: {type: 'found', value}};
    } else {
        currentSnapshot = { ...currentSnapshot, visitorNodeId: null, toast: { title: "Not Found", description: `Node with value ${value} not found.`}, action: {type: 'not-found', value}};
    }
    steps.push(currentSnapshot);
    
    steps.push({ ...currentSnapshot, highlightedNodeId: null, action: { type: 'end' }});

    return steps;
}


export function generateInsertSteps(beforeTree: BinarySearchTree, afterTree: BinarySearchTree, value: number): AnimationStep[] {
    const { nodes: beforeNodes, edges: beforeEdges } = calculateLayout(beforeTree);
    const { nodes: afterNodes, edges: afterEdges } = calculateLayout(afterTree);

    const { traversalPath } = afterTree;
    const newNodeId = traversalPath[traversalPath.length - 1];
    const steps: AnimationStep[] = [];

    let currentSnapshot: AnimationStep = {
        nodes: beforeNodes,
        edges: beforeEdges,
        invisibleNodes: new Set<string>(),
        invisibleEdges: new Set<string>(),
        visitorNodeId: null,
        highlightedNodeId: null,
        deletionHighlightNodeId: null,
        action: { type: 'start', value }
    };
    steps.push(currentSnapshot);

    // Animate traversal
    for (let i = 0; i < traversalPath.length - 1; i++) {
        const nodeId = traversalPath[i];
        const node = beforeNodes.find(n => n.id === nodeId);
        currentSnapshot = { ...currentSnapshot, visitorNodeId: nodeId, action: { type: 'visit', value: node?.value } };
        steps.push(currentSnapshot);
    }

    const newEdge = afterEdges.find(e => e.to === newNodeId);
    
    // Add new node and edge, but make them invisible. And adjust layout
    currentSnapshot = {
        ...currentSnapshot,
        nodes: afterNodes,
        edges: afterEdges,
        visitorNodeId: null,
        invisibleNodes: new Set([newNodeId]),
        invisibleEdges: newEdge ? new Set([newEdge.id]) : new Set(),
        action: { type: 'add-invisible', value }
    };
    steps.push(currentSnapshot);

    // Reveal the new node
    currentSnapshot = {
        ...currentSnapshot,
        invisibleNodes: new Set(),
        highlightedNodeId: newNodeId,
        action: { type: 'reveal-node', value }
    };
    steps.push(currentSnapshot);

    // Reveal the new edge
    currentSnapshot = {
        ...currentSnapshot,
        invisibleEdges: new Set(),
        action: { type: 'reveal-edge', value }
    };
    steps.push(currentSnapshot);
    
    steps.push({ ...currentSnapshot, highlightedNodeId: null, action: { type: 'end' }});
    
    return steps;
}

export function generateDeleteSteps(beforeTree: BinarySearchTree, afterTree: BinarySearchTree, value: number): AnimationStep[] {
    const { nodes: beforeNodes, edges: beforeEdges } = calculateLayout(beforeTree);
    const { nodes: afterNodes, edges: afterEdges } = calculateLayout(afterTree);

    const deleteResult = beforeTree.delete(value);
    const { traversalPath, foundNodeId, isTwoChildCase, successorId, successorParentId, successorRightChildId } = deleteResult;

    const steps: AnimationStep[] = [];
    let currentSnapshot: AnimationStep = {
      nodes: beforeNodes,
      edges: beforeEdges,
      invisibleNodes: new Set<string>(),
      invisibleEdges: new Set<string>(),
      visitorNodeId: null,
      highlightedNodeId: null,
      deletionHighlightNodeId: null,
      action: { type: 'start-delete', value }
    };
    steps.push(currentSnapshot);

    const searchPathEndIndex = foundNodeId ? traversalPath.indexOf(foundNodeId) : -1;
    const searchPath = searchPathEndIndex !== -1 ? traversalPath.slice(0, searchPathEndIndex + 1) : traversalPath;
    
    for (const nodeId of searchPath) {
      const node = beforeNodes.find(n => n.id === nodeId);
      currentSnapshot = { ...currentSnapshot, visitorNodeId: nodeId, action: { type: 'visit', value: node?.value } };
      steps.push(currentSnapshot);
    }

    if (!foundNodeId) {
      steps.push({ ...currentSnapshot, visitorNodeId: null, toast: { title: "Not Found", description: `Node with value ${value} not found.` }, action: { type: 'not-found', value } });
    } else {
        currentSnapshot = { ...currentSnapshot, deletionHighlightNodeId: foundNodeId, action: { type: 'found-for-deletion', value } };
        steps.push(currentSnapshot);
        
      if (isTwoChildCase && successorId) {
        // Step 3: Find successor
        const successorPath = traversalPath.slice(searchPathEndIndex + 1);
        for (const nodeId of successorPath) {
            const node = beforeNodes.find(n => n.id === nodeId);
            currentSnapshot = { ...currentSnapshot, visitorNodeId: nodeId, action: { type: 'visit-successor', value: node?.value }};
            steps.push(currentSnapshot);
        }
        currentSnapshot = {...currentSnapshot, highlightedNodeId: successorId };
        steps.push(currentSnapshot);

        let invisibleEdges = new Set<string>();

        // Step 4a: Unlink successor from parent
        const edgeToSuccessorParent = beforeEdges.find(e => e.to === successorId && e.from === successorParentId);
        if (edgeToSuccessorParent) {
            invisibleEdges.add(edgeToSuccessorParent.id);
            currentSnapshot = { ...currentSnapshot, invisibleEdges: new Set(invisibleEdges), action: { type: 'unlink-successor-parent' } };
            steps.push(currentSnapshot);
        }

        // Step 4b: Unlink successor from child
        const edgeToSuccessorChild = successorRightChildId ? beforeEdges.find(e => e.to === successorRightChildId && e.from === successorId) : null;
        if (edgeToSuccessorChild) {
            invisibleEdges.add(edgeToSuccessorChild.id);
            currentSnapshot = { ...currentSnapshot, invisibleEdges: new Set(invisibleEdges), action: { type: 'unlink-successor-child' } };
            steps.push(currentSnapshot);

            // Step 4c: Re-wire successor's child
            const newEdgeToGrandParent = afterEdges.find(e => e.from === successorParentId && e.to === successorRightChildId);
            if (newEdgeToGrandParent) {
                const tempInvisible = new Set(afterEdges.map(e => e.id));
                tempInvisible.delete(newEdgeToGrandParent.id);

                currentSnapshot = { 
                  ...currentSnapshot, 
                  nodes: beforeNodes, 
                  edges: afterEdges, 
                  invisibleEdges: tempInvisible,
                  action: { type: 'rewire-successor-child' } 
                };
                steps.push(currentSnapshot);
                // Set invisibleEdges for the next step based on which edges should be visible now
                invisibleEdges = new Set(afterEdges.filter(e => !beforeEdges.some(be => be.id === e.id) && e.id !== newEdgeToGrandParent.id).map(e => e.id));
            }
        }
        
        // Step 5: Unlink Target's Children
        const targetChildrenEdges = beforeEdges.filter(e => e.from === foundNodeId);
        targetChildrenEdges.forEach(e => invisibleEdges.add(e.id));
        currentSnapshot = { ...currentSnapshot, nodes: beforeNodes, edges: beforeEdges, invisibleEdges: new Set(invisibleEdges), action: { type: 'unlink-target-children' } };
        steps.push(currentSnapshot);
        
        // Step 6: Fade Out Node
        currentSnapshot = { ...currentSnapshot, invisibleNodes: new Set([foundNodeId]), visitorNodeId: null, highlightedNodeId: null, action: { type: 'fade-out-node', value }};
        steps.push(currentSnapshot);
        
        // Step 7: Move Successor
        const successorNode = beforeNodes.find(n => n.id === successorId)!;
        const targetNodePos = beforeNodes.find(n => n.id === foundNodeId)!;
        
        const nodesWithMovedSuccessor = beforeNodes.map(n => {
            if (n.id === successorId) {
                return { ...n, x: targetNodePos.x, y: targetNodePos.y };
            }
            return n;
        });

        currentSnapshot = { ...currentSnapshot, nodes: nodesWithMovedSuccessor, deletionHighlightNodeId: null, highlightedNodeId: successorId, action: { type: 'move-successor' }};
        steps.push(currentSnapshot);
        
        // Step 8: Link Successor to Target's Children
        const finalSuccessorNode = afterNodes.find(n => n.id === successorId)!;
        const finalEdges = afterEdges.filter(e => e.from === successorId);
        
        // Make only the *new* edges visible, keeping the rest of the existing invisible edges from previous steps
        const newlyVisibleEdges = new Set(finalEdges.map(e => e.id));
        const finalInvisibleEdges = new Set(invisibleEdges);
        newlyVisibleEdges.forEach(id => finalInvisibleEdges.delete(id));
        
        currentSnapshot = {
          ...currentSnapshot,
          nodes: nodesWithMovedSuccessor.map(n => n.id === successorId ? finalSuccessorNode : n),
          edges: afterEdges,
          invisibleEdges: finalInvisibleEdges,
          action: { type: 'link-successor-children'}
        }
        steps.push(currentSnapshot);
        
        // Final update layout step
        currentSnapshot = {
          ...currentSnapshot,
          nodes: afterNodes,
          edges: afterEdges,
          invisibleNodes: new Set(),
          invisibleEdges: new Set(),
          highlightedNodeId: null,
          action: { type: 'update-layout' }
        };
        steps.push(currentSnapshot);

      } else { // 0 or 1 child case
        const edgeToParent = beforeEdges.find(e => e.to === foundNodeId);
        let invisibleEdges = new Set<string>();
        
        if (edgeToParent) {
          invisibleEdges.add(edgeToParent.id);
          currentSnapshot = {
            ...currentSnapshot,
            visitorNodeId: null,
            invisibleEdges: new Set(invisibleEdges),
            action: { type: 'fade-out-parent-edge' }
          };
          steps.push(currentSnapshot);
        }

        const edgeToChild = beforeEdges.find(e => e.from === foundNodeId);
        if (edgeToChild) {
            invisibleEdges.add(edgeToChild.id);
            currentSnapshot = {
                ...currentSnapshot,
                visitorNodeId: null,
                invisibleEdges: new Set(invisibleEdges),
                action: { type: 'fade-out-child-edge' }
            };
            steps.push(currentSnapshot);
        }

        currentSnapshot = {
          ...currentSnapshot,
          visitorNodeId: null,
          invisibleNodes: new Set([foundNodeId]),
          action: { type: 'fade-out-node', value }
        };
        steps.push(currentSnapshot);
        
        const finalEdge = edgeToChild ? afterEdges.find(e => e.to === edgeToChild.to && e.from !== edgeToChild.from) : null;
        if (finalEdge) {
            const tempInvisibleEdges = new Set(afterEdges.map(e => e.id));
            tempInvisibleEdges.delete(finalEdge.id);

            const tempSnapshotWithNewEdge = {
              ...currentSnapshot,
              nodes: beforeNodes, // Use beforeNodes to keep positions stable
              edges: afterEdges,
              invisibleEdges: tempInvisibleEdges,
              action: { type: 'add-new-edge-invisible' }
            }
            steps.push(tempSnapshotWithNewEdge);
            
            const finalInvisibleEdges = new Set(tempSnapshotWithNewEdge.invisibleEdges);
            
            currentSnapshot = {
                ...tempSnapshotWithNewEdge,
                invisibleEdges: finalInvisibleEdges,
                action: { type: 'fade-in-new-edge' }
            };
            steps.push(currentSnapshot);
        }
        
        currentSnapshot = {
          ...currentSnapshot,
          nodes: afterNodes,
          edges: afterEdges,
          invisibleNodes: new Set(),
          invisibleEdges: new Set(),
          deletionHighlightNodeId: null,
          action: { type: 'update-layout' }
        };
        steps.push(currentSnapshot);
      }
    }
    
    steps.push({ ...currentSnapshot, nodes: afterNodes, edges: afterEdges, invisibleNodes: new Set(), invisibleEdges: new Set(), visitorNodeId: null, highlightedNodeId: null, deletionHighlightNodeId: null, action: { type: 'end' }});
    
    return steps;
}
