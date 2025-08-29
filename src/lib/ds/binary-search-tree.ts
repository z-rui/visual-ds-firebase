
import { BinaryTreeNode } from "@/types/binary-tree";
import { BinaryTree } from "./binary-tree";
import assert from "assert";

export class BinarySearchTree extends BinaryTree {

  protected findNode(value: number): BinaryTreeNode | null {
    let current = this.root;
    while (current) {
      this.ui.visit(current.id, current.value);
      if (value === current.value) {
        return current;
      }
      current = value < current.value ? current.left : current.right;
    }
    return current;
  }

  public search(value: number): void {
    const node = this.findNode(value);
    if (node) {
      this.ui.highlightNode(node.id, 'found');
      this.ui.toast({ title: 'Found', description: `Node with value ${value} found.` });
    } else {
      this.ui.unvisit();
      this.ui.toast({ title: 'Not Found', description: `Node with value ${value} not found.`, variant: 'destructive' });
    }
  }

  public insert(value: number): BinaryTreeNode | null {
    if (this.root == null) {
      this.root = this.newNode(value);
      this.updateLayout();
      return this.root;
    } else {
      let current = this.root;
      let parent: BinaryTreeNode | null = null;
      while (current) {
        this.ui.visit(current.id, current.value);
        if (value < current.value) {
          if (!current.left) {
            const newNode = this.newNode(value);
            this.link(newNode, current, 'left');
            this.updateLayout();
            return newNode;
          }
          current = current.left;
        } else if (value > current.value) {
          if (!current.right) {
            const newNode = this.newNode(value);
            this.link(newNode, current, 'right');
            this.updateLayout();
            return newNode;
          }
          current = current.right;
        } else {
          this.ui.toast({ title: 'Duplicate', description: `Node with value ${value} already exists.`, variant: 'destructive' });
          this.updateLayout();
          return current;
        }
      }
    }
    return null; // Should be unreachable
  }

  protected deleteAndGetRebalanceStart(value: number): BinaryTreeNode | null {
    const current = this.findNode(value);

    if (current == null) {
      this.ui.unvisit();
      this.ui.toast({ title: 'Not Found', description: `Node with value ${value} not found.`, variant: 'destructive' });
      return null;
    }

    this.ui.highlightNode(current.id, 'deletion');

    const parent = current.parent;
    let dir: 'left' | 'right' | undefined;

    if (parent != null) {
      if (parent.left == current) {
        dir = 'left';
      } else {
        dir = 'right';
      }
      this.unlink(current, parent);
    }
    const left = current.left;
    const right = current.right;
    if (left == null) {
      if (right != null) {
        this.unlink(right, current);
        if (parent && dir) {
          this.link(right, parent, dir);
        } else {
          this.root = right;
        }
      } else {
        if (parent == null) {
          this.root = null;
        }
      }
      return parent;
    } else if (right == null) {
      this.unlink(left, current);
      if (parent && dir) {
        this.link(left, parent, dir);
      } else {
        this.root = left;
      }
      return parent;
    } else {
      let successor = right;
      let sParent = current;
      this.ui.visit(successor.id, successor.value);
      while (successor.left != null) {
        sParent = successor;
        successor = successor.left;
        this.ui.visit(successor.id, successor.value);
      }
      this.ui.highlightNode(successor.id, 'successor');
      this.unlink(left, current);
      this.unlink(right, current);
      let rebalanceStart: BinaryTreeNode;
      if (sParent != current) {
        this.unlink(successor, sParent);
        const sRight = successor.right;
        if (sRight != null) {
          this.unlink(sRight, successor);
          this.link(sRight, sParent, 'left');
        }
        rebalanceStart = sParent;
        this.link(right, successor, 'right');
      } else {
        rebalanceStart = successor;
      }
      this.link(left, successor, 'left');
      if (parent && dir) {
        this.link(successor, parent, dir);
      } else {
        this.root = successor;
      }
      return rebalanceStart;
    }
  }

  public delete(value: number): void {
    this.deleteAndGetRebalanceStart(value);
    this.updateLayout();
  }
}
