# Visual DS - Development & Implementation Details

This document outlines the key architectural principles, implementation details, and specific visual requirements for the Visual DS application.

## Core Principle: Separation of Concerns

The application is built upon a three-layer architecture that strictly separates the data structure logic, the animation generation logic, and the user interface rendering. This is achieved through an "Inversion of Control" (IoC) pattern where the data structure is given an animation "producer" at construction time.

### 1. The Data Structure Layer (The "What")

-   **Files:** `src/lib/ds/*`
-   **Role:** This layer contains the pure data structure classes (e.g., `BinarySearchTree`, `SplayTree`, `Heap`).
-   **Responsibilities:**
    -   Managing the internal state of the data (e.g., tree nodes, heap array).
    -   Enforcing the rules of the specific data structure (e.g., BST insertion logic, heap property).
-   **Key Characteristics:**
    -   **Purity:** This layer has **no knowledge** of anything visual. It does not know about coordinates (x, y), colors, highlights, or animations. It is a pure, reusable data structure implementation.
    -   **Dependency Inversion:** The constructor accepts an implementation of the `GraphEventSink` interface (our "producer"). During an operation (like `insert`), the algorithm calls methods on this producer (`this.ui.visit(...)`) to describe its actions semantically. This makes the data structure testable and independent of any specific animation logic.

### 2. The Animation Producer Layer (The "How")

-   **File:** `src/lib/animation/graph.ts`
-   **Role:** This layer is the "director" of the animation. It implements the `GraphEventSink` interface.
-   **Responsibilities:**
    -   **Layout Calculation:** The data structure classes use the `dagre` library to calculate the `x` and `y` coordinates for each node in the tree whenever `updateLayout` is called.
    -   **Animation Step Generation:** As the data structure algorithm calls the producer's methods, the `GraphAnimationProducer` instance generates and stores a detailed, step-by-step array of `GraphScene` objects (a "storyboard"). It translates semantic calls (`visit`, `highlightNode`, etc.) into visual changes (setting `visitorNodeId`, creating style maps, etc.).
-   **Key Characteristics:**
    -   This layer is the bridge between the data and the UI. It encapsulates all the complex logic required to make an algorithm visually understandable. It is responsible for crafting the precise sequence of visual states that create a smooth and intuitive animation.

### 3. The UI & State Management Layer (The "Display")

-   **Files:**
    -   `src/hooks/use-data-structure-visualizer.ts` (Generic Animation Controller)
    -   `src/hooks/use-binary-tree-visualizer.ts` (Capability Hook for Trees)
    -   `src/hooks/use-heap-visualizer.ts` (Capability Hook for Heaps)
    -   `src/components/visual-ds/graph-renderer.tsx` (The Renderer)
    -   `src/components/visual-ds/controls.tsx` (The Controls)
-   **Role:** This layer is responsible for everything the user sees and interacts with. It is designed to be flexible and adapt to different data structures.
-   **Responsibilities:**
    -   **`useDataStructureVisualizer` (Generic Hook):** This hook is the core animation engine. It knows nothing about specific algorithms like "insert" or "delete". Its sole responsibility is to manage the state of an animation sequence (an array of `GraphScene`s), handling playback, pausing, stepping, and speed control.
    -   **Capability Hooks (`useBinaryTreeVisualizer`, `useHeapVisualizer`):** These hooks act as a "contract" for a family of data structures. They use the generic `useDataStructureVisualizer` to handle animation playback. Crucially, they also define and expose the specific **actions** that their data structure can perform. For example, `useBinaryTreeVisualizer` exposes `add`, `remove`, and `search`, while `useHeapVisualizer` exposes `add` and `extractMin`.
    -   **Individual Hooks (`useBinarySearchTreeVisualizer`, etc.):** These are very thin wrappers. They instantiate a specific data structure (e.g., `new SplayTree(...)`) and pass it to the appropriate capability hook (e.g., `useBinaryTreeVisualizer`), which handles all the shared logic.
    -   **`GraphRenderer` (Renderer):** A **pure SVG component**. All elements—nodes (as `<g>` groups containing a `<circle>` and `<text>`), edges (as `<line>`s), and highlights—are rendered within a single `<motion.svg>` canvas. It uses `framer-motion` to animate between the `GraphScene` states it receives. Panning and zooming is handled by smoothly animating the SVG's `viewBox` attribute.
    -   **`Controls` (Dynamic UI):** The controls are now dynamic. They conditionally render buttons based on the functions exposed by the visualizer hook. For example, `{actions.add && <Button>...}`. This allows the UI to automatically adapt to data structures with different capabilities.

## Extensibility: Adding New Data Structures

The architecture is explicitly designed to be extended. Adding a new data structure (e.g., an AVL Tree or a Red-Black Tree) follows this pattern:

1.  **Create the Data Structure Class:** Implement the class in `src/lib/ds/`. If it's a tree, it can inherit from `BinaryTree` to get the layout logic for free. It must accept a `GraphEventSink` in its constructor and use it to report its actions.
2.  **Create a Capability Hook:** In `src/hooks/`, create a new `useMyNewDSVisualizer` hook.
    -   This hook will instantiate your new data structure.
    -   It will use the generic `useDataStructureVisualizer` to manage animation playback.
    -   It will expose an `actions` object with functions that call your data structure's methods (e.g., `actions: { myAction: () => ds.myAction() }`).
3.  **Integrate into the UI:** In `src/app/page.tsx`, add the new data structure to the dropdown and add a case to call your new hook. The `Controls` component will automatically display the correct buttons for the actions you exposed.
