"use client";

import { BinarySearchTreeVisualizer } from "@/components/visual-ds/binary-search-tree-visualizer";
import { Controls } from "@/components/visual-ds/controls";
import { useBstVisualizer } from "@/hooks/use-bst-visualizer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Github } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const {
    nodes,
    edges,
    visitorNodeId,
    highlightedNodeId,
    isAnimating,
    addNode,
    removeNode,
    searchNode,
    traverse,
  } = useBstVisualizer();

  return (
    <main className="flex min-h-screen w-full flex-col items-center bg-background p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-7xl">
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-primary">Visual DS</h1>
          <Button variant="ghost" size="icon" asChild>
            <a href="https://github.com/firebase/genkit-plugins/tree/main/apps/visual-ds" target="_blank" rel="noopener noreferrer">
              <Github className="h-6 w-6" />
            </a>
          </Button>
        </header>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <Controls
              onAdd={addNode}
              onRemove={removeNode}
              onSearch={searchNode}
              onTraverse={traverse}
              isAnimating={isAnimating}
            />
          </div>
          <div className="lg:col-span-9">
            <Card>
              <CardHeader>
                <CardTitle>Binary Search Tree</CardTitle>
              </CardHeader>
              <CardContent>
                <BinarySearchTreeVisualizer
                  nodes={nodes}
                  edges={edges}
                  visitorNodeId={visitorNodeId}
                  highlightedNodeId={highlightedNodeId}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
