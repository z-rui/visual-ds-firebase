# Refactor Plan: A Scalable Animation Storyboard Architecture

This document outlines a new architecture for the animation "Director" — the system responsible for generating animation storyboards. It complements the existing plan for a `useSprings`-based rendering "Engine" by defining a more robust and scalable way to create the animations that the engine will execute.

The core challenge is designing a system that is both powerful enough to create pedagogically clear animations and flexible enough to allow for easy extension with new data structures and operations (e.g., AVL rotations, splaying).

---

## 1. Architectural Goal

To replace the current, rigid "state-diffing" animation producer with a flexible, event-driven model where the data structure itself is the source of truth for its animation.

---

## 2. Alternative Architectures Considered

Here are three models for generating the animation storyboard (`AnimationStep[]`).

### Alternative 1: State-Diffing Director (The "Before & After" Model)

This is the model currently used in the `visual-ds-firebase` prototype.

-   **How it Works:** This is the model currently used in the `visual-ds-firebase` prototype. A "Director" file (`bst-animation-producer.ts`) contains a separate, bespoke algorithm for each data structure operation (e.g., `generateInsertSteps`, `generateDeleteSteps`). Each function knows the specific semantics of its operation and manually constructs a detailed animation storyboard on a case-by-case basis. It uses the `before` and `after` tree states to get the necessary structural and positional data.
-   **Pros:**
    -   Gives the animator/developer complete, fine-grained control over the final look of the animation.
    -   Keeps the core data structure logic completely "pure" and unaware of the visualization layer.
-   **Cons:**
    -   **Extremely Brittle & High Effort:** Adding a new animated operation requires writing a new, complex, and lengthy director function from scratch.
    -   **Poor Cohesion:** The logic for an operation is completely separated from the logic for its animation, making the system hard to reason about and maintain.

### Alternative 2: Simple Event Sourcing (The "Single Chapter" Model)

This was the first model we proposed during our discussion.

-   **How it Works:** The data structure's methods (`insert`, `delete`) are modified to emit a single, flat list of semantic *visual events* as they execute their logic. A "Snapshot Generator" then processes this list, using the `before` and `after` layouts as context, to produce the final storyboard.
-   **Pros:**
    -   **Good Cohesion:** The operational logic and the animation events are generated in the same place, making the code easier to understand.
    -   **More Extensible:** Adding a new operation is simpler than with the state-diffing model.
-   **Cons:**
    -   **Fails on Complex Operations:** As you correctly pointed out, this model cannot handle animations that involve multiple, distinct layout changes (like an AVL double rotation or a multi-step splay). It only has knowledge of the final layout, so it cannot correctly render intermediate tree shapes.

---

## 3. Proposed Architecture: Keyframe Event Sourcing (The "Multi-Chapter" Model)

This is the recommended architecture. It is a more robust version of event sourcing that correctly handles all known use cases, including complex, multi-stage animations.

-   **How it Works:**
    The system is divided into three parts: The Data Structure, the Snapshot Generator, and the Rendering Engine.

    1.  **The Data Structure (Event Source):**
        -   A method like `splay()` or `avlInsert()` will now return a list of **`Keyframes`**.
        -   A `Keyframe` represents a single, stable, intermediate state of the tree. It contains two things:
            1.  `treeState`: A complete, immutable snapshot of the data structure at that point in the operation.
            2.  `events`: A list of semantic visual events (`VISIT`, `MOVE_NODE_TO_POSITION_OF`, `FINALIZE`, etc.) that describe the transition *from the previous keyframe to this one*.

    2.  **The Snapshot Generator (Director):**
        -   This is a new, pure function that takes the initial tree and the list of `Keyframes`.
        -   It iterates through the keyframes, calculating the layout for each `treeState`.
        -   For each keyframe, it processes the associated `events`, using the previous keyframe's layout as the starting point and the current keyframe's layout as the ending point.
        -   The `FINALIZE` event at the end of each keyframe's event list triggers the final animation to the new stable layout.
        -   The output is a single, complete storyboard (`AnimationStep[]`) for the entire operation.

    3.  **The `useSprings` Engine (Renderer):**
        -   This is the component described in the original refactor plan. It consumes the storyboard produced by the Snapshot Generator and executes the visual changes.

-   **Pros:**
    -   **Highly Extensible & Scalable:** It can model any operation, no matter how complex, by breaking it down into a series of stable keyframes.
    -   **Maintains Cohesion:** The data structure remains the source of truth for its own logic and animation steps.
    -   **Separation of Concerns:** The data structure handles *what* to animate (semantic events), the Snapshot Generator handles *how* to animate it (creating the storyboard), and the Engine handles *doing* the animation (rendering).

-   **Cons:**
    -   **Increased Memory Usage:** It requires storing intermediate, immutable copies of the data structure during an operation. This is a standard trade-off for this pattern and is acceptable for the scale of this application.

This "Keyframe" model provides the best balance of flexibility, power, and maintainability, setting a strong foundation for future development.