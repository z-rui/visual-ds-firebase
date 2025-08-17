# Visual DS - Development & Implementation Details

This document outlines the key architectural principles, implementation details, and specific visual requirements for the Visual DS application.

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

## Animation Philosophy & Rules

The animation system is designed to be declarative and robust, ensuring a clear and intuitive user experience.

-   **Declarative Snapshots:** The animation is not programmatic in the sense of `node.move(x, y)`. Instead, the `AnimationProducer` generates a series of complete visual "snapshots" (`AnimationStep` objects). Each snapshot is a complete description of the visual state at one moment.
-   **Smooth Transitions by Framer Motion:** The `useBstVisualizer` hook feeds these snapshots one by one to the React components. `framer-motion`, using the `layoutId` prop for nodes and by animating SVG attributes, handles the actual visual animation, smoothly transitioning elements from one snapshot's state to the next.
-   **Consistent Timing:** Auto-play is driven by a single, steady `setInterval` in the `useBstVisualizer` hook. The perceived speed is controlled by changing the interval's delay, which simplifies the animation logic significantly.

### Visual & Behavioral Requirements

#### 1. Layout Rules

-   **Single-Child Node Distinction:** The visual layout must correctly differentiate between a node that has only a left child and a node that has only a right child. The layout algorithm reserves space for a "missing" child to ensure the single existing child is positioned correctly on its respective side. This is implemented using non-rendered "dummy nodes" during the `dagre` layout calculation.

#### 2. General Animation Rules

-   **The "No-Jump" Rule for Edges:** During any animation where nodes are moving, the edges connected to those nodes must move and stretch smoothly along with them. Edge endpoints must remain perfectly snapped to the center of their respective nodes throughout the entire transition.
-   **Deletion Highlight:** Nodes marked for deletion must be highlighted with a visually distinct, "destructive" color (e.g., a red border) to differentiate them from standard highlights.

#### 3. Insertion Animation Sequence
1.  **Search:** A "visitor" highlight traverses the tree from the root to find the correct insertion point.
2.  **Fade In:** The new node and its connecting edge fade into view at the insertion point.
3.  **Update Layout:** The surrounding nodes and edges animate smoothly to their final positions to accommodate the new element.

#### 4. Deletion Animation Sequence (Leaf & Single-Child Cases)
1.  **Search:** A "visitor" highlight traverses the tree to find the target node.
2.  **Highlight for Deletion:** The target node is highlighted with the destructive (red) color.
3.  **Fade Out Parent Edge:** The edge connecting the target node to its parent fades out.
4.  **Fade Out Child Edge (if applicable):** If the target node has one child, the edge connecting them fades out.
5.  **Fade Out Node:** The target node itself fades out.
6.  **Fade In New Edge (if applicable):** In the single-child case, a new edge connecting the child to the target node's parent fades into view.
7.  **Update Layout:** The tree structure animates smoothly to its final layout.

#### 5. Deletion Animation Sequence (Two-Child Case)
This sequence applies when deleting a node with two children, using its in-order successor.

1.  **Search:** A "visitor" highlight traverses the tree to find the target node.
2.  **Highlight for Deletion:** The target node is highlighted with the destructive (red) color.
3.  **Find Successor:** The visitor highlight traverses from the target's right child to find the in-order successor.
4.  **Unlink Successor from Parent:** The edge from the successor to its parent fades out.
5.  **Unlink Successor from Child (if applicable):** If the successor has a right child, the edge to that child fades out.
6.  **Re-wire Successor's Child (if applicable):** If the previous step occurred, a new edge fades in to connect the successor's right child to the successor's original parent.
7.  **Unlink Target's Children:** The edges connecting the original target node to its children fade out.
8.  **Fade Out Node:** The original target node fades out from its position.
9.  **Move Successor:** The successor node animates smoothly from its original position to the position of the target node.
10. **Link Successor to Target's Children:** New edges fade into view, connecting the successor (now in its new position) to the children of the original target node.
11. **Update Layout:** The entire tree animates into its new, final structure.
