
import type { BinaryTreeNode } from "@/lib/ds/bst";
import type { AnimationStep, ToastMessage } from "./bst";

/**
 * Defines the interface for an animation producer.
 * Data structure algorithms will call these methods to describe their
 * operations, and the implementing class will be responsible for
 * generating the visual animation steps.
 */
export interface AnimationProducer {
  visitNode(nodeId: string, value: number): void;
  highlightNode(nodeId: string, reason: 'found' | 'successor' | 'deletion'): void;
  hideNode(nodeId: string): void;
  hideEdge(edgeIds: string[]): void;
  updateLayout(tree: BinaryTreeNode | null): void;
  endOperation(toast?: ToastMessage): void;
  getSteps(): AnimationStep[];
}
