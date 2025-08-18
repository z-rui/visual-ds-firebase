
"use client";

import { BinarySearchTreeVisualizer } from "@/components/visual-ds/binary-search-tree-visualizer";
import { Controls } from "@/components/visual-ds/controls";
import { useBstVisualizer } from "@/hooks/use-bst-visualizer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Github, Moon, Sun, Laptop } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function Home() {
  const {
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
  } = useBstVisualizer();
  
  const { setTheme } = useTheme();

  return (
    <main className="flex min-h-screen w-full flex-col items-center bg-background p-4 sm:p-6 md:p-8">
      <div className="flex h-full w-full max-w-7xl flex-col">
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-primary">Visual DS</h1>
           <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <a href="https://github.com/firebase/genkit-plugins/tree/main/apps/visual-ds" target="_blank" rel="noopener noreferrer">
                <Github className="h-6 w-6" />
              </a>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Sun className="h-6 w-6 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-6 w-6 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  <span className="sr-only">Toggle theme</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme('light')}>
                  <Sun className="mr-2 h-4 w-4" /> Light
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('dark')}>
                  <Moon className="mr-2 h-4 w-4" /> Dark
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('system')}>
                  <Laptop className="mr-2 h-4 w-4" /> System
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <div className="grid flex-grow grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <Controls
              onAdd={addNode}
              onRemove={removeNode}
              onSearch={searchNode}
              isAnimating={isAnimating}
              animationControls={animationControls}
              currentAnimationStep={currentAnimationStep}
            />
          </div>
          <div className="flex flex-col lg:col-span-9">
            <Card className="flex flex-grow flex-col">
              <CardHeader>
                <CardTitle>Binary Search Tree</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow">
                <BinarySearchTreeVisualizer
                  nodes={nodes}
                  edges={edges}
                  visitorNodeId={visitorNodeId}
                  nodeStyles={nodeStyles}
                  edgeStyles={edgeStyles}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
