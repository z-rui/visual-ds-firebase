
# Visual DS - Development & Implementation Details

This document outlines the key architectural principles, implementation details, and specific visual requirements for the Visual DS application.

## Core Principle: Separation of Concerns

The application is built upon a three-layer architecture that strictly separates the data structure logic, the animation generation logic, and the user interface rendering. This is achieved through an "Inversion of Control" (IoC) pattern.

### 1. The Data Structure Layer (The "What")

-   **File:** `src/lib/ds/bst.ts`
-   **Role:** This layer contains the pure `BinarySearchTree` class.
-   **Responsibilities:**
    -   Managing the nodes and their values.
    -   Enforcing the rules of a Binary Search Tree (e.g., insertion, deletion, search logic).
    -   Maintaining the integrity of the tree.
-   **Key Characteristics:**
    -   **Purity:** This class has **no knowledge** of anything visual. It does not know about coordinates (x, y), colors, highlights, or animations. It is a pure, reusable data structure implementation.
    -   **Dependency Inversion:** During an operation, the data structure's methods (e.g., `insert(value, producer)`) accept an implementation of the `AnimationProducer` interface. The algorithm calls methods on this producer (`producer.visitNode(...)`) to describe its actions semantically. This makes the data structure testable and independent of any specific animation logic.

### 2. The Animation Producer Layer (The "How")

-   **File:** `src/lib/animation/snapshot-producer.ts`
-   **Role:** This layer is the "director" of the animation. It implements the `AnimationProducer` interface.
-   **Responsibilities:**
    -   **Layout Calculation:** It uses the `dagre` library to calculate the `x` and `y` coordinates for each node in the tree whenever its `updateLayout` method is called.
    -   **Animation Step Generation:** As the data structure algorithm calls its methods, the `SnapshotProducer` instance generates and stores a detailed, step-by-step array of `AnimationStep` objects (a "storyboard"). It translates semantic calls (`visitNode`, `hideNode`, etc.) into visual changes (setting `visitorNodeId`, creating style maps, etc.).
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
        -   Manages an instance of the `BinarySearchTree`.
        -   Orchestrates the workflow: on a user action, it creates an instance of the `SnapshotProducer`, passes it into the data structure method (e.g., `tree.insert(10, producer)`), and then retrieves the final `AnimationStep[]` storyboard from the producer.
        -   It manages the playback of that storyboard (play, pause, step, speed).
    -   **`BinarySearchTreeVisualizer` (Renderer):**
        -   A **pure SVG component**. All elements—nodes (as `<g>` groups containing a `<circle>` and `<text>`), edges (as `<line>`s), and highlights—are rendered within a single `<motion.svg>` canvas.
        -   This unified rendering context eliminates synchronization issues between different rendering technologies (like HTML and SVG).
        -   It uses `framer-motion` to render the visual elements and animate them between states. It does not contain complex layout logic; it only renders what it's told based on the `AnimationStep` it receives.
        -   All panning and zooming is handled by smoothly animating the SVG's `viewBox` attribute, which guarantees that all child elements transform as a single, cohesive unit.
    -   **`Controls` (Controls):**
        -   Provides the UI for the user to trigger actions and control the animation playback.

## Animation Philosophy & Rules

The animation system is designed to be declarative and robust, ensuring a clear and intuitive user experience.

-   **Declarative Snapshots:** The animation is not programmatic in the sense of `node.move(x, y)`. Instead, the `SnapshotProducer` generates a series of complete visual "snapshots" (`AnimationStep` objects). Each snapshot is a complete description of the visual state at one moment.
-   **Smooth Transitions by Framer Motion:** The `useBstVisualizer` hook feeds these snapshots one by one to the React components. `framer-motion`, using the `layoutId` prop for nodes and by animating SVG attributes, handles the actual visual animation, smoothly transitioning elements from one snapshot's state to the next.
-   **Consistent Timing:** Auto-play is driven by a single, steady `setInterval` in the `useBstVisualizer` hook. The perceived speed is controlled by changing the interval's delay, which simplifies the animation logic significantly.

### Visual & Behavioral Requirements

#### 1. Layout Rules

-   **Single-Child Node Distinction:** The visual layout must correctly differentiate between a node that has only a left child and a node that has only a right child. The layout algorithm reserves space for a "missing" child to ensure the single existing child is positioned correctly on its respective side. This is implemented using non-rendered "dummy nodes" during the `dagre` layout calculation.

#### 2. General Animation Rules

-   **The "No-Jump" Rule for Edges:** During any animation where nodes are moving, the edges connected to those nodes must move and stretch smoothly along with them. Edge endpoints must remain perfectly snapped to the center of their respective nodes throughout the entire transition.
-   **Deletion Highlight:** Nodes marked for deletion must be highlighted with a visually distinct, "destructive" color (e.g., a red border) to differentiate them from standard highlights.

#### 3. Insertion Animation Sequence
1.  **Search:** The `insert` method calls `producer.visitNode()` repeatedly, causing a "visitor" highlight to traverse the tree to the correct insertion point.
2.  **Update Layout:** The method calls `producer.updateLayout()`. The `SnapshotProducer` generates the necessary steps to animate the tree into its new, final structure. During this animation:
    *   The new node fades into view at its final position.
    *   The new edge connecting to the parent fades into view.
    *   All other affected nodes and edges slide smoothly to their final positions.

#### 4. Deletion Animation Sequence (Leaf & Single-Child Cases)
1.  **Search:** The `delete` method calls `producer.visitNode()` to find the target node.
2.  **Highlight for Deletion:** `producer.highlightNode()` is called with a 'deletion' reason.
3.  **Unlink and Hide:** The producer is called to hide the edges and the node, making them fade out simultaneously.
4.  **Update Layout:** `producer.updateLayout()` is called. The tree structure animates smoothly to its final layout, with a new edge connecting the child to the target node's parent fading in if necessary.

#### 5. Deletion Animation Sequence (Two-Child Case)
This sequence applies when deleting a node with two children, using its in-order successor.

1.  **Search:** A "visitor" highlight traverses the tree to find the target node.
2.  **Highlight for Deletion:** The target node is highlighted with the destructive (red) color.
3.  **Find Successor:** The visitor highlight traverses from the target's right child to find the in-order successor. The successor is then highlighted.
4.  **Unlink Successor:** The producer is called to hide the edges connecting the successor to its parent and its own right child (if any).
5.  **Unlink Target:** The producer is called to hide the edges connecting the original target node to its parent and its two children.
6.  **Fade Out Node:** The producer is called to hide the original target node, making it fade out.
7.  **Update Layout:** `producer.updateLayout()` is called. The entire tree animates into its new, final structure. During this animation:
    * The successor node animates smoothly from its original position to the position of the deleted node.
    * New edges fade into view, connecting the successor to the target's original children and the target's original parent.
    * The successor's original right child (if it existed) animates to its new position, connected to the successor's original parent.
