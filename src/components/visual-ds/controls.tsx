
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AnimationControls } from "@/hooks/use-data-structure-visualizer";
import type { GraphScene } from "@/types/graph-scene";
import { Slider } from '@/components/ui/slider';
import { FastForward, Pause, Play, Rewind, StepBack, StepForward } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { BinaryTreeVisualizer } from "@/hooks/use-binary-tree-visualizer";

interface ControlsProps extends BinaryTreeVisualizer {
}

const formSchema = z.object({
  value: z.coerce.number({
    invalid_type_error: "Value must be a number.",
  }).min(0, "Value must be >= 0.").max(999, "Value must be <= 999.").optional().or(z.literal('')),
});


type FormSchema = z.infer<typeof formSchema>;

export function Controls({ 
  actions,
  isAnimating,
  animationControls,
  currentAnimationStep,
  clearTree,
  addRandomNodes
 }: ControlsProps) {
  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      value: '',
    },
  });

  const handleAction = (actionFn?: (value: number) => void) => {
    const value = form.getValues("value");
    if (value === '' || value === undefined || !actionFn) return;

    actionFn(value);
    form.reset({ value: '' });
  };
  
  const handleAddRandom = () => {
    if (!addRandomNodes) return;
    const value = form.getValues("value");
    addRandomNodes(value !== '' ? value : undefined);
    form.reset({ value: '' });
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

  const isValueInvalid = form.getValues("value") === '' || !form.formState.isValid;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Controls</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Form {...form}>
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
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
                      onChange={(e) => {
                        if (e.target.value === '') {
                          field.onChange('');
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
              {actions.add && <Button type="button" onClick={() => handleAction(actions.add)} disabled={isAnimating || isValueInvalid}>Add Node</Button>}
              {actions.remove && <Button type="button" variant="outline" onClick={() => handleAction(actions.remove)} disabled={isAnimating || isValueInvalid}>Remove Node</Button>}
              {actions.search && <Button type="button" variant="outline" className="col-span-1 sm:col-span-2" onClick={() => handleAction(actions.search)} disabled={isAnimating || isValueInvalid}>Search Node</Button>}
            </div>
          </form>
        </Form>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {clearTree && <Button type="button" variant="destructive" onClick={clearTree} disabled={isAnimating}>Clear</Button>}
          {addRandomNodes && <Button type="button" variant="secondary" onClick={handleAddRandom} disabled={isAnimating}>Add Random</Button>}
        </div>

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
