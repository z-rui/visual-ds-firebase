"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { TraversalType } from '@/types/bst';
import { Play } from 'lucide-react';

interface ControlsProps {
  onAdd: (value: number) => void;
  onRemove: (value: number) => void;
  onSearch: (value: number) => void;
  onTraverse: (type: TraversalType) => void;
  isAnimating: boolean;
}

export function Controls({ onAdd, onRemove, onSearch, onTraverse, isAnimating }: ControlsProps) {
  const [value, setValue] = useState('');

  const handleAction = (action: 'add' | 'remove' | 'search') => {
    const numValue = parseInt(value, 10);
    if (isNaN(numValue)) {
      // Maybe show a toast notification here
      return;
    }
    switch(action) {
      case 'add': onAdd(numValue); break;
      case 'remove': onRemove(numValue); break;
      case 'search': onSearch(numValue); break;
    }
    setValue('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Controls</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="node-value">Node Value (0-999)</Label>
            <Input
              id="node-value"
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="e.g., 42"
              min="0"
              max="999"
              disabled={isAnimating}
            />
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Button onClick={() => handleAction('add')} disabled={isAnimating || !value}>Add Node</Button>
            <Button variant="outline" onClick={() => handleAction('remove')} disabled={isAnimating || !value}>Remove Node</Button>
            <Button variant="outline" className="col-span-1 sm:col-span-2" onClick={() => handleAction('search')} disabled={isAnimating || !value}>Search Node</Button>
          </div>
        </div>
        <Separator />
        <div className="space-y-4">
           <h3 className="text-sm font-medium">Traversals</h3>
           <div className="grid grid-cols-1 gap-2">
            <Button variant="ghost" className="justify-start" onClick={() => onTraverse('in-order')} disabled={isAnimating}><Play className="mr-2 h-4 w-4" /> In-order</Button>
            <Button variant="ghost" className="justify-start" onClick={() => onTraverse('pre-order')} disabled={isAnimating}><Play className="mr-2 h-4 w-4" /> Pre-order</Button>
            <Button variant="ghost" className="justify-start" onClick={() => onTraverse('post-order')} disabled={isAnimating}><Play className="mr-2 h-4 w-4" /> Post-order</Button>
           </div>
        </div>
      </CardContent>
    </Card>
  );
}
