
"use client";

import React from 'react';
import { GraphRenderer } from "@/components/visual-ds/graph-renderer";
import { Controls } from "@/components/visual-ds/controls";
import { useBinarySearchTreeVisualizer } from "@/hooks/use-binary-search-tree-visualizer";
import { useSplayTreeVisualizer } from "@/hooks/use-splay-tree-visualizer";
import { useHeapVisualizer } from "@/hooks/use-heap-visualizer";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ChevronDown, Github, Moon, Sun, Laptop } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

type DataStructure = 'bst' | 'splay' | 'heap';

type Visualizer = ReturnType<typeof useVisualizer>;

const dataStructureLabels: Record<DataStructure, string> = {
  bst: 'Binary Search Tree',
  splay: 'Splay Tree',
  heap: 'Min Heap',
};

const isValidDataStructure = (value: string): value is DataStructure => {
  return value in dataStructureLabels;
};

const useVisualizer = (dsType: DataStructure) => {
  const bst = useBinarySearchTreeVisualizer();
  const splay = useSplayTreeVisualizer();
  const heap = useHeapVisualizer();

  const visualizers = {
    bst: bst,
    splay: splay,
    heap: heap,
  };

  return visualizers[dsType];
}

export default function Home() {
  const [dsType, setDsType] = React.useState<DataStructure>('bst');
  
  const visualizer = useVisualizer(dsType);

  React.useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.substring(1);
      if (isValidDataStructure(hash)) {
        setDsType(hash);
      } else {
        setDsType('bst');
      }
    };

    handleHashChange(); // Set initial state from hash
    window.addEventListener('hashchange', handleHashChange, false);
    return () => {
      window.removeEventListener('hashchange', handleHashChange, false);
    };
  }, []);

  const handleDsTypeChange = (value: string) => {
    if (isValidDataStructure(value)) {
      window.location.hash = value;
      setDsType(value);
    }
  };

  const { setTheme } = useTheme();

  return (
    <main className="flex min-h-screen w-full flex-col items-center bg-background p-4 sm:p-6 md:p-8">
      <div className="flex h-full w-full max-w-7xl flex-col">
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-primary">Visual DS</h1>
           <div className="flex items-center gap-2">
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
            <Button variant="ghost" size="icon" asChild>
              <a href="https://github.com/z-rui/visual-ds-firebase/" target="_blank" rel="noopener noreferrer">
                <Github className="h-6 w-6" />
              </a>
            </Button>
            </div>
        </header>
        <div className="grid flex-grow grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <Controls {...visualizer} />
          </div>
          <div className="flex flex-col lg:col-span-9">
            <Card className="flex flex-grow flex-col">
              <CardHeader>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div className="flex cursor-pointer items-center gap-2 text-2xl font-semibold leading-none tracking-tight">
                      {dataStructureLabels[dsType]}
                      <ChevronDown className="h-5 w-5" />
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuLabel>Choose Data Structure</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuRadioGroup value={dsType} onValueChange={handleDsTypeChange}>
                      <DropdownMenuRadioItem value="bst">{dataStructureLabels['bst']}</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="splay">{dataStructureLabels['splay']}</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="heap">{dataStructureLabels['heap']}</DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent className="flex-grow">
                <GraphRenderer
                  key={dsType}
                  nodes={visualizer.nodes}
                  edges={visualizer.edges}
                  visitorNodeId={visualizer.visitorNodeId}
                  nodeStyles={visualizer.nodeStyles}
                  edgeStyles={visualizer.edgeStyles}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
