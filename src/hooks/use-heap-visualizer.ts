
"use client";

import { useState, useCallback } from 'react';
import { Heap } from '@/lib/ds/heap';
import { GraphAnimationProducer } from '@/lib/animation/graph';
import { useDataStructureVisualizer } from './use-data-structure-visualizer';
import type { GraphScene } from '@/types/graph-scene';

const initialData = [10, 20, 15, 30, 40, 50, 5];

export function useHeapVisualizer() {
    const [animationProducer] = useState(() => new GraphAnimationProducer());
    const [heap] = useState<Heap>(() => {
        const h = new Heap(animationProducer);
        initialData.forEach(value => h.add(value));
        const [initialNodes, initialEdges] = h.getLayout();
        animationProducer.start({
            nodes: initialNodes,
            edges: initialEdges,
            visitorNodeId: null,
            nodeStyles: new Map(),
            edgeStyles: new Map(),
        });
        animationProducer.finish();
        return h;
    });

    const [initialNodes, initialEdges] = heap.getLayout();
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
        resetToScene,
    } = useDataStructureVisualizer(initialScene, []);

    const runAlgorithm = useCallback((algorithm: () => void) => {
        const [currentNodes, currentEdges] = heap.getLayout();
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
    }, [heap, animationProducer, startAnimation]);

    const addNode = useCallback((value: number) => {
        runAlgorithm(() => heap.add(value));
    }, [runAlgorithm, heap]);

    const extractMin = useCallback(() => {
        runAlgorithm(() => heap.extractMin());
    }, [runAlgorithm, heap]);


    const clearTree = useCallback(() => {
        heap.clear();
        const [nodes, edges] = heap.getLayout();
        resetToScene({
            nodes,
            edges,
            visitorNodeId: null,
            nodeStyles: new Map(),
            edgeStyles: new Map(),
        });
    }, [heap, resetToScene]);

    const addRandomNodes = useCallback((count?: number) => {
        let numNodes = count && count > 0 ? count : 10;
        if (numNodes > 20) numNodes = 20;

        const MAX_VALUE = 100;
        for (let i = 0; i < numNodes; i++) {
            const value = Math.floor(Math.random() * MAX_VALUE);
            heap.add(value);
        }
        const [nodes, edges] = heap.getLayout();
        resetToScene({
            nodes,
            edges,
            visitorNodeId: null,
            nodeStyles: new Map(),
            edgeStyles: new Map(),
        });
    }, [heap, resetToScene]);

    return {
        nodes,
        edges,
        visitorNodeId,
        nodeStyles,
        edgeStyles,
        isAnimating,
        actions: {
            add: addNode,
            // Expose extractMin instead of remove/search
            extractMin: extractMin,
        },
        clearTree,
        addRandomNodes,
        animationControls,
        currentAnimationStep,
    };
}
