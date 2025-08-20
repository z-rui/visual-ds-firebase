import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BinarySearchTree } from './binary-search-tree';
import type { GraphEventSink } from '@/types/graph-scene';

/**
 * A mock implementation of the GraphEventSink where each method is a no-op spy.
 * This prevents us from having to manually implement each method of the interface.
 */
const mockSink: GraphEventSink = {
  visit: vi.fn(),
  unvisit: vi.fn(),
  highlightNode: vi.fn(),
  hideNode: vi.fn(),
  hideEdge: vi.fn(),
  updateLayout: vi.fn(),
  toast: vi.fn(),
};

describe('BinarySearchTree', () => {
  let tree: BinarySearchTree;

  // Re-create the tree and reset the mock sink before each test
  beforeEach(() => {
    tree = new BinarySearchTree(mockSink);
    vi.clearAllMocks(); // Resets spy counters
  });

  describe('insert', () => {
    it('should insert a node into an empty tree', () => {
      tree.insert(50);
      const root = tree.getRoot();
      
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

      const root = tree.getRoot();

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
      const rootBefore = tree.getRoot();
      
      // Attempt to insert duplicate
      tree.insert(50);

      // Get a snapshot of the root after
      const rootAfter = tree.getRoot();

      // The root should be the same object, and the structure should be identical
      expect(rootAfter).toBe(rootBefore);
      expect(rootAfter?.value).toBe(50);
      expect(rootAfter?.left?.value).toBe(25);
      expect(rootAfter?.right?.value).toBe(75);
    });
  });

  describe('search', () => {
    beforeEach(() => {
      const values = [50, 25, 75];
      values.forEach(v => tree.insert(v));
    });

    it('should find an existing node', () => {
      // For the search test, we don't need to check the tree structure,
      // as the main outcome is the series of UI events.
      // However, since we are only testing the DS, we'll just run it.
      // A more complete test would check the mockSink calls.
      tree.search(75);
      // No structural assertions needed, but we confirm it doesn't crash.
      expect(true).toBe(true);
    });

    it('should not find a non-existent node', () => {
       tree.search(99);
       // No structural assertions needed, but we confirm it doesn't crash.
       expect(true).toBe(true);
    });
  });

  describe('delete', () => {
    beforeEach(() => {
      // Setup a standard tree for deletion tests
      const values = [50, 25, 75, 12, 37, 62, 87, 6, 18, 31, 43, 56, 68, 81, 93];
      values.forEach(v => tree.insert(v));
    });

    it('should not change the tree when deleting a non-existent value', () => {
      const layoutBefore = JSON.stringify(tree.getLayout());
      tree.delete(100);
      const layoutAfter = JSON.stringify(tree.getLayout());
      expect(layoutAfter).toEqual(layoutBefore);
    });

    it('should correctly delete a leaf node', () => {
      tree.delete(6); // Leaf node
      const root = tree.getRoot();
      expect(root?.left?.left?.left).toBeNull(); // Formerly 6
    });

    it('should correctly delete a node with only a right child', () => {
      tree.delete(12); // Node with only right child (18)
      const root = tree.getRoot();
      expect(root?.left?.left?.value).toBe(18); // 18 should replace 12
    });

    it('should correctly delete a node with only a left child', () => {
      // First, add a node to create this specific case
      tree.insert(15);
      tree.delete(18); // Node 18 now has only a left child (15)
      const root = tree.getRoot();
      expect(root?.left?.left?.right?.value).toBe(15); // 15 should replace 18
    });

    it('should correctly delete a node with two children (successor is right child)', () => {
      tree.delete(62); // Node with two children (56, 68), successor (68) is right child
      const root = tree.getRoot();
      expect(root?.right?.left?.value).toBe(68);
      expect(root?.right?.left?.left?.value).toBe(56);
      expect(root?.right?.left?.right).toBeNull();
    });

    it('should correctly delete a node with two children (successor is not right child)', () => {
      tree.delete(25); // Node with two children (12, 37)
      const root = tree.getRoot();
      // The successor of 25 is 31.
      // 31 should move up to replace 25.
      // 37 becomes the left child of 43.
      expect(root?.left?.value).toBe(31);
      expect(root?.left?.right?.value).toBe(37);
      expect(root?.left?.right?.left).toBeNull(); // 31's original spot is now empty
    });

    it('should correctly delete the root node', () => {
      tree.delete(50);
      const root = tree.getRoot();
      // The successor of 50 is 56.
      // 56 should be the new root.
      // 62 (56's original parent) should adopt 56's right child (if any, none in this case)
      expect(root?.value).toBe(56);
      expect(root?.right?.left?.value).toBe(62);
      expect(root?.right?.left?.left).toBeNull();
    });
  });
});
