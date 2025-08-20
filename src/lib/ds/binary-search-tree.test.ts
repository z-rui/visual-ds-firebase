
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BinarySearchTree } from './binary-search-tree';
import type { GraphEventSink } from '@/types/graph-scene';
import type { BinaryTreeNode } from '@/types/binary-tree';

// This is the clean, type-safe way to test a protected method.
// We create a subclass specifically for the test environment
// that exposes the protected method as a public one.
class TestableBinarySearchTree extends BinarySearchTree {
  public findNode(value: number): { node: BinaryTreeNode | null, parent: BinaryTreeNode | null } {
    return super.findNode(value);
  }
}

// A "spy" mock that creates no-op functions for each method
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
  let tree: TestableBinarySearchTree;

  // Re-create the tree before each test
  beforeEach(() => {
    tree = new TestableBinarySearchTree(mockSink);
    // Clear mock history before each test
    vi.clearAllMocks();
  });

  describe('findNode', () => {
    beforeEach(() => {
      const values = [50, 25, 75, 12, 37];
      values.forEach(v => tree.insert(v));
    });

    it('should find an existing node and its parent', () => {
      const { node, parent } = tree.findNode(37);
      expect(node).not.toBeNull();
      expect(node?.value).toBe(37);
      expect(parent).not.toBeNull();
      expect(parent?.value).toBe(25);
    });

    it('should find the root node', () => {
        const { node, parent } = tree.findNode(50);
        expect(node).not.toBeNull();
        expect(node?.value).toBe(50);
        expect(parent).toBeNull();
    });

    it('should return null when node is not found', () => {
        const { node } = tree.findNode(100);
        expect(node).toBeNull();
    });
  });

  describe('insert', () => {
    it('should insert a node into an empty tree', () => {
      tree.insert(50);
      const root = tree.getRoot();
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
      const layoutBefore = JSON.stringify(tree.getLayout());
      tree.insert(50);
      const layoutAfter = JSON.stringify(tree.getLayout());
      expect(layoutAfter).toEqual(layoutBefore);
    });
  });

  describe('search', () => {
    it('should run without errors for existing and non-existing values', () => {
      tree.insert(50);
      tree.insert(25);
      
      expect(() => tree.search(50)).not.toThrow();
      expect(() => tree.search(100)).not.toThrow();
    });
  });

  describe('delete', () => {
    beforeEach(() => {
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
      tree.delete(6);
      const { node } = tree.findNode(6);
      expect(node).toBeNull();
    });

    it('should correctly delete the only node in the tree', () => {
      const singleNodeTree = new TestableBinarySearchTree(mockSink);
      singleNodeTree.insert(50);
      singleNodeTree.delete(50);
      expect(singleNodeTree.getRoot()).toBeNull();
    });

    it('should correctly delete a node with only a right child', () => {
      tree.delete(12);
      const { node } = tree.findNode(12);
      expect(node).toBeNull();
      const parent = tree.findNode(25).node;
      expect(parent?.left?.value).toBe(18);
    });

    it('should correctly delete the root when it only has a right child', () => {
      const singleNodeTree = new TestableBinarySearchTree(mockSink);
      singleNodeTree.insert(50);
      singleNodeTree.insert(75);
      singleNodeTree.delete(50);
      expect(singleNodeTree.getRoot()?.value).toBe(75);
      expect(singleNodeTree.getRoot()?.left).toBeNull();
    });

    it('should correctly delete a node with two children (simple case)', () => {
      tree.delete(87);
      const parent = tree.findNode(75).node;
      expect(parent?.right?.value).toBe(93);
      expect(parent?.right?.left?.value).toBe(81);
    });
    
    it('should correctly delete the root when it only has a left child', () => {
        const singleNodeTree = new TestableBinarySearchTree(mockSink);
        singleNodeTree.insert(50);
        singleNodeTree.insert(25);
        singleNodeTree.delete(50);
        expect(singleNodeTree.getRoot()?.value).toBe(25);
        expect(singleNodeTree.getRoot()?.right).toBeNull();
    });

    it('should correctly delete a node with two children (successor is right child)', () => {
      tree.delete(62);
      const { node } = tree.findNode(62);
      expect(node).toBeNull();
      const parent = tree.findNode(75).node;
      expect(parent?.left?.value).toBe(68);
      expect(parent?.left?.left?.value).toBe(56);
      expect(parent?.left?.right).toBeNull();
    });

    it('should correctly delete a node with two children (successor is not right child)', () => {
      tree.delete(25);
      const { node } = tree.findNode(25);
      expect(node).toBeNull();
      const parent = tree.findNode(50).node;
      expect(parent?.left?.value).toBe(31);
      expect(parent?.left?.right?.value).toBe(37);
      expect(parent?.left?.right?.left).toBeNull();
    });

    it('should correctly delete a node with two children where successor has a right child', () => {
      tree.insert(69);
      tree.delete(62);
      
      const parent = tree.findNode(75).node;
      expect(parent?.left?.value).toBe(68);
      expect(parent?.left?.left?.value).toBe(56);
      expect(parent?.left?.right?.value).toBe(69);
    });
    
    it('should correctly delete the root node', () => {
      tree.delete(50);
      expect(tree.getRoot()?.value).toBe(56);
      expect(tree.getRoot()?.right?.left?.left).toBeNull();
    });
  });
});
