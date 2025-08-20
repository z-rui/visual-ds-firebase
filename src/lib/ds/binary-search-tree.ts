import { BinaryTreeNode } from "@/types/binary-tree";
import { BinaryTree } from "./binary-tree";

export class BinarySearchTree extends BinaryTree {
  public getRoot(): BinaryTreeNode | null {
    return this.root;
  }

  public search(value: number): void {
    let current = this.root;
    while (current) {
      this.ui.visit(current.id, current.value);
      if (value === current.value) {
        this.ui.highlightNode(current.id, 'found');
        this.ui.toast({ title: 'Found', description: `Node with value ${value} found.` });
        return;
      }
      current = value < current.value ? current.left : current.right;
    }
    this.ui.toast({ title: 'Not Found', description: `Node with value ${value} not found.`, variant: 'destructive' });
  }

  public insert(value: number): void {
    if (this.root == null) {
      this.root = this.newNode(value);
    } else {
      let current = this.root;
      while (current) {
        this.ui.visit(current.id, current.value);
        if (value < current.value) {
          if (!current.left) {
            this.link(this.newNode(value), current, 'left');
            break;
          }
          current = current.left;
        } else if (value > current.value) {
          if (!current.right) {
            this.link(this.newNode(value), current, 'right');
            break;
          }
          current = current.right;
        } else {
          this.ui.toast({ title: 'Duplicate', description: `Node with value ${value} already exists.`, variant: 'destructive' });
          break;
        }
      }
    }
    this.updateLayout();
  }

  public delete(value: number): void {
    let parent = null;
    let dir: 'left' | 'right' | undefined;
    let current = this.root;
    while (current) {
      this.ui.visit(current.id, current.value);
      if (value === current.value) {
        this.ui.highlightNode(current.id, 'deletion');
        break;
      }
      parent = current;
      current = value < current.value ? current.left : current.right;
    }
    if (current == null) {
      this.ui.unvisit();
      this.ui.toast({ title: 'Not Found', description: `Node with value ${value} not found.`, variant: 'destructive' });
      return;
    }
    const edgesToHide: string[] = [];
    if (parent != null) {
      if (parent.left == current) {
        dir = 'left';
      } else {
        dir = 'right';
      }
      edgesToHide.push(this.unlink(current, parent));
    }
    const left = current.left;
    const right = current.right;
    if (left == null) {
      if (right != null) {
        edgesToHide.push(this.unlink(right, current));
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
    } else if (right == null) {
      edgesToHide.push(this.unlink(left, current));
      if (parent && dir) {
        this.link(left, parent, dir);
      } else {
        this.root = left;
      }
    } else {
      let successor = right;
      let sParent = current;
      this.ui.visit(successor.id, successor.value);
      while (successor.left != null) {
        sParent = successor;
        successor = successor.left;
        this.ui.visit(successor.id, successor.value);
      }
      edgesToHide.push(this.unlink(left, current));
      edgesToHide.push(this.unlink(right, current));
      if (sParent != current) {
        edgesToHide.push(this.unlink(successor, sParent));
        const sRight = successor.right;
        if (sRight != null) {
          edgesToHide.push(this.unlink(sRight, successor));
          this.link(sRight, sParent, 'left');
        }
        this.link(right, successor, 'right');
      }
      this.link(left, successor, 'left');
      if (parent && dir) {
        this.link(successor, parent, dir);
      } else {
        this.root = successor;
      }
    }
    this.ui.hideEdge(edgesToHide);
    this.updateLayout();
  }
}
