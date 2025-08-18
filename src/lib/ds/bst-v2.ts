
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
    initialData.forEach(value => this.insert(value));
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
    const events: AnimationEvent[] = [];
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

  public insert(value: number): AnimationEvent[] {
    const events: AnimationEvent[] = [];

    // Check for duplicates first
    let check = this.root;
    while(check) {
      if (value === check.value) {
        events.push({ type: 'VISIT_NODE', nodeId: check.id, value: check.value });
        events.push({ type: 'END_OPERATION', toast: { title: 'Duplicate', description: `Node with value ${value} already exists.`, variant: 'destructive' } });
        return events;
      }
      check = value < check.value ? check.left : check.right;
    }

    if (!this.root) {
      const newNodeId = this.getNextId();
      this.root = new BinaryTreeNode(value, newNodeId);
      events.push({
        type: 'UPDATE_LAYOUT',
        tree: this.cloneTree(this.root)!,
        description: 'Initial layout with new root node.',
      });
      events.push({ type: 'END_OPERATION' });
      return events;
    }

    let current = this.root;
    
    while (current) {
      events.push({ type: 'VISIT_NODE', nodeId: current.id, value: current.value });
      if (value < current.value) {
        if (!current.left) {
            current.left = new BinaryTreeNode(value, this.getNextId());
            break;
        }
        current = current.left;
      } else {
        if (!current.right) {
            current.right = new BinaryTreeNode(value, this.getNextId());
            break;
        }
        current = current.right;
      }
    }
    
    events.push({
      type: 'UPDATE_LAYOUT',
      tree: this.cloneTree(this.root)!,
      description: 'Tree layout updated to accommodate new node.',
    });
    events.push({ type: 'END_OPERATION' });
    
    return events;
  }

  public delete(value: number): AnimationEvent[] {
    const events: AnimationEvent[] = [];
    
    const deleteRec = (node: BinaryTreeNode | null, val: number, parent: BinaryTreeNode | null): BinaryTreeNode | null => {
        if (!node) {
            events.push({ type: 'END_OPERATION', toast: { title: 'Not Found', description: `Node with value ${val} not found.`, variant: 'destructive' } });
            return null;
        }
        
        events.push({ type: 'VISIT_NODE', nodeId: node.id, value: node.value });

        if (val < node.value) {
            node.left = deleteRec(node.left, val, node);
        } else if (val > node.value) {
            node.right = deleteRec(node.right, val, node);
        } else {
            // This is the node to be deleted
            if (events.every(e => e.type !== 'HIGHLIGHT_NODE')) {
                events.push({ type: 'HIGHLIGHT_NODE', nodeId: node.id, reason: 'deletion' });
            }

            // Case 1 & 2: Leaf node or one child
            if (!node.left || !node.right) {
                const child = node.left || node.right;
                const edgesToHide: string[] = [];
                if (parent) edgesToHide.push(`${parent.id}-${node.id}`);
                if (child) edgesToHide.push(`${node.id}-${child.id}`);
                
                if (edgesToHide.length > 0) {
                    events.push({ type: 'HIDE_EDGE', edgeIds: edgesToHide });
                }
                events.push({ type: 'HIDE_NODE', nodeId: node.id });
                return child;
            }
            
            // Case 3: Two children
            let successorParent = node;
            let successor = node.right;
            events.push({ type: 'VISIT_NODE', nodeId: successor.id, value: successor.value });

            while (successor.left) {
                successorParent = successor;
                successor = successor.left;
                events.push({ type: 'VISIT_NODE', nodeId: successor.id, value: successor.value });
            }
            events.push({ type: 'HIGHLIGHT_NODE', nodeId: successor.id, reason: 'successor' });

            // Unlink successor from its original position
            const successorEdgesToHide = [`${successorParent.id}-${successor.id}`];
            if (successor.right) {
                successorEdgesToHide.push(`${successor.id}-${successor.right.id}`);
            }
            events.push({ type: 'HIDE_EDGE', edgeIds: successorEdgesToHide });

            // Unlink target node from parent and children
            const targetEdgesToHide: string[] = [];
            if (parent) {
                targetEdgesToHide.push(`${parent.id}-${node.id}`);
            }
            targetEdgesToHide.push(`${node.id}-${node.left!.id}`);
            targetEdgesToHide.push(`${node.id}-${node.right!.id}`);
            events.push({ type: 'HIDE_EDGE', edgeIds: targetEdgesToHide });
            
            events.push({ type: 'HIDE_NODE', nodeId: node.id });
            
            // Delete the successor from its original position
            if (successorParent === node) {
                successorParent.right = successor.right;
            } else {
                successorParent.left = successor.right;
            }
            
            // Replace the target node with the successor
            successor.left = node.left;
            successor.right = node.right;
            
            return successor;
        }
        return node;
    };

    const newRoot = deleteRec(this.root, value, null);

    // Only update layout if a node was actually found and deleted
    if (!events.some(e => e.type === 'END_OPERATION' && e.toast?.title === 'Not Found')) {
        this.root = newRoot;
        if (this.root) {
            events.push({
                type: 'UPDATE_LAYOUT',
                tree: this.cloneTree(this.root)!,
                description: 'Tree layout updated after deletion.'
            });
        }
        events.push({ type: 'END_OPERATION' });
    }

    return events;
  }
}
