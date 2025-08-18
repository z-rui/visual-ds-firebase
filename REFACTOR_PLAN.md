# Refactor Plan: A Scalable Animation Storyboard Architecture

This document outlines a new architecture for the animation "Director" — the system responsible for generating animation storyboards. The goal is to replace the current, rigid animation producer with a flexible, event-driven model that is more robust, maintainable, and easier to extend.

The refactor will be performed in a series of isolated, incremental steps. We will build the new system in parallel with the old one, accessible via a new `/v2` URL, to allow for verification at each stage without disrupting the working application.

---

## 1. Architectural Goal

To replace the current, rigid "state-diffing" animation producer with a flexible, event-driven model where the data structure itself is the single source of truth for its own animation logic.

---

## 2. Proposed Architecture: Keyframe Event Sourcing

This is a robust, event-driven model that correctly handles all known use cases, including complex, multi-stage animations (like AVL rotations).

### How it Works

The system is divided into three cleanly separated parts: The Data Structure, the Snapshot Generator, and the UI Renderer.

1.  **The Data Structure (The Event Source):**
    *   The core data structure methods (e.g., `insert`, `delete`) will be modified to return a **flat array of semantic `AnimationEvent` objects**.
    *   These events are simple, atomic descriptions of the operation, like `{ type: 'ADD_NODE', ... }`, `{ type: 'REMOVE_EDGE', ... }`, etc.
    *   Crucially, to handle multi-stage animations, the data structure will also emit a special event: `{ type: 'UPDATE_LAYOUT', tree: <TreeSnapshot> }`. This event acts as a **Keyframe marker**, providing a complete, immutable snapshot of the tree's logical state at a stable intermediate point in the operation.

2.  **The Snapshot Generator (The Director):**
    *   This is a new, pure function that will take the array of `AnimationEvent`s from the data structure.
    *   It iterates through the event array, maintaining a "current" visual state.
    *   When it encounters a regular event (e.g., `ADD_NODE`), it modifies its visual state accordingly.
    *   When it encounters an `UPDATE_LAYOUT` event, it will use the provided `<TreeSnapshot>` to re-calculate all node coordinates using `dagre`.
    *   After processing each event, it pushes a new `AnimationStep` (a full snapshot of the complete visual state) to its output array.
    *   The final output is a single, complete storyboard (`AnimationStep[]`) ready for the UI.

3.  **The UI (The Renderer):**
    *   This layer remains largely unchanged. The new `useBstVisualizerV2` hook will consume the storyboard produced by the Snapshot Generator and feed the `AnimationStep` objects to the existing `BinarySearchTreeVisualizer` component, which renders the visual changes.

### Advantages of this Model

*   **Single Source of Truth:** The animation is guaranteed to reflect the algorithm's actual execution.
*   **Highly Extensible:** Adding new complex operations (like self-balancing) is dramatically simplified.
*   **True Separation of Concerns:**
    *   Data Structure: Knows **what** to animate.
    *   Snapshot Generator: Knows **how** to lay out the animation.
    *   UI: Knows **how to display** the animation.

---

## 3. Incremental Refactoring Plan

We will build the new system in parallel to the existing one.

### Step 1: Create the V2 Data Structure

*   **Action:** Create a new file: `src/lib/ds/bst-v2.ts`.
*   **Goal:** Implement a new `BinarySearchTreeV2` class. Its public methods (`insert`, `delete`) will not return a new tree instance. Instead, they will return a flat array of `AnimationEvent` objects, including the critical `{ type: 'UPDATE_LAYOUT', tree: <TreeSnapshot> }` event for keyframes.

### Step 2: Create the V2 Snapshot Generator

*   **Action:** Create a new file: `src/lib/animation/snapshot-generator.ts`.
*   **Goal:** Implement a `generateAnimationSteps(events: AnimationEvent[])` function. This function will replace the old `bst-animation-producer.ts`. It will be responsible for turning the event stream into a final `AnimationStep[]` storyboard.

### Step 3: Create the V2 UI Hook

*   **Action:** Create a new file: `src/hooks/use-bst-visualizer-v2.ts`.
*   **Goal:** This hook will be the controller for the new system.
*   **Logic:**
    1.  It will hold an instance of `BinarySearchTreeV2`.
    2.  On a user action (e.g., `addNode(5)`), it will call the `BinarySearchTreeV2` method.
    3.  It will pass the resulting `AnimationEvent[]` to the `generateAnimationSteps()` function from Step 2.
    4.  It will then manage the playback of the final `AnimationStep[]` storyboard, exposing the same props to the UI as the original hook.

### Step 4: Create the V2 Entry Point

*   **Action:** Create a new page file: `src/app/v2/page.tsx`.
*   **Goal:** Create a new, separate page to host the V2 implementation.
*   **Logic:**
    *   This page will use the new `useBstVisualizerV2` hook.
    *   It will **reuse** the existing, presentation-only components: `BinarySearchTreeVisualizer` and `Controls`.
    *   A temporary link can be added to the main page (`/`) to navigate to `/v2` for testing.

By following these steps, we can build and validate the new, superior architecture piece by piece, ensuring a stable and successful refactor.
