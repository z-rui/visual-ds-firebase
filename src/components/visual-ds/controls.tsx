
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AnimationControls } from "@/hooks/use-data-structure-visualizer";
import type { GraphScene } from "@/types/graph-scene";
import { Slider } from '@/components/ui/slider';
import { FastForward, Pause, Play, Rewind, StepBack, StepForward, Plus, Trash2, Search, MoreHorizontal, Shuffle, CircleSlash, PlaySquare, ArrowDownToDot } from 'lucide-react';
import { Label } from "@/components/ui/label";
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuCheckboxItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

interface ControlsProps {
    actions: {
        add?: (value: number) => void;
        remove?: (value: number) => void;
        search?: (value: number) => void;
        extractMin?: () => void;
    },
    isAnimating: boolean;
    animationControls: AnimationControls;
    currentAnimationStep: GraphScene | null;
    clearTree: () => void;
    addRandomNodes: (count?: number) => void;
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
    addRandomNodes();
  };

  const handleExtractMin = () => {
    if (actions.extractMin) {
      actions.extractMin();
    }
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
      <CardHeader className="hidden lg:flex">
        <CardTitle>Controls</CardTitle>
      </CardHeader>
      <CardContent className="p-4 lg:p-6 lg:pt-6">
        <Form {...form}>
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <FormField
              control={form.control}
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="hidden lg:block">Node Value (0-999)</FormLabel>
                  <div className="flex items-start gap-2">
                     {/* Combined Input and Buttons for all screen sizes */}
                    <div className="flex w-full items-start gap-2">
                      <div className="flex-grow">
                        <FormControl>
                          <Input
                            id="node-value"
                            type="number"
                            placeholder="Node Value (0-999)"
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
                        <FormMessage className="mt-2 lg:hidden" />
                      </div>

                      {/* Mobile Icon Buttons */}
                      <div className="flex lg:hidden items-center gap-1">
                          {actions.add && <Button type="button" size="icon" variant="default" onClick={() => handleAction(actions.add)} disabled={isAnimating || isValueInvalid}><Plus className="h-4 w-4" /><span className="sr-only">Add</span></Button>}
                          {actions.remove && <Button type="button" size="icon" variant="outline" onClick={() => handleAction(actions.remove)} disabled={isAnimating || isValueInvalid}><Trash2 className="h-4 w-4" /><span className="sr-only">Remove</span></Button>}
                          {actions.search && <Button type="button" size="icon" variant="outline" onClick={() => handleAction(actions.search)} disabled={isAnimating || isValueInvalid}><Search className="h-4 w-4" /><span className="sr-only">Search</span></Button>}
                          {actions.extractMin && <Button type="button" size="icon" variant="default" onClick={handleExtractMin} disabled={isAnimating}><ArrowDownToDot className="h-4 w-4" /><span className="sr-only">Extract Min</span></Button>}
                      </div>
                      
                      {/* Desktop "Add" Button */}
                      {actions.add && <Button type="button" className="hidden lg:inline-flex" onClick={() => handleAction(actions.add)} disabled={isAnimating || isValueInvalid}><Plus/>Add</Button>}

                      {/* Mobile Dropdown */}
                      <div className="flex lg:hidden">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">More options</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {addRandomNodes && <DropdownMenuItem onSelect={handleAddRandom} disabled={isAnimating}><Shuffle className="mr-2 h-4 w-4" /><span>Add Random</span></DropdownMenuItem>}
                            {clearTree && <DropdownMenuItem onSelect={clearTree} disabled={isAnimating}><CircleSlash className="mr-2 h-4 w-4" /><span>Clear</span></DropdownMenuItem>}
                            <DropdownMenuSeparator />
                            <DropdownMenuCheckboxItem checked={isAutoPlaying} onCheckedChange={setIsAutoPlaying}>
                              <PlaySquare className="mr-2 h-4 w-4" />
                              <span>Auto-Animate</span>
                            </DropdownMenuCheckboxItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                   <FormMessage className="mt-2 hidden lg:block" />
                </FormItem>
              )}
            />

            {/* Desktop secondary buttons grid */}
            <div className="hidden lg:grid lg:grid-cols-2 lg:gap-2">
              {actions.remove && <Button type="button" variant="outline" onClick={() => handleAction(actions.remove)} disabled={isAnimating || isValueInvalid}><Trash2/>Remove</Button>}
              {actions.search && <Button type="button" variant="outline" onClick={() => handleAction(actions.search)} disabled={isAnimating || isValueInvalid}><Search/>Search</Button>}
              {actions.extractMin && <Button type="button" onClick={handleExtractMin} disabled={isAnimating}><ArrowDownToDot/>Extract Min</Button>}
              {clearTree && <Button type="button" variant="destructive" onClick={clearTree} disabled={isAnimating}><CircleSlash/>Clear</Button>}
              {addRandomNodes && <Button type="button" variant="secondary" onClick={handleAddRandom} disabled={isAnimating}><Shuffle/>Add Random</Button>}
            </div>
            
            <div className="hidden lg:flex items-center space-x-2 pt-2">
              <Checkbox id="auto-animate" checked={isAutoPlaying} onCheckedChange={(checked) => setIsAutoPlaying(!!checked)} />
              <Label htmlFor="auto-animate">Auto-Animate on Start</Label>
            </div>
          </form>
        </Form>
        
        {totalSteps > 0 && (
          <div className="hidden lg:block">
            <Separator />
            <div className="space-y-4 pt-4">
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
            <Separator className="my-4"/>
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
            <Separator className="my-4"/>
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
          </div>
        )}
      </CardContent>
    </Card>
  );
}
