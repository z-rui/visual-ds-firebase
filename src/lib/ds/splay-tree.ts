
'use client';

import type { BinaryTreeNode } from "@/types/binary-tree";
import { BinarySearchTree } from "./binary-search-tree";

export class SplayTree extends BinarySearchTree {
  
  private splay(node: BinaryTreeNode | null): void {
    if (node === null) {
      return;
    }
    
    while (node.parent !== null) {
      if (node.parent.parent === null) {
        if (node.parent.left === node) {
          // Zig
          this.rightRotate(node.parent);
        } else {
          // Zag
          this.leftRotate(node.parent);
        }
      } else if (node.parent.left === node && node.parent.parent.left === node.parent) {
        // Zig-Zig
        this.rightRotate(node.parent.parent);
        this.rightRotate(node.parent);
      } else if (node.parent.right === node && node.parent.parent.right === node.parent) {
        // Zag-Zag
        this.leftRotate(node.parent.parent);
        this.leftRotate(node.parent);
      } else if (node.parent.left === node && node.parent.parent.right === node.parent) {
        // Zig-Zag
        this.rightRotate(node.parent);
        this.leftRotate(node.parent);
      } else {
        // Zag-Zig
        this.leftRotate(node.parent);
        this.rightRotate(node.parent);
      }
      this.updateLayout();
    }
  }

  public search(value: number): void {
    const node = this.findNode(value);
    if (node) {
      this.splay(node);
      this.ui.highlightNode(node.id, 'found');
      this.ui.toast({ title: 'Found', description: `Node with value ${value} found.` });
    } else {
      this.ui.unvisit();
      this.ui.toast({ title: 'Not Found', description: `Node with value ${value} not found.`, variant: 'destructive' });
    }
  }
  
  public insert(value: number): void {
    if (this.root == null) {
      this.root = this.newNode(value);
      this.updateLayout();
      return;
    }
  
    let current = this.root;
    let parent: BinaryTreeNode | null = null;
    while (current) {
      parent = current;
      this.ui.visit(current.id, current.value);
      if (value < current.value) {
        current = current.left;
      } else if (value > current.value) {
        current = current.right;
      } else {
        this.ui.toast({ title: 'Duplicate', description: `Node with value ${value} already exists.`, variant: 'destructive' });
        this.splay(current);
        return;
      }
    }
  
    const newNode = this.newNode(value);
    if (value < parent!.value) {
      this.link(newNode, parent!, 'left');
    } else {
      this.link(newNode, parent!, 'right');
    }

    // This is the fix: Update the layout to show the node as a leaf first.
    this.updateLayout();
    
    // Then, splay the new node to the root.
    this.splay(newNode);
  }

  public delete(value: number): void {
    let nodeToDelete = this.findNode(value);

    if (!nodeToDelete) {
      this.ui.unvisit();
      this.ui.toast({ title: 'Not Found', description: `Node with value ${value} not found.`, variant: 'destructive' });
      return;
    }
    
    // Splay the node to be deleted (or its parent if it doesn't exist)
    this.splay(nodeToDelete);

    // After splaying, the node to delete is the root
    nodeToDelete = this.root;
    if (!nodeToDelete || nodeToDelete.value !== value) {
        // Should not happen if findNode and splay work correctly
        return;
    }

    this.ui.highlightNode(nodeToDelete.id, 'deletion');

    const leftSubtree = nodeToDelete.left;
    const rightSubtree = nodeToDelete.right;

    if (!leftSubtree) {
        this.root = rightSubtree;
        if (rightSubtree) {
            rightSubtree.parent = null;
        }
    } else {
        leftSubtree.parent = null;
        // Find the max in the left subtree
        let maxLeft = leftSubtree;
        while (maxLeft.right) {
            maxLeft = maxLeft.right;
        }
        // Splay the max in the left subtree, which makes it the root of the left subtree
        this.splay(maxLeft);
        
        // The new root is the splayed maxLeft, which is now the root of the left subtree
        this.root = leftSubtree;
        this.root.right = rightSubtree;
        if (rightSubtree) {
            rightSubtree.parent = this.root;
        }
    }
    
    this.updateLayout();
  }
}
