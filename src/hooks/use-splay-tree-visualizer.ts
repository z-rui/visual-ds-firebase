
"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useToast } from "@/hooks/use-toast";
import { SplayTree } from '@/lib/ds/splay-tree';
import { GraphScene } from '@/types/graph-scene';
import { GraphAnimationProducer } from '@/lib/animation/graph';

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

const ANIMATION_INTERVAL = 750; // Base interval for auto-play

const initialTreeData = [50, 25, 75, 15, 35, 65, 85];

export function useSplayTreeVisualizer() {
  const { toast } = useToast();

  const [animationProducer,] = useState(() => new GraphAnimationProducer);
  const [tree,] = useState<SplayTree>(() => {
    const tree = new SplayTree(animationProducer);
    initialTreeData.forEach(value => { tree.insert(value) });
    return tree;
  });

  // Base visual state, representing the current stable layout
  const [baseLayout, setBaseLayout] = useState<GraphScene>(() => {
    const [nodes, edges] = tree.getLayout();
    return { nodes, edges, visitorNodeId: null, nodeStyles: new Map(), edgeStyles: new Map() };
  });

  const [isAnimating, setIsAnimating] = useState(false);
  const [animationSteps, setAnimationSteps] = useState<GraphScene[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(3);

  const animationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const currentAnimationStep = useMemo(() => {
    return animationSteps[currentStep] || null;
  }, [animationSteps, currentStep]);

  // The visualizer now renders from the current step if animating,
  // or from the stable baseLayout if not.
  const displayedStep = currentAnimationStep ?? baseLayout;
  const {
    nodes,
    edges,
    visitorNodeId,
    nodeStyles,
    edgeStyles,
  } = displayedStep;


  const applyToast = useCallback((step?: GraphScene) => {
    if (step?.toast) {
      toast(step.toast);
    }
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
    if (!isAnimating || !animationSteps[currentStep]) return;

    applyToast(animationSteps[currentStep]);

    if (currentStep >= animationSteps.length - 1) {
      // When animation finishes, update the base layout to the final step
      setBaseLayout(animationSteps[currentStep]);
      setIsAnimating(false);
      setIsPlaying(false);
    }
  }, [currentStep, animationSteps, applyToast, isAnimating]);

  const goToStep = useCallback((targetStep: number) => {
    if (targetStep >= 0 && targetStep < animationSteps.length) {
      setCurrentStep(targetStep);
      setIsPlaying(false);
    }
  }, [animationSteps]);

  const startAnimation = useCallback((steps: GraphScene[]) => {
    if (isAnimating) {
      toast({ title: "Animation in progress", description: "Please wait for the current animation to finish.", variant: "destructive" });
      return;
    };
    if (animationIntervalRef.current) clearInterval(animationIntervalRef.current);

    setAnimationSteps(steps);

    if (steps.length > 0) {
      setIsAnimating(true);
      setCurrentStep(0);
      if (isAutoPlaying && steps.length > 1) {
        setIsPlaying(true);
      } else {
        setIsPlaying(false);
        applyToast(steps[0]);
      }
    }
  }, [isAnimating, toast, isAutoPlaying, applyToast]);

  const runAlgorithm = (algorithm: () => void) => {
    animationProducer.start(baseLayout);
    algorithm();
    const story = animationProducer.finish();
    startAnimation(story);
  };

  const addNode = useCallback((value: number) => {
    runAlgorithm(() => tree.insert(value));
  }, [baseLayout, startAnimation]);

  const removeNode = useCallback((value: number) => {
    runAlgorithm(() => tree.delete(value));
  }, [baseLayout, startAnimation]);

  const searchNode = useCallback((value: number) => {
    runAlgorithm(() => tree.search(value));
  }, [baseLayout, startAnimation]);

  const canStepForward = currentStep < animationSteps.length - 1;
  const canStepBack = currentStep > 0;

  const stepForward = () => {
    if (canStepForward) goToStep(currentStep + 1);
  };
  const stepBack = () => {
    if (canStepBack) goToStep(currentStep - 1);
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
    nodeStyles,
    edgeStyles,
    isAnimating,
    addNode,
    removeNode,
    searchNode,
    animationControls,
    currentAnimationStep: displayedStep,
  };
}
