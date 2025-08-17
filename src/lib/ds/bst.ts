import type { AnimationStep } from '@/types/bst';

let nodeIdCounter = 0;

class TreeNode {
  value: number;
  left: TreeNode | null;
  right: TreeNode | null;
  id: string;

  constructor(value: number) {
    this.value = value;
    this.left = null;
    this.right = null;
    this.id = `node-${nodeIdCounter++}`;
  }
}

export class BinarySearchTree {
  root: TreeNode | null;

  constructor() {
    this.root = null;
  }

  insert(value: number, log: (step: AnimationStep) => void) {
    const newNode = new TreeNode(value);
    if (!this.root) {
      this.root = newNode;
      log({ type: 'insert', parentId: null, nodeId: newNode.id, value: newNode.value, direction: 'root' });
      return;
    }

    let current = this.root;
    while (true) {
      log({ type: 'visit', nodeId: current.id });
      log({ type: 'compare', nodeId: current.id, value });

      if (value === current.value) {
        log({ type: 'error', message: `Value ${value} already exists.` });
        return;
      }

      if (value < current.value) {
        if (!current.left) {
          current.left = newNode;
          log({ type: 'insert', parentId: current.id, nodeId: newNode.id, value: newNode.value, direction: 'left' });
          return;
        }
        current = current.left;
      } else {
        if (!current.right) {
          current.right = newNode;
          log({ type: 'insert', parentId: current.id, nodeId: newNode.id, value: newNode.value, direction: 'right' });
          return;
        }
        current = current.right;
      }
    }
  }

  search(value: number, log: (step: AnimationStep) => void) {
    let current = this.root;
    while (current) {
      log({ type: 'visit', nodeId: current.id });
      log({ type: 'compare', nodeId: current.id, value });
      if (value === current.value) {
        log({ type: 'search-found', nodeId: current.id });
        return;
      }
      if (value < current.value) {
        current = current.left;
      } else {
        current = current.right;
      }
    }
    log({ type: 'search-not-found', message: `Value ${value} not found.` });
  }

  delete(value: number, log: (step: AnimationStep) => void) {
    this.root = this._deleteNode(this.root, value, log);
  }

  private _deleteNode(node: TreeNode | null, value: number, log: (step: AnimationStep) => void): TreeNode | null {
    if (!node) {
      log({ type: 'search-not-found', message: `Value ${value} not found.` });
      return null;
    }

    log({ type: 'visit', nodeId: node.id });
    log({ type: 'compare', nodeId: node.id, value });

    if (value < node.value) {
      node.left = this._deleteNode(node.left, value, log);
      return node;
    }
    
    if (value > node.value) {
      node.right = this._deleteNode(node.right, value, log);
      return node;
    }

    // Value is found
    log({ type: 'delete', nodeId: node.id });

    // Node with only one child or no child
    if (!node.left) return node.right;
    if (!node.right) return node.left;

    // Node with two children: Get the inorder successor (smallest in the right subtree)
    let successor = node.right;
    while (successor.left) {
      log({ type: 'visit', nodeId: successor.id });
      successor = successor.left;
    }
    log({ type: 'visit', nodeId: successor.id });
    
    const oldNodeId = node.id;
    node.value = successor.value;
    node.id = successor.id; // The node "becomes" the successor visually
    
    log({ type: 'replace', oldNodeId: oldNodeId, newNodeId: successor.id, value: successor.value });
    
    // Delete the inorder successor
    node.right = this._deleteNode(node.right, successor.value, log);
    
    return node;
  }

  inOrderTraversal(log: (step: AnimationStep) => void) {
    const traverse = (node: TreeNode | null) => {
      if (node) {
        traverse(node.left);
        log({ type: 'visit', nodeId: node.id });
        traverse(node.right);
      }
    };
    traverse(this.root);
    log({ type: 'traversal-end' });
  }

  preOrderTraversal(log: (step: AnimationStep) => void) {
    const traverse = (node: TreeNode | null) => {
      if (node) {
        log({ type: 'visit', nodeId: node.id });
        traverse(node.left);
        traverse(node.right);
      }
    };
    traverse(this.root);
    log({ type: 'traversal-end' });
  }

  postOrderTraversal(log: (step: AnimationStep) => void) {
    const traverse = (node: TreeNode | null) => {
      if (node) {
        traverse(node.left);
        traverse(node.right);
        log({ type: 'visit', nodeId: node.id });
      }
    };
    traverse(this.root);
    log({ type: 'traversal-end' });
  }
}
