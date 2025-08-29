# Visual DS - Development & Implementation Details

This document outlines the key architectural principles, implementation details, and specific visual requirements for the Visual DS application.

## Core Principle: Separation of Concerns

The application is built upon a three-layer architecture that strictly separates the data structure logic, the animation generation logic, and the user interface rendering. This is achieved through an "Inversion of Control" (IoC) pattern where the data structure is given an animation "producer" at construction time.

### 1. The Data Structure Layer (The "What")

-   **File:** `src/lib/ds/binary-tree.ts`, `src/lib/ds/binary-search-tree.ts`
-   **Role:** This layer contains the pure data structure classes. The `BinarySearchTree` inherits from a generic `BinaryTree` base class.
-   **Responsibilities:**
    -   Managing the nodes and their values.
    -   Enforcing the rules of the specific data structure (e.g., BST insertion logic).
-   **Key Characteristics:**
    -   **Purity:** This layer has **no knowledge** of anything visual. It does not know about coordinates (x, y), colors, highlights, or animations. It is a pure, reusable data structure implementation.
    -   **Dependency Inversion:** The `BinaryTree`'s constructor accepts an implementation of the `GraphEventSink` interface (our "producer"). During an operation (like `insert`), the algorithm calls methods on this producer (`this.ui.visit(...)`) to describe its actions semantically. This makes the data structure testable and independent of any specific animation logic.

### 2. The Animation Producer Layer (The "How")

-   **File:** `src/lib/animation/graph.ts`
-   **Role:** This layer is the "director" of the animation. It implements the `GraphEventSink` interface.
-   **Responsibilities:**
    -   **Layout Calculation:** The base `BinaryTree` class uses the `dagre` library to calculate the `x` and `y` coordinates for each node in the tree whenever its `updateLayout` method is called.
    -   **Animation Step Generation:** As the data structure algorithm calls the producer's methods, the `GraphAnimationProducer` instance generates and stores a detailed, step-by-step array of `GraphScene` objects (a "storyboard"). It translates semantic calls (`visit`, `highlightNode`, etc.) into visual changes (setting `visitorNodeId`, creating style maps, etc.).
-   **Key Characteristics:**
    -   This layer is the bridge between the data and the UI. It encapsulates all the complex logic required to make an algorithm visually understandable. It is responsible for crafting the precise sequence of visual states that create a smooth and intuitive animation.

### 3. The UI & State Management Layer (The "Display")

-   **Files:**
    -   `src/hooks/use-data-structure-visualizer.ts` (Generic Animation Controller)
    -   `src/hooks/use-binary-tree-visualizer.ts` (Specific Capability Hook)
    -   `src/components/visual-ds/graph-renderer.tsx` (The Renderer)
    -   `src/components/visual-ds/controls.tsx` (The Controls)
-   **Role:** This layer is responsible for everything the user sees and interacts with. It is designed to be flexible and adapt to different data structures.
-   **Responsibilities:**
    -   **`useDataStructureVisualizer` (Generic Hook):** This hook is the core animation engine. It knows nothing about specific algorithms like "insert" or "delete". Its sole responsibility is to manage the state of an animation sequence (an array of `GraphScene`s), handling playback, pausing, stepping, and speed control.
    -   **`useBinaryTreeVisualizer` (Specific Hook):** This hook acts as a "contract" for all binary tree-like structures. It uses the generic `useDataStructureVisualizer` to handle animation playback. Crucially, it also defines and exposes the specific **actions** that a binary tree can perform, such as `addNode`, `removeNode`, `searchNode`, `clearTree`, and `addRandomNodes`.
    -   **Individual Hooks (`useBinarySearchTreeVisualizer`, etc.):** These are very thin wrappers. They instantiate a specific data structure (e.g., `new SplayTree(...)`) and pass it to the `useBinaryTreeVisualizer` hook, which handles all the shared logic.
    -   **`GraphRenderer` (Renderer):** A **pure SVG component**. All elements—nodes (as `<g>` groups containing a `<circle>` and `<text>`), edges (as `<line>`s), and highlights—are rendered within a single `<motion.svg>` canvas. It uses `framer-motion` to animate between the `GraphScene` states it receives. Panning and zooming is handled by smoothly animating the SVG's `viewBox` attribute.
    -   **`Controls` (Dynamic UI):** The controls are now dynamic. They conditionally render buttons based on the functions exposed by the visualizer hook. For example, `{actions.add && <Button>...}`. This allows the UI to automatically adapt to data structures with different capabilities (e.g., a Heap might not have a `search` action).

## Visual Requirements and Animation Sequences

To provide a clear and intuitive visualization, the animation system must adhere to the following sequence for each operation.

### `search(value)`

1.  **Traversal:**
    -   For each node visited, the "visitor" highlight (a dashed circle) must move to that node.
    -   The `action` in the debug view should display `{ "type": "VISIT", "value": <node_value> }`.
2.  **Found:**
    -   If the node is found, its border must change to the accent color and thicken to indicate a highlight.
    -   The `action` should be `{ "type": "HIGHLIGHT_NODE", "reason": "found" }`.
    -   A success toast should appear.
3.  **Not Found:**
    -   If the search completes without finding the node, the visitor highlight disappears.
    -   A "destructive" toast should appear indicating the node was not found.

### `insert(value)`

1.  **Search Phase:**
    -   The animation follows the same traversal steps as the `search` operation.
2.  **Insertion:**
    -   The visitor highlight disappears.
    -   A new node is created (it can start at the position of its parent).
    -   The layout is recalculated.
    -   The `action` is `{ "type": "UPDATE_LAYOUT_NODES" }`. All nodes (including the new one) animate to their new positions.
    -   The `action` becomes `{ "type": "UPDATE_LAYOUT_EDGES" }`. The new edge connecting the parent and child fades in.

### `delete(value)`

1.  **Search Phase:**
    -   Follows the same traversal steps as the `search` operation.
2.  **Deletion Highlight:**
    -   When the target node is found, its border must change to the "destructive" color and thicken.
    -   `action`: `{ "type": "HIGHLIGHT_NODE", "reason": "deletion" }`.
3.  **Handling Successors (if applicable):**
    -   If the node has two children, the visitor highlight moves to find the in-order successor (the leftmost node of the right subtree).
    -   The successor's border is highlighted with the accent color.
    -   `action`: `{ "type": "HIGHLIGHT_NODE", "reason": "successor" }`.
4.  **Re-linking and Removal:**
    -   The node to be deleted is unlinked and replaced in the tree structure by its successor or child. This implementation uses **node replacement**, not value replacement, for a more accurate visualization.
    -   The layout is recalculated without the removed node.
    -   `action`: `{ "type": "UPDATE_LAYOUT_NODES" }`. All nodes animate to their final positions.
    -   `action`: `{ "type": "UPDATE_LAYOUT_EDGES" }`. All edges animate to their final positions.

## Testing Strategy

To ensure code quality and prevent regressions, the project should adopt a comprehensive testing strategy. The recommended tools are **Vitest** for the test runner and **React Testing Library** for component testing.

The testing approach will mirror the application's architecture by testing each layer in isolation:

1.  **Data Structure Unit Tests (Highest Priority):**
    *   **Goal:** Verify the correctness of the algorithms within the `BinarySearchTree` class.
    *   **Method:** Create a mock implementation of the `GraphEventSink` interface. This mock will not produce animations but will simply record the sequence of calls made to it (`visit`, `highlightNode`, etc.).
    *   **Example:** A test for `tree.insert(10)` would assert that the `visit` method was called on the correct nodes in the correct order and that `updateLayout` was called at the end. This allows for testing the core logic completely decoupled from the UI.

2.  **Animation Producer Unit Tests:**
    *   **Goal:** Verify that the `GraphAnimationProducer` correctly translates semantic events into visual `GraphScene` snapshots.
    *   **Method:** Call the producer's methods directly (e.g., `producer.visit(...)`) and then inspect the resulting array of `GraphScene` objects to ensure the `visitorNodeId`, `nodeStyles`, etc., are set as expected.

3.  **UI Component Tests:**
    *   **Goal:** Verify that React components render correctly and respond to user interaction.
    *   **Method:** Use React Testing Library to render components like `Controls` in a simulated environment. Tests will simulate user actions (e.g., clicking the "Add Node" button) and assert that the correct callback functions are invoked with the correct parameters.

## Extensibility and Future Data Structures

The architecture is explicitly designed to be extended with new data structures.

-   **Capability-based UI:** The current hook structure separates the generic animation logic (`useDataStructureVisualizer`) from the specific capabilities of a data structure family (e.g., `useBinaryTreeVisualizer`). To add a new type of data structure (e.g., a Heap), one would create a new `useHeapVisualizer` hook. This hook would use the generic animation player but would expose a different set of actions (e.g., `insert`, `extractMin`). The `Controls` component will automatically adapt, showing only the buttons relevant to the exposed actions.

-   **Inheritance:** New tree-based structures (e.g., `AVLTree`) can inherit from `BinarySearchTree` and `BinaryTree`. This provides them with the complex `getLayout()` logic for free, making them instantly visualizable.

-   **Specialized Node Types:** For structures that require extra information per node (like an AVL Tree's height), a specialized subclass of `BinaryTreeNode` (e.g., `AVLTreeNode`) can be created. The data structure class then overrides the `newNode()` factory method to produce these specialized nodes.