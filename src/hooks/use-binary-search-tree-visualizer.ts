
"use client";

import { useState } from 'react';
import { BinarySearchTree } from '@/lib/ds/binary-search-tree';
import { GraphAnimationProducer } from '@/lib/animation/graph';
import { useBinaryTreeVisualizer } from './use-binary-tree-visualizer';

const initialTreeData = [50, 25, 75, 15, 35, 65, 85];

export function useBinarySearchTreeVisualizer() {
  const [animationProducer] = useState(() => new GraphAnimationProducer());
  const [tree] = useState<BinarySearchTree>(() => {
    const tree = new BinarySearchTree(animationProducer);
    initialTreeData.forEach(value => { tree.insert(value) });
    // We get the layout but don't generate an animation for the initial state.
    // The initial state will be rendered directly by the visualizer.
    animationProducer.start({
      nodes: tree.getLayout()[0],
      edges: tree.getLayout()[1],
      visitorNodeId: null,
      nodeStyles: new Map(),
      edgeStyles: new Map(),
    });
    animationProducer.finish();
    return tree;
  });

  return useBinaryTreeVisualizer(tree, animationProducer);
}
