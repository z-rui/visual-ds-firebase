
import { GraphEventSink, VisualEdge, VisualNode } from "@/types/graph-scene";
import dagre from "dagre";

// TODO: Geometry should be moved to a separate layout module.
const NODE_WIDTH = 60;
const NODE_HEIGHT = 60;
const HORIZONTAL_SPACING = 10;
const VERTICAL_SPACING = 10;

class HeapNode {
  id: string;
  value: number;

  constructor(id: string, value: number) {
    this.id = id;
    this.value = value;
  }
}

export class Heap {
  private heap: HeapNode[] = [];
  private nodeIdCounter: number = 0;
  public ui: GraphEventSink;

  constructor(ui: GraphEventSink) {
    this.ui = ui;
  }

  private getParentIndex(i: number): number {
    return Math.floor((i - 1) / 2);
  }

  private getLeftChildIndex(i: number): number {
    return 2 * i + 1;
  }

  private getRightChildIndex(i: number): number {
    return 2 * i + 2;
  }

  private swap(i: number, j: number) {
    [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]];
  }

  public add(value: number): void {
    const newNode = new HeapNode(`node-${this.nodeIdCounter++}`, value);
    this.heap.push(newNode);
    this.updateLayout(false); // Don't unvisit, as there is no visitor

    let currentIndex = this.heap.length - 1;
    
    // Sift-up loop
    while (currentIndex > 0) {
      let parentIndex = this.getParentIndex(currentIndex);
      
      this.ui.highlightNode(this.heap[currentIndex].id, 'default');

      if (this.heap[parentIndex].value > this.heap[currentIndex].value) {
        // Highlight parent for swap
        this.ui.highlightNode(this.heap[parentIndex].id, 'default');
        
        this.swap(currentIndex, parentIndex);
        this.updateLayout(false);
        
        currentIndex = parentIndex;
      } else {
        // Correct position found, break loop
        break;
      }
    }
    this.updateLayout(); // Final layout update with highlights cleared
  }

  public extractMin(): void {
    if (this.heap.length === 0) {
      this.ui.toast({ title: "Heap is empty", description: "Cannot extract from an empty heap.", variant: 'destructive' });
      return;
    }

    this.ui.highlightNode(this.heap[0].id, 'deletion');
    
    const min = this.heap[0].value;
    const lastNode = this.heap.pop();

    if (this.heap.length > 0 && lastNode) {
      this.heap[0] = lastNode;
      this.updateLayout(false);

      let currentIndex = 0;
      // Sift-down loop
      while (true) {
        this.ui.highlightNode(this.heap[currentIndex].id, 'default');
        let leftChildIndex = this.getLeftChildIndex(currentIndex);
        let rightChildIndex = this.getRightChildIndex(currentIndex);
        let smallestChildIndex = currentIndex;

        if (leftChildIndex < this.heap.length && this.heap[leftChildIndex].value < this.heap[smallestChildIndex].value) {
          smallestChildIndex = leftChildIndex;
        }
        if (rightChildIndex < this.heap.length && this.heap[rightChildIndex].value < this.heap[smallestChildIndex].value) {
          smallestChildIndex = rightChildIndex;
        }

        if (smallestChildIndex !== currentIndex) {
          // Highlight child for swap
          this.ui.highlightNode(this.heap[smallestChildIndex].id, 'default');
          this.swap(currentIndex, smallestChildIndex);
          this.updateLayout(false);
          currentIndex = smallestChildIndex;
        } else {
          // Correct position found, break loop
          break;
        }
      }
    }
    
    this.updateLayout();
    this.ui.toast({ title: "Extracted Min", description: `Extracted minimum value: ${min}` });
  }
  
  public search(value: number): void {
    // Search is not a standard heap operation.
    this.ui.toast({ title: 'Not Applicable', description: 'Search is not a standard operation for a heap.', variant: 'destructive' });
  }

  public delete(value: number): void {
    // Delete arbitrary value is not a standard heap operation.
     this.ui.toast({ title: 'Not Applicable', description: 'Deleting an arbitrary element is not a standard operation for a heap.', variant: 'destructive' });
  }


  public getLayout(): [VisualNode[], VisualEdge[]] {
    if (this.heap.length === 0) {
      return [[], []];
    }

    const g = new dagre.graphlib.Graph();
    g.setGraph({ rankdir: 'TB', nodesep: HORIZONTAL_SPACING, ranksep: VERTICAL_SPACING });
    g.setDefaultEdgeLabel(() => ({}));

    const finalNodes: VisualNode[] = [];
    const finalEdges: VisualEdge[] = [];

    this.heap.forEach((node, index) => {
      finalNodes.push({ id: node.id, value: node.value, tag: index, x: 0, y: 0 });
      g.setNode(node.id, { label: node.value.toString(), width: NODE_WIDTH, height: NODE_HEIGHT });

      if (index > 0) {
        const parentIndex = this.getParentIndex(index);
        const parentNode = this.heap[parentIndex];
        const edgeId = `${parentNode.id}-${node.id}`;
        finalEdges.push({ id: edgeId, from: parentNode.id, to: node.id });
        g.setEdge(parentNode.id, node.id);
      }
    });

    dagre.layout(g);

    finalNodes.forEach(node => {
      const dagreNode = g.node(node.id);
      node.x = dagreNode.x;
      node.y = dagreNode.y;
    });

    return [finalNodes, finalEdges];
  }
  
  public updateLayout(unvisit: boolean = true): void {
    const [nodes, edges] = this.getLayout();
    this.ui.updateLayout(nodes, edges, unvisit);
  }

  public clear(): void {
    this.heap = [];
    this.updateLayout();
  }
}
