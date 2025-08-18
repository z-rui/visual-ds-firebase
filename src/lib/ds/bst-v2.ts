
import type { AnimationEvent } from '@/types/animation';

// --- V2 Data Structure Implementation ---

export class BinaryTreeNode {
  value: number;
  left: BinaryTreeNode | null;
  right: BinaryTreeNode | null;
  id: string;

  constructor(value: number, id: string) {
    this.value = value;
    this.left = null;
    this.right = null;
    this.id = id;
  }
}

export class BinarySearchTreeV2 {
  private root: BinaryTreeNode | null;
  private nodeIdCounter: number;

  constructor(initialData: number[] = []) {
    this.root = null;
    this.nodeIdCounter = 0;
    initialData.forEach(value => this.insert(value, true));
  }

  /**
   * Provides a deep clone of the current tree's root.
   * This is used for creating snapshots for keyframes.
   */
  private cloneTree(node: BinaryTreeNode | null): BinaryTreeNode | null {
    if (!node) return null;
    const newNode = new BinaryTreeNode(node.value, node.id);
    newNode.left = this.cloneTree(node.left);
    newNode.right = this.cloneTree(node.right);
    return newNode;
  }

  public getRoot(): BinaryTreeNode | null {
    return this.root;
  }

  private getNextId(): string {
    return `node-${this.nodeIdCounter++}`;
  }
  
  public search(value: number): AnimationEvent[] {
    const events: AnimationEvent[] = [
      { type: 'START_OPERATION', operation: 'search', value },
    ];
    let current = this.root;
    while (current) {
      events.push({ type: 'VISIT_NODE', nodeId: current.id, value: current.value });
      if (value === current.value) {
        events.push({ type: 'HIGHLIGHT_NODE', nodeId: current.id, reason: 'found' });
        events.push({ type: 'END_OPERATION', toast: { title: 'Found', description: `Node with value ${value} found.` } });
        return events;
      }
      current = value < current.value ? current.left : current.right;
    }
    events.push({ type: 'END_OPERATION', toast: { title: 'Not Found', description: `Node with value ${value} not found.`, variant: 'destructive' } });
    return events;
  }

  public insert(value: number, isInitialization: boolean = false): AnimationEvent[] {
    const events: AnimationEvent[] = isInitialization ? [] : [
      { type: 'START_OPERATION', operation: 'insert', value },
    ];

    if (!this.root) {
      const newNodeId = this.getNextId();
      this.root = new BinaryTreeNode(value, newNodeId);
      if (!isInitialization) {
        events.push({
          type: 'UPDATE_LAYOUT',
          tree: this.cloneTree(this.root)!,
          description: 'Initial layout with new root node.',
        });
        events.push({ type: 'END_OPERATION' });
      }
      return events;
    }

    let current = this.root;
    let parent: BinaryTreeNode | null = null;
    
    while (current) {
      if (!isInitialization) {
        events.push({ type: 'VISIT_NODE', nodeId: current.id, value: current.value });
      }
      if (value === current.value) {
        if (!isInitialization) {
          events.push({ type: 'END_OPERATION', toast: { title: 'Duplicate', description: `Node with value ${value} already exists.`, variant: 'destructive' } });
        }
        return events; // No duplicates allowed
      }
      parent = current;
      if (value < current.value) {
        current = current.left;
      } else {
        current = current.right;
      }
    }
    
    const newNodeId = this.getNextId();
    const newNode = new BinaryTreeNode(value, newNodeId);
    if (value < parent!.value) {
      parent!.left = newNode;
    } else {
      parent!.right = newNode;
    }
    
    if (!isInitialization) {
      events.push({
        type: 'UPDATE_LAYOUT',
        tree: this.cloneTree(this.root)!,
        description: 'Tree layout updated to accommodate new node.',
      });
      events.push({ type: 'END_OPERATION' });
    }
    
    return events;
  }
}

// NOTE: The 'delete' method is intentionally omitted for now.
// It is the most complex and will be implemented in a subsequent step
// to keep this change focused on establishing the V2 foundation.
