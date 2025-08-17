# Visual DS Architecture

This document outlines the architectural principles and key design decisions made for the Visual DS application. The primary goal of this architecture is to create a clean separation of concerns, making the application more modular, maintainable, and easier to extend in the future.

## Core Principle: Separation of Concerns

The application is built upon a three-layer architecture that strictly separates the data structure logic, the animation generation logic, and the user interface rendering.

### 1. The Data Structure Layer (The "What")

-   **File:** `src/lib/ds/bst.ts`
-   **Role:** This layer contains the pure `BinarySearchTree` class.
-   **Responsibilities:**
    -   Managing the nodes and their values.
    -   Enforcing the rules of a Binary Search Tree (e.g., insertion, deletion, search logic).
    -   Maintaining the integrity of the tree.
    -   Providing metadata about operations (e.g., `traversalPath`) to assist the animation layer.
-   **Key Characteristics:**
    -   **Purity:** This class has **no knowledge** of anything visual. It does not know about coordinates (x, y), colors, highlights, or animations. It is a pure, reusable data structure implementation.
    -   **Immutability:** Operations like `insert` and `delete` do not modify the existing tree. Instead, they return a *new* instance of the `BinarySearchTree` class representing the state after the operation. This is crucial for React's state management and makes tracking changes predictable.

### 2. The Animation Producer Layer (The "How")

-   **File:** `src/lib/animation/bst-animation-producer.ts`
-   **Role:** This layer acts as a translator between the abstract data structure and the concrete visual representation. It is the most complex part of the architecture.
-   **Responsibilities:**
    -   **Layout Calculation:** It uses the `dagre` library to calculate the `x` and `y` coordinates for each node in the tree, turning the abstract structure into a visual layout.
    -   **Animation Step Generation:** It contains functions (`generateInsertSteps`, `generateDeleteSteps`, etc.) that take a "before" and "after" state of the `BinarySearchTree` and produce a detailed, step-by-step array of `AnimationStep` objects. This is where the logic for visual effects like traversals, fade-ins, and highlights is defined.
-   **Key Characteristics:**
    -   This layer is the bridge between the data and the UI. It encapsulates all the complex logic required to make an algorithm visually understandable. It is responsible for crafting the precise sequence of visual states that create a smooth and intuitive animation.

### 3. The UI & State Management Layer (The "Display")

-   **Files:**
    -   `src/hooks/use-bst-visualizer.ts` (The Controller)
    -   `src/components/visual-ds/binary-search-tree-visualizer.tsx` (The Renderer)
    -   `src/components/visual-ds/controls.tsx` (The Controls)
-   **Role:** This layer is responsible for everything the user sees and interacts with.
-   **Responsibilities:**
    -   **`useBstVisualizer` (Controller):**
        -   Manages the current state of the `BinarySearchTree`.
        -   Orchestrates the workflow: on a user action, it calls the data structure to get the new tree state, passes the before/after states to the `AnimationProducer` to get the steps, and then manages the playback of those steps.
        -   Handles all animation controls (play, pause, step, speed).
    -   **`BinarySearchTreeVisualizer` (Renderer):**
        -   A **pure SVG component**. All elements—nodes (as `<g>` groups containing a `<circle>` and `<text>`), edges (as `<line>`s), and highlights—are rendered within a single `<motion.svg>` canvas.
        -   This unified rendering context eliminates synchronization issues between different rendering technologies (like HTML and SVG).
        -   It uses `framer-motion` to render the visual elements and animate them smoothly between states. It does not contain complex layout logic; it only renders what it's told based on the `AnimationStep` it receives.
        -   All panning and zooming is handled by smoothly animating the SVG's `viewBox` attribute, which guarantees that all child elements transform as a single, cohesive unit.
    -   **`Controls` (Controls):**
        -   Provides the UI for the user to trigger actions and control the animation playback.

## Animation Philosophy

-   **Declarative Snapshots:** The animation is not programmatic in the sense of `node.move(x, y)`. Instead, the `AnimationProducer` generates a series of complete visual "snapshots" (`AnimationStep` objects). Each snapshot is a complete description of the visual state at one moment.
-   **Smooth Transitions by Framer Motion:** The `useBstVisualizer` hook feeds these snapshots one by one to the React components. `framer-motion`, using the `layoutId` prop for nodes and by animating SVG attributes, handles the actual visual animation, smoothly transitioning elements from one snapshot's state to the next.
-   **Consistent Timing:** Auto-play is driven by a single, steady `setInterval` in the `useBstVisualizer` hook. The perceived speed is controlled by changing the interval's delay, which simplifies the animation logic significantly.
-   **State Management:** The `useBstVisualizer` hook acts as the central state machine, consuming the array of `AnimationStep` objects and applying them sequentially to the renderer.
