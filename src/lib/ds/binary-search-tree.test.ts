import { describe, it, expect, beforeEach } from 'vitest';
import { BinarySearchTree } from './binary-search-tree';
import type { GraphEventSink } from '@/types/graph-scene';

/**
 * A "noop" (no-operation) implementation of the GraphEventSink.
 * The data structure requires a sink for its constructor, but for these tests,
 * we don't care about the UI events, so we provide a dummy object that does nothing.
 */
const noopSink: GraphEventSink = {
  visit: () => {},
  unvisit: () => {},
  highlightNode: () => {},
  hideNode: () => {},
  hideEdge: () => {},
  updateLayout: () => {},
  toast: () => {},
};

describe('BinarySearchTree', () => {
  let tree: BinarySearchTree;

  // Re-create the tree before each test to ensure a clean state
  beforeEach(() => {
    tree = new BinarySearchTree(noopSink);
  });

  it('should insert a node into an empty tree', () => {
    tree.insert(50);
    const root = tree._getRootForTest();
    
    // Verify the structure of the tree
    expect(root).not.toBeNull();
    expect(root?.value).toBe(50);
    expect(root?.left).toBeNull();
    expect(root?.right).toBeNull();
  });

  it('should insert nodes correctly to form a simple tree', () => {
    tree.insert(50);
    tree.insert(25);
    tree.insert(75);
    tree.insert(10);

    const root = tree._getRootForTest();

    // Verify structure
    expect(root?.value).toBe(50);
    expect(root?.left?.value).toBe(25);
    expect(root?.right?.value).toBe(75);
    expect(root?.left?.left?.value).toBe(10);
    expect(root?.left?.right).toBeNull();
  });

  it('should not insert a duplicate value and tree structure should remain unchanged', () => {
    tree.insert(50);
    tree.insert(25);
    tree.insert(75);

    // Get a snapshot of the root before the duplicate insertion
    const rootBefore = tree._getRootForTest();
    
    // Attempt to insert duplicate
    tree.insert(50);

    // Get a snapshot of the root after
    const rootAfter = tree._getRootForTest();

    // The root should be the same object, and the structure should be identical
    expect(rootAfter).toBe(rootBefore);
    expect(rootAfter?.value).toBe(50);
    expect(rootAfter?.left?.value).toBe(25);
    expect(rootAfter?.right?.value).toBe(75);
  });
});
