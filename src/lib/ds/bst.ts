
import type { VisualNode, VisualEdge } from '@/types/bst';

export class BstNode {
  value: number;
  left: BstNode | null;
  right: BstNode | null;
  id: string;

  constructor(value: number, id: string) {
    this.value = value;
    this.left = null;
    this.right = null;
    this.id = id;
  }
}

export interface DeleteResult {
    traversalPath: string[];
    foundNodeId: string | null;
    isTwoChildCase: boolean;
    successorId?: string;
    successorParentId?: string;
    successorRightChildId?: string;
}


export class BinarySearchTree {
  public readonly root: BstNode | null;
  private nodeIdCounter: number;
  
  // Public, immutable state describing operation results
  public readonly traversalPath: string[];
  public readonly foundNodeId: string | null;
  public readonly isTwoChildCase: boolean;
  public readonly successorId?: string;
  public readonly successorParentId?: string;
  public readonly successorRightChildId?: string;

  constructor(
    root: BstNode | null = null, 
    nodeIdCounter: number = 0,
    result: Partial<DeleteResult> & { traversalPath?: string[], foundNodeId?: string | null } = {},
  ) {
    this.root = root;
    this.nodeIdCounter = nodeIdCounter;
    this.traversalPath = result.traversalPath || [];
    this.foundNodeId = result.foundNodeId || null;
    this.isTwoChildCase = result.isTwoChildCase || false;
    this.successorId = result.successorId;
    this.successorParentId = result.successorParentId;
    this.successorRightChildId = result.successorRightChildId;
  }

  private getNextId(): string {
    return `node-${this.nodeIdCounter}`;
  }

  private clone(
    newRoot: BstNode | null, 
    newNodeIdCounter: number,
    result: Partial<DeleteResult> & { traversalPath?: string[], foundNodeId?: string | null } = {},
  ): BinarySearchTree {
    return new BinarySearchTree(newRoot, newNodeIdCounter, result);
  }

  private cloneNode(node: BstNode | null): BstNode | null {
    if (!node) return null;
    const newNode = new BstNode(node.value, node.id);
    newNode.left = this.cloneNode(node.left);
    newNode.right = this.cloneNode(node.right);
    return newNode;
  }

  insert(value: number): BinarySearchTree {
    const newRoot = this.cloneNode(this.root);
    const traversalPath: string[] = [];
    let newNodeIdCounter = this.nodeIdCounter;

    const _insert = (node: BstNode | null): BstNode => {
      if (!node) {
        const newNode = new BstNode(value, this.getNextId());
        newNodeIdCounter++;
        traversalPath.push(newNode.id);
        return newNode;
      }

      traversalPath.push(node.id);

      if (value < node.value) {
        node.left = _insert(node.left);
      } else if (value > node.value) {
        node.right = _insert(node.right);
      }
      return node;
    };
    
    const finalRoot = _insert(newRoot);
    return this.clone(finalRoot, newNodeIdCounter, { traversalPath });
  }

  search(value: number): BinarySearchTree {
    const traversalPath: string[] = [];
    let foundNodeId: string | null = null;
    let current = this.root;

    while (current) {
      traversalPath.push(current.id);
      if (value === current.value) {
        foundNodeId = current.id;
        break;
      }
      current = value < current.value ? current.left : current.right;
    }
    
    return this.clone(this.root, this.nodeIdCounter, { traversalPath, foundNodeId });
  }

  delete(value: number): BinarySearchTree {
    const result: DeleteResult = {
        traversalPath: [],
        foundNodeId: null,
        isTwoChildCase: false,
    };
    const newRoot = this.cloneNode(this.root);
    
    const _delete = (node: BstNode | null, val: number): BstNode | null => {
        if (!node) return null;
        
        result.traversalPath.push(node.id);
        
        if (val < node.value) {
            node.left = _delete(node.left, val);
        } else if (val > node.value) {
            node.right = _delete(node.right, val);
        } else {
            if (result.foundNodeId === null) {
              result.foundNodeId = node.id;
            }

            if (!node.left) return node.right;
            if (!node.right) return node.left;
            
            result.isTwoChildCase = true;
            let successorParent = node;
            let successor = node.right;
            result.traversalPath.push(successor.id);

            while(successor.left) {
                successorParent = successor;
                successor = successor.left;
                result.traversalPath.push(successor.id);
            }
            
            result.successorId = successor.id;
            result.successorParentId = successorParent.id;
            result.successorRightChildId = successor.right?.id;

            node.value = successor.value;
            node.id = successor.id; // Take on the ID of the successor to make layout animation easier

            // Now, delete the original successor node from the right subtree
            const deleteSuccessor = (subNode: BstNode | null, successorVal: number): BstNode | null => {
                if (!subNode) return null;
                if (successorVal < subNode.value) {
                    subNode.left = deleteSuccessor(subNode.left, successorVal);
                } else if (successorVal > subNode.value) {
                    subNode.right = deleteSuccessor(subNode.right, successorVal);
                } else {
                    return subNode.right;
                }
                return subNode;
            }
            node.right = deleteSuccessor(node.right, successor.value);
        }
        return node;
    };
    
    const finalRoot = _delete(newRoot, value);
    
    return this.clone(finalRoot, this.nodeIdCounter, result);
  }
}
