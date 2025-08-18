
"use client";

import { BinarySearchTreeVisualizer } from "@/components/visual-ds/binary-search-tree-visualizer";
import { Controls } from "@/components/visual-ds/controls";
import { useBstVisualizerV2 } from "@/hooks/use-bst-visualizer-v2";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Github, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from 'next/link';

export default function V2Page() {
  const {
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
  } = useBstVisualizerV2();

  return (
    <main className="flex min-h-screen w-full flex-col items-center bg-background p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-7xl">
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-primary">Visual DS (V2)</h1>
           <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/">
                <LinkIcon className="mr-2 h-4 w-4" />
                Go to V1
              </Link>
            </Button>
            <Button variant="ghost" size="icon" asChild>
              <a href="https://github.com/firebase/genkit-plugins/tree/main/apps/visual-ds" target="_blank" rel="noopener noreferrer">
                <Github className="h-6 w-6" />
              </a>
            </Button>
          </div>
        </header>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
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
                  deletionHighlightNodeId={deletionHighlightNodeId}
                  invisibleNodes={invisibleNodes}
                  invisibleEdges={invisibleEdges}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
