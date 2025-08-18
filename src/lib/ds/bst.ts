
import type { AnimationProducer } from '@/types/animation-producer';

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

export class BinarySearchTree {
  private root: BinaryTreeNode | null;
  private nodeIdCounter: number;

  constructor(initialData: number[] = []) {
    this.root = null;
    this.nodeIdCounter = 0;
    initialData.forEach(value => {
        // Initial build doesn't need animation
        this.insert(value, null);
    });
  }

  public getRoot(): BinaryTreeNode | null {
    return this.root;
  }

  private getNextId(): string {
    return `node-${this.nodeIdCounter++}`;
  }
  
  public search(value: number, producer: AnimationProducer | null): void {
    let current = this.root;
    while (current) {
      producer?.visitNode(current.id, current.value);
      if (value === current.value) {
        producer?.highlightNode(current.id, 'found');
        producer?.endOperation({ title: 'Found', description: `Node with value ${value} found.` });
        return;
      }
      current = value < current.value ? current.left : current.right;
    }
    producer?.endOperation({ title: 'Not Found', description: `Node with value ${value} not found.`, variant: 'destructive' });
  }

  public insert(value: number, producer: AnimationProducer | null): void {
    // Check for duplicates first
    let check = this.root;
    while(check) {
      if (value === check.value) {
        producer?.visitNode(check.id, check.value);
        producer?.endOperation({ title: 'Duplicate', description: `Node with value ${value} already exists.`, variant: 'destructive' });
        return;
      }
      check = value < check.value ? check.left : check.right;
    }

    if (!this.root) {
      const newNodeId = this.getNextId();
      this.root = new BinaryTreeNode(value, newNodeId);
      producer?.updateLayout(this.root);
      producer?.endOperation();
      return;
    }

    let current = this.root;
    
    while (current) {
      producer?.visitNode(current.id, current.value);
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
    
    producer?.updateLayout(this.root);
    producer?.endOperation();
  }

  public delete(value: number, producer: AnimationProducer | null): void {
    let nodeFound = false;
    
    const deleteRec = (node: BinaryTreeNode | null, val: number, parent: BinaryTreeNode | null): BinaryTreeNode | null => {
        if (!node) {
            if (!nodeFound) {
                producer?.endOperation({ title: 'Not Found', description: `Node with value ${val} not found.`, variant: 'destructive' });
            }
            return null;
        }
        
        producer?.visitNode(node.id, node.value);

        if (val < node.value) {
            node.left = deleteRec(node.left, val, node);
        } else if (val > node.value) {
            node.right = deleteRec(node.right, val, node);
        } else {
            nodeFound = true;
            producer?.highlightNode(node.id, 'deletion');

            // Case 1 & 2: Leaf node or one child
            if (!node.left || !node.right) {
                const child = node.left || node.right;
                const edgesToHide: string[] = [];
                if (parent) edgesToHide.push(`${parent.id}-${node.id}`);
                if (child) edgesToHide.push(`${node.id}-${child.id}`);
                
                if (edgesToHide.length > 0) {
                    producer?.hideEdge(edgesToHide);
                }
                producer?.hideNode(node.id);
                return child;
            }
            
            // Case 3: Two children
            let successorParent = node;
            let successor = node.right;
            producer?.visitNode(successor.id, successor.value);

            while (successor.left) {
                successorParent = successor;
                successor = successor.left;
                producer?.visitNode(successor.id, successor.value);
            }
            producer?.highlightNode(successor.id, 'successor');
            
            const successorEdgesToHide = [`${successorParent.id}-${successor.id}`];
            if (successor.right) {
                successorEdgesToHide.push(`${successor.id}-${successor.right.id}`);
            }
            producer?.hideEdge(successorEdgesToHide);

            const targetEdgesToHide: string[] = [];
            if (parent) {
                targetEdgesToHide.push(`${parent.id}-${node.id}`);
            }
            targetEdgesToHide.push(`${node.id}-${node.left!.id}`);
            targetEdgesToHide.push(`${node.id}-${node.right!.id}`);
            producer?.hideEdge(targetEdgesToHide);
            
            producer?.hideNode(node.id);
            
            if (successorParent === node) {
                successorParent.right = successor.right;
            } else {
                successorParent.left = successor.right;
            }
            
            successor.left = node.left;
            successor.right = node.right;
            
            return successor;
        }
        return node;
    };

    this.root = deleteRec(this.root, value, null);
    
    if (nodeFound) {
        producer?.updateLayout(this.root);
        producer?.endOperation();
    }
  }
}
