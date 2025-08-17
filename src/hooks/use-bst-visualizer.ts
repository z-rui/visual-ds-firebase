
"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { BinarySearchTree } from '@/lib/ds/bst';
import type { VisualNode, VisualEdge, AnimationStep } from '@/types/bst';
import { useToast } from "@/hooks/use-toast";
import { generateInsertSteps, generateSearchSteps, generateDeleteSteps } from '@/lib/animation/bst-animation-producer';
import { calculateLayout } from '@/lib/animation/bst-animation-producer';

const ANIMATION_INTERVAL = 750; // Base interval for auto-play

const initialTreeData = [50, 25, 75, 12, 37, 62, 87, 6, 18, 31, 43, 56, 68, 81, 93];

export interface AnimationControls {
  currentStep: number;
  totalSteps: number;
  isPlaying: boolean;
  isAutoPlaying: boolean;
  canStepBack: boolean;
  canStepForward: boolean;
  goToStep: (step: number) => void;
  stepBack: () => void;
  stepForward: () => void;
  rewind: () => void;
  fastForward: () => void;
  togglePlayPause: () => void;
  setIsAutoPlaying: (isAutoPlaying: boolean) => void;
  animationSpeed: number;
  setAnimationSpeed: (speed: number) => void;
}


export function useBstVisualizer() {
  const { toast } = useToast();
  
  const [tree, setTree] = useState(() => {
    let newTree = new BinarySearchTree();
    initialTreeData.forEach(value => {
        newTree = newTree.insert(value);
    });
    return newTree;
  });

  const [isAnimating, setIsAnimating] = useState(false);
  const [animationSteps, setAnimationSteps] = useState<AnimationStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(3);

  const animationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const latestTree = useRef(tree);
  
  const baseLayout = useMemo(() => calculateLayout(tree), [tree]);

  const currentAnimationStep = useMemo(() => {
    if (animationSteps[currentStep]) {
        return animationSteps[currentStep];
    }
    return null;
  }, [animationSteps, currentStep]);

  // Derive visual state from the current step, or fall back to the base layout
  const nodes = currentAnimationStep?.nodes ?? baseLayout.nodes;
  const edges = currentAnimationStep?.edges ?? baseLayout.edges;
  const invisibleNodes = currentAnimationStep?.invisibleNodes ?? new Set<string>();
  const invisibleEdges = currentAnimationStep?.invisibleEdges ?? new Set<string>();
  const visitorNodeId = currentAnimationStep?.visitorNodeId ?? null;
  const highlightedNodeId = currentAnimationStep?.highlightedNodeId ?? null;
  const deletionHighlightNodeId = currentAnimationStep?.deletionHighlightNodeId ?? null;

  const applyToast = useCallback((step: AnimationStep | undefined) => {
    if (!step) return;
    if (step.toast) toast(step.toast);
  }, [toast]);
    
  useEffect(() => {
    if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current);
    }
    if (isPlaying && currentStep < animationSteps.length - 1) {
      const speedMultiplier = 1.75 - (animationSpeed * 0.25);
      animationIntervalRef.current = setInterval(() => {
        setCurrentStep(prev => prev + 1);
      }, ANIMATION_INTERVAL * speedMultiplier);
    }
    return () => {
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current);
      }
    };
  }, [isPlaying, currentStep, animationSteps, animationSpeed]);
  
  useEffect(() => {
    if (!animationSteps[currentStep]) return;

    applyToast(animationSteps[currentStep]);

    if (currentStep >= animationSteps.length - 1) {
      setIsAnimating(false);
      setIsPlaying(false);
      setTree(latestTree.current);
    }
  }, [currentStep, animationSteps, applyToast, isAnimating]);


  const goToStep = useCallback((targetStep: number) => {
    if (targetStep >= 0 && targetStep < animationSteps.length) {
      setCurrentStep(targetStep);
      setIsPlaying(false);
    }
  }, [animationSteps]);
  
  const startAnimation = useCallback((steps: AnimationStep[]) => {
    if (isAnimating) {
        toast({ title: "Animation in progress", description: "Please wait for the current animation to finish.", variant: "destructive" });
        return;
    };
    if (animationIntervalRef.current) clearInterval(animationIntervalRef.current);
    
    setAnimationSteps(steps);
    
    if (steps.length > 0) {
      setIsAnimating(true);
      setCurrentStep(0);
      if (isAutoPlaying) {
        setIsPlaying(true);
      } else {
        setIsPlaying(false);
      }
    }
  }, [isAnimating, toast, isAutoPlaying]);
  
  const addNode = useCallback((value: number) => {
    if (tree.search(value).foundNodeId) {
      toast({ title: "Node Exists", description: `Node with value ${value} already exists in the tree.`, variant: "destructive" });
      return;
    }
    const beforeTree = tree;
    const afterTree = tree.insert(value);
    latestTree.current = afterTree;
    const steps = generateInsertSteps(beforeTree, afterTree, value);
    startAnimation(steps);
  }, [tree, startAnimation, toast]);

  const removeNode = useCallback((value: number) => {
    if (!tree.search(value).foundNodeId) {
      toast({ title: "Not Found", description: `Node with value ${value} not found.`, variant: "destructive" });
      return;
    }
    const beforeTree = tree;
    const afterTree = tree.delete(value);
    latestTree.current = afterTree;
    const steps = generateDeleteSteps(beforeTree, afterTree, value);
    startAnimation(steps);
  }, [tree, startAnimation, toast]);

  const searchNode = useCallback((value: number) => {
    const steps = generateSearchSteps(tree, value);
    startAnimation(steps);
  }, [tree, startAnimation]);

  const canStepForward = currentStep < animationSteps.length - 1;
  const canStepBack = currentStep > 0;

  const stepForward = () => {
    if (canStepForward) {
      goToStep(currentStep + 1);
    }
  };
  const stepBack = () => {
      if (canStepBack) {
          goToStep(currentStep - 1);
      }
  };
  const rewind = () => {
      goToStep(0);
  };
  const fastForward = () => {
      goToStep(animationSteps.length - 1);
  };

  const togglePlayPause = () => {
    if (!canStepForward) {
      setIsPlaying(false);
      return;
    }
    setIsPlaying(prev => !prev);
  }

  const animationControls: AnimationControls = {
    currentStep,
    totalSteps: animationSteps.length > 0 ? animationSteps.length - 1 : 0,
    isPlaying,
    isAutoPlaying,
    canStepBack,
    canStepForward,
    goToStep,
    stepBack,
    stepForward,
    rewind,
    fastForward,
    togglePlayPause,
    setIsAutoPlaying,
    animationSpeed,
    setAnimationSpeed,
  };

  return { 
    nodes, 
    edges, 
    visitorNodeId, 
    highlightedNodeId, 
    deletionHighlightNodeId,
    isAnimating, 
    addNode, 
    removeNode, 
    searchNode, 
    invisibleNodes, 
    invisibleEdges,
    animationControls,
    currentAnimationStep,
  };
}
