import { BinaryTreeNode } from "@/types/binary-tree";
import { BinaryTree } from "./binary-tree";

export class BinarySearchTree extends BinaryTree {

  protected findNode(value: number): { node: BinaryTreeNode | null, parent: BinaryTreeNode | null } {
    let parent: BinaryTreeNode | null = null;
    let current = this.root;
    while (current) {
      this.ui.visit(current.id, current.value);
      if (value === current.value) {
        return { node: current, parent };
      }
      parent = current;
      current = value < current.value ? current.left : current.right;
    }
    return { node: null, parent: parent };
  }

  public search(value: number): void {
    const { node } = this.findNode(value);
    if (node) {
      this.ui.highlightNode(node.id, 'found');
      this.ui.toast({ title: 'Found', description: `Node with value ${value} found.` });
    } else {
      this.ui.toast({ title: 'Not Found', description: `Node with value ${value} not found.`, variant: 'destructive' });
    }
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
    const { node: current, parent } = this.findNode(value);
    
    if (current == null) {
      this.ui.unvisit();
      this.ui.toast({ title: 'Not Found', description: `Node with value ${value} not found.`, variant: 'destructive' });
      return;
    }

    this.ui.highlightNode(current.id, 'deletion');
    
    const edgesToHide: string[] = [];
    let dir: 'left' | 'right' | undefined;
    
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
