
"use client";

import { useCallback } from 'react';
import type { BinaryTree } from '@/lib/ds/binary-tree';
import { GraphAnimationProducer } from '@/lib/animation/graph';
import { useDataStructureVisualizer, AnimationControls } from './use-data-structure-visualizer';
import type { GraphScene, VisualNode, VisualEdge, NodeStyle, EdgeStyle } from '@/types/graph-scene';

export interface BinaryTreeVisualizer {
    nodes: VisualNode[];
    edges: VisualEdge[];
    visitorNodeId: string | null;
    nodeStyles: Map<string, NodeStyle>;
    edgeStyles: Map<string, EdgeStyle>;
    isAnimating: boolean;
    addNode: (value: number) => void;
    removeNode: (value: number) => void;
    searchNode: (value: number) => void;
    animationControls: AnimationControls;
    currentAnimationStep: GraphScene | null;
}

export function useBinaryTreeVisualizer(
    tree: BinaryTree,
    animationProducer: GraphAnimationProducer,
): BinaryTreeVisualizer {
    const [initialNodes, initialEdges] = tree.getLayout();
    const initialScene: GraphScene = {
        nodes: initialNodes,
        edges: initialEdges,
        visitorNodeId: null,
        nodeStyles: new Map(),
        edgeStyles: new Map(),
    };

    const {
        nodes,
        edges,
        visitorNodeId,
        nodeStyles,
        edgeStyles,
        isAnimating,
        startAnimation,
        animationControls,
        currentAnimationStep,
    } = useDataStructureVisualizer(initialScene, []);

    const runAlgorithm = useCallback((algorithm: () => void) => {
        const [currentNodes, currentEdges] = tree.getLayout();
        const baseLayout: GraphScene = {
            nodes: currentNodes,
            edges: currentEdges,
            visitorNodeId: null,
            nodeStyles: new Map(),
            edgeStyles: new Map(),
        }
        animationProducer.start(baseLayout);
        algorithm();
        const story = animationProducer.finish();
        startAnimation(story);
    }, [tree, animationProducer, startAnimation]);

    const addNode = useCallback((value: number) => {
        runAlgorithm(() => tree.insert(value));
    }, [runAlgorithm, tree]);

    const removeNode = useCallback((value: number) => {
        runAlgorithm(() => tree.delete(value));
    }, [runAlgorithm, tree]);

    const searchNode = useCallback((value: number) => {
        runAlgorithm(() => tree.search(value));
    }, [runAlgorithm, tree]);

    return {
        nodes,
        edges,
        visitorNodeId,
        nodeStyles,
        edgeStyles,
        isAnimating,
        addNode,
        removeNode,
        searchNode,
        animationControls,
        currentAnimationStep,
    };
}
