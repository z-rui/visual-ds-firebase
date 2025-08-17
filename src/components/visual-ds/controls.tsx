
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AnimationControls, AnimationStep } from '@/hooks/use-bst-visualizer';
import { Slider } from '@/components/ui/slider';
import { FastForward, Pause, Play, Rewind, StepBack, StepForward } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

interface ControlsProps {
  onAdd: (value: number) => void;
  onRemove: (value: number) => void;
  onSearch: (value: number) => void;
  isAnimating: boolean;
  animationControls: AnimationControls;
  currentAnimationStep: AnimationStep | null;
}

const formSchema = z.object({
  value: z.coerce.number({
    required_error: "A value is required.",
    invalid_type_error: "Value must be a number.",
  }).min(0, "Value must be >= 0.").max(999, "Value must be <= 999.").optional().or(z.literal(undefined)),
});


type FormSchema = z.infer<typeof formSchema>;

export function Controls({ onAdd, onRemove, onSearch, isAnimating, animationControls, currentAnimationStep }: ControlsProps) {
  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      value: undefined,
    },
  });

  const handleAction = (action: 'add' | 'remove' | 'search') => {
    const value = form.getValues("value");
    if (value === undefined) return;

    switch (action) {
      case 'add': onAdd(value); break;
      case 'remove': onRemove(value); break;
      case 'search': onSearch(value); break;
    }
    form.reset({ value: undefined });
  };

  const {
    currentStep,
    totalSteps,
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
  } = animationControls;

  const isFormInvalid = !form.formState.isValid;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Controls</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Form {...form}>
          <form className="space-y-4">
            <FormField
              control={form.control}
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Node Value (0-999)</FormLabel>
                  <FormControl>
                    <Input
                      id="node-value"
                      type="number"
                      placeholder="e.g., 42"
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) => {
                        if (e.target.value === '') {
                          field.onChange(undefined);
                        } else {
                          field.onChange(e.target.valueAsNumber);
                        }
                      }}
                      disabled={isAnimating}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Button type="button" onClick={() => handleAction('add')} disabled={isAnimating || isFormInvalid}>Add Node</Button>
              <Button type="button" variant="outline" onClick={() => handleAction('remove')} disabled={isAnimating || isFormInvalid}>Remove Node</Button>
              <Button type="button" variant="outline" className="col-span-1 sm:col-span-2" onClick={() => handleAction('search')} disabled={isAnimating || isFormInvalid}>Search Node</Button>
            </div>
          </form>
        </Form>
        <div className="flex items-center space-x-2 pt-2">
          <Checkbox id="auto-animate" checked={isAutoPlaying} onCheckedChange={(checked) => setIsAutoPlaying(!!checked)} />
          <Label htmlFor="auto-animate">Auto-Animate on Start</Label>
        </div>

        {totalSteps > 0 && (
          <>
            <Separator />
            <div className="space-y-4">
              <Label>Animation Progress ({currentStep} / {totalSteps})</Label>
              <Slider
                value={[currentStep]}
                onValueChange={(value) => goToStep(value[0])}
                min={0}
                max={totalSteps}
                step={1}
                disabled={isAnimating && isPlaying}
              />
              <div className="flex justify-center items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={rewind} disabled={!canStepBack}>
                      <Rewind className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={stepBack} disabled={!canStepBack}>
                      <StepBack className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={togglePlayPause} disabled={!canStepForward && !isPlaying}>
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={stepForward} disabled={!canStepForward}>
                      <StepForward className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={fastForward} disabled={!canStepForward}>
                      <FastForward className="w-5 h-5" />
                  </Button>
              </div>
            </div>
            <Separator />
            <div className="space-y-4">
              <Label>Animation Speed</Label>
              <Slider
                value={[animationSpeed]}
                onValueChange={(value) => setAnimationSpeed(value[0])}
                min={1}
                max={5}
                step={1}
              />
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>Debug: Current Action</Label>
              <pre className="text-xs p-2 bg-muted rounded-md overflow-x-auto">
                <code>
                  {currentAnimationStep?.action 
                    ? JSON.stringify(currentAnimationStep.action, null, 2)
                    : "N/A"
                  }
                </code>
              </pre>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
