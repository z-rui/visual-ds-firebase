import { BinaryTreeNode } from "@/types/binary-tree";
import { GraphEventSink, VisualEdge, VisualNode } from "@/types/graph-scene";
import dagre from "dagre";
import assert from "assert";

// TODO: Geometry should be moved to a separate layout module.
const NODE_WIDTH = 60;
const NODE_HEIGHT = 60;
const HORIZONTAL_SPACING = 10;
const VERTICAL_SPACING = 10;

export class BinaryTree {
  private nodeIdCounter: number;
  public ui: GraphEventSink;
  protected root: BinaryTreeNode | null;

  constructor(ui: GraphEventSink) {
    this.nodeIdCounter = 0;
    this.ui = ui;
    this.root = null;
  }

  public getRoot(): BinaryTreeNode | null {
    return this.root;
  }

  public getLayout(): [VisualNode[], VisualEdge[]] {
    if (this.root == null) {
      return [[], []];
    }

    const g = new dagre.graphlib.Graph();
    g.setGraph({ rankdir: 'TB', nodesep: HORIZONTAL_SPACING, ranksep: VERTICAL_SPACING });
    g.setDefaultEdgeLabel(() => ({}));

    const finalNodes: VisualNode[] = [];
    const finalEdges: VisualEdge[] = [];
    let dummyIdCounter = 0;

    const traverseForLayout = (node: BinaryTreeNode | null) => {
      if (!node) {
        return;
      }

      finalNodes.push({ id: node.id, value: node.value, x: 0, y: 0 });
      g.setNode(node.id, { label: node.value.toString(), width: NODE_WIDTH, height: NODE_HEIGHT });

      if (node.left) {
        finalEdges.push({ id: `${node.id}-${node.left.id}`, from: node.id, to: node.left.id });
        g.setEdge(node.id, node.left.id);
        traverseForLayout(node.left);
      } else if (node.right) {
        const dummyId = `dummy-left-${dummyIdCounter++}`;
        g.setNode(dummyId, { width: 0, height: 0 });
        g.setEdge(node.id, dummyId, { style: 'visibility: hidden' });
      }

      if (node.right) {
        finalEdges.push({ id: `${node.id}-${node.right.id}`, from: node.id, to: node.right.id });
        g.setEdge(node.id, node.right.id);
        traverseForLayout(node.right);
      } else if (node.left) {
        const dummyId = `dummy-right-${dummyIdCounter++}`;
        g.setNode(dummyId, { width: 0, height: 0 });
        g.setEdge(node.id, dummyId, { style: 'visibility: hidden' });
      }
    };

    traverseForLayout(this.root);
    dagre.layout(g);

    finalNodes.forEach(node => {
      const dagreNode = g.node(node.id);
      node.x = dagreNode.x;
      node.y = dagreNode.y;
    });

    return [finalNodes, finalEdges];
  }

  protected updateLayout(unvisit: boolean = true): void {
    const [nodes, edges] = this.getLayout();
    this.ui.updateLayout(nodes, edges, unvisit);
  }

  protected newNode(value: number): BinaryTreeNode {
    const id = `node-${this.nodeIdCounter++}`;;
    return new BinaryTreeNode(id, value);
  }

  protected link(node: BinaryTreeNode, parent: BinaryTreeNode, dir: 'left' | 'right'): void {
    assert.strictEqual(node.parent, null);
    if (dir == 'left') {
      assert.strictEqual(parent.left, null);
      parent.left = node;
    } else {
      assert.strictEqual(parent.right, null);
      parent.right = node;
    }
    node.parent = parent;
  }

  protected unlink(node: BinaryTreeNode, parent: BinaryTreeNode): string {
    assert.strictEqual(node.parent, parent);
    if (parent.left == node) {
      parent.left = null;
    } else if (parent.right == node) {
      parent.right = null;
    } else {
      assert.fail("try to unlink nodes that aren't linked");
    }
    node.parent = null;
    return `${parent.id}-${node.id}`;
  }
}
