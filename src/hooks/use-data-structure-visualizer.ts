
"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useToast } from "@/hooks/use-toast";
import { GraphScene } from '@/types/graph-scene';

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

export function useDataStructureVisualizer(
  initialScene: GraphScene, 
  story: GraphScene[]
) {
  const { toast } = useToast();

  const [baseLayout, setBaseLayout] = useState<GraphScene>(initialScene);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationSteps, setAnimationSteps] = useState<GraphScene[]>(story);
  const [currentStep, setCurrentStep] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(3);

  const animationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const currentAnimationStep = useMemo(() => {
    return animationSteps[currentStep] || null;
  }, [animationSteps, currentStep]);

  const displayedStep = currentAnimationStep ?? baseLayout;
  const {
    nodes,
    edges,
    visitorNodeId,
    nodeStyles,
    edgeStyles,
  } = displayedStep;

  const resetToScene = useCallback((scene: GraphScene) => {
    setBaseLayout(scene);
    setAnimationSteps([]);
    setCurrentStep(0);
    setIsAnimating(false);
    setIsPlaying(false);
  }, []);

  const applyToast = useCallback((step?: GraphScene) => {
    if (step?.toast) {
      toast(step.toast);
    }
  }, [toast]);

  const startAnimation = useCallback((steps: GraphScene[]) => {
    if (isAnimating) {
      toast({ title: "Animation in progress", description: "Please wait for the current animation to finish.", variant: "destructive" });
      return;
    }
    if (animationIntervalRef.current) clearInterval(animationIntervalRef.current);
    
    setAnimationSteps(steps);
    setCurrentStep(0);

    if (steps.length > 0) {
      setIsAnimating(true);
      if (isAutoPlaying && steps.length > 1) {
        setIsPlaying(true);
      } else {
        setIsPlaying(false);
        applyToast(steps[0]);
      }
    }
  }, [isAnimating, toast, isAutoPlaying, applyToast]);

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
  };

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
    startAnimation,
    animationControls,
    currentAnimationStep: displayedStep,
    resetToScene,
  };
}
