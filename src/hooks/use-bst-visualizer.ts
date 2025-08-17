"use client";

import { useState, useCallback, useRef, useEffect } from 'react';
import { BinarySearchTree } from '@/lib/ds/bst';
import type { VisualNode, VisualEdge, AnimationStep, TraversalType } from '@/types/bst';
import { useToast } from "@/hooks/use-toast";

const Y_SPACING = 80;
const X_SPACING = 60;
const ANIMATION_SPEED = 500; // ms

export function useBstVisualizer() {
  const { toast } = useToast();
  const bstRef = useRef(new BinarySearchTree());
  
  const [nodes, setNodes] = useState<VisualNode[]>([]);
  const [edges, setEdges] = useState<VisualEdge[]>([]);
  
  const [visitorNodeId, setVisitorNodeId] = useState<string | null>(null);
  const [highlightedNodeId, setHighlightedNodeId] = useState<string | null>(null);
  
  const [isAnimating, setIsAnimating] = useState(false);
  const animationQueueRef = useRef<AnimationStep[]>([]);

  const calculatePositions = useCallback(() => {
    const newNodes: VisualNode[] = [];
    const newEdges: VisualEdge[] = [];
    const { root } = bstRef.current;
    if (!root) {
      setNodes([]);
      setEdges([]);
      return;
    }

    let x = 0;
    const setCoordinates = (node: any, depth: number) => {
      if (!node) return;
      setCoordinates(node.left, depth + 1);
      newNodes.push({ id: node.id, value: node.value, y: depth * Y_SPACING, x: x * X_SPACING });
      x++;
      setCoordinates(node.right, depth + 1);
    };
    setCoordinates(root, 0);

    const totalWidth = (newNodes.length - 1) * X_SPACING;
    const offsetX = -totalWidth / 2;

    newNodes.forEach(node => node.x += offsetX);

    const buildEdges = (node: any) => {
      if (!node) return;
      if (node.left) {
        newEdges.push({ id: `${node.id}-${node.left.id}`, from: node.id, to: node.left.id });
        buildEdges(node.left);
      }
      if (node.right) {
        newEdges.push({ id: `${node.id}-${node.right.id}`, from: node.id, to: node.right.id });
        buildEdges(node.right);
      }
    };
    buildEdges(root);
    
    setNodes(newNodes);
    setEdges(newEdges);
  }, []);

  const processAnimationQueue = useCallback(async () => {
    if (animationQueueRef.current.length === 0) {
      setIsAnimating(false);
      setVisitorNodeId(null);
      setHighlightedNodeId(null);
      return;
    }

    const step = animationQueueRef.current.shift();
    if (!step) return;

    switch (step.type) {
      case 'visit':
      case 'compare':
        setVisitorNodeId(step.nodeId);
        break;
      case 'insert':
      case 'delete':
      case 'replace':
        setVisitorNodeId(null);
        calculatePositions();
        break;
      case 'search-found':
        setVisitorNodeId(step.nodeId);
        setHighlightedNodeId(step.nodeId);
        break;
      case 'search-not-found':
        toast({ title: 'Search', description: step.message, variant: 'destructive' });
        break;
      case 'error':
        toast({ title: 'Error', description: step.message, variant: 'destructive' });
        animationQueueRef.current = []; // Clear queue on error
        break;
      case 'traversal-end':
         setVisitorNodeId(null);
         break;
    }

    setTimeout(processAnimationQueue, ANIMATION_SPEED);
  }, [calculatePositions, toast]);

  const startAnimation = useCallback((steps: AnimationStep[]) => {
    if (isAnimating) {
        toast({ title: "Animation in progress", description: "Please wait for the current animation to finish.", variant: "destructive" });
        return;
    };
    setHighlightedNodeId(null);
    animationQueueRef.current = steps;
    setIsAnimating(true);
    processAnimationQueue();
  }, [isAnimating, processAnimationQueue, toast]);
  
  const addNode = useCallback((value: number) => {
    const steps: AnimationStep[] = [];
    bstRef.current.insert(value, (step) => steps.push(step));
    startAnimation(steps);
  }, [startAnimation]);

  const removeNode = useCallback((value: number) => {
    const steps: AnimationStep[] = [];
    bstRef.current.delete(value, (step) => steps.push(step));
    startAnimation(steps);
  }, [startAnimation]);

  const searchNode = useCallback((value: number) => {
    const steps: AnimationStep[] = [];
    bstRef.current.search(value, (step) => steps.push(step));
    startAnimation(steps);
  }, [startAnimation]);

  const traverse = useCallback((type: TraversalType) => {
    const steps: AnimationStep[] = [];
    switch (type) {
        case 'in-order':
            bstRef.current.inOrderTraversal(step => steps.push(step));
            break;
        case 'pre-order':
            bstRef.current.preOrderTraversal(step => steps.push(step));
            break;
        case 'post-order':
            bstRef.current.postOrderTraversal(step => steps.push(step));
            break;
    }
    startAnimation(steps);
  }, [startAnimation]);
  
  useEffect(() => {
    // Initial empty state
    calculatePositions();
  }, [calculatePositions]);

  return { nodes, edges, visitorNodeId, highlightedNodeId, isAnimating, addNode, removeNode, searchNode, traverse };
}
