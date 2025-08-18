
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
  | { type: 'VISIT_NODE'; nodeId: string; value: number }
  | { type: 'HIGHLIGHT_NODE'; nodeId: string; reason: 'found' | 'successor' | 'deletion' }
  | { type: 'HIDE_NODE'; nodeId: string }
  | { type: 'HIDE_EDGE'; edgeIds: string[] }
  | { type: 'UPDATE_LAYOUT'; tree: BinaryTreeNode; description: string }
  | { type: 'END_OPERATION'; toast?: { title: string; description: string; variant?: 'destructive' } };
