
import type { BinaryTreeNode } from "@/lib/ds/bst-v2";

/**
 * A semantic, atomic description of a single action that occurred
 * during a data structure operation. These events are the source of
 * truth for generating animations.
 *
 * It can also include a special 'UPDATE_LAYOUT' event, which acts as a
 * Keyframe marker. It instructs the Snapshot Generator to re-calculate
 * the entire visual layout based on the provided tree snapshot.
 */
export type AnimationEvent =
  | { type: 'START_OPERATION'; operation: 'insert' | 'delete' | 'search'; value: number }
  | { type: 'VISIT_NODE'; nodeId: string; value: number }
  | { type: 'REMOVE_NODE'; nodeId: string }
  | { type: 'REMOVE_EDGE'; from: string; to: string }
  | { type: 'HIGHLIGHT_NODE'; nodeId: string; reason: 'found' | 'successor' | 'deletion' }
  | { type: 'UPDATE_LAYOUT'; tree: BinaryTreeNode; description: string }
  | { type: 'END_OPERATION'; toast?: { title: string; description: string; variant?: 'destructive' } };
