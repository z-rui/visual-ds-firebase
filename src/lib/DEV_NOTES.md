# Developer Notes & Lessons Learned

This document captures key insights, known issues, and potential improvements for the Visual DS project. It's intended to help the next developer get up to speed quickly.

## Lessons Learned

1.  **Separation of Concerns is Critical**: The three-layer architecture (Data, Animation Producer, Renderer) is the single most important concept. The data structure (`BinarySearchTree`) is initialized with a dependency that implements the `GraphEventSink` interface (the "producer"). This makes the data structure logic pure and testable, while the `GraphAnimationProducer` class encapsulates all the complex translation logic from semantic events to a visual storyboard.

2.  **Stateful Producer at Construction:** Providing the animation producer during the data structure's construction (`new BinarySearchTree(producer)`) creates a much cleaner public API (`tree.insert(10)`) than passing it into every method call. It correctly models the idea that the tree object is inherently "visualizable" for its entire lifetime.

3.  **Animation is a Series of Snapshots**: Thinking of an animation not as a series of imperative commands (`move`, `fade`), but as an array of declarative "snapshots" (`GraphScene` objects) is a core success of this project. The visualizer hooks (e.g., `useBinarySearchTreeVisualizer`) are the "players" that simply move through these snapshots, and `framer-motion` handles the "tweening" between them.

4.  **A Stable `viewBox` is Essential for SVG Animation**: When animating elements within an SVG, the `viewBox` attribute must provide a stable coordinate system. The successful approach memoizes the `viewBox` calculation based on the node layout and the container size. This ensures the coordinate system remains static throughout an animation sequence, preventing jitter while still allowing for smooth, responsive scaling.

5.  **Specialized Node Subclasses are Key for Extensibility**: For data structures that require extra per-node data (e.g., `height` for AVL trees), creating a subclass of `BinaryTreeNode` is the cleanest approach. The data structure class then overrides the `newNode()` factory method to produce its specialized node type. This avoids polluting the base class with properties it doesn't need.

## Future Improvement Suggestions

1.  **Add Unit Tests**: The project currently lacks automated tests. The top priority for improving code quality is to add a testing framework. The recommended approach is to use **Vitest** and **React Testing Library** to test each layer of the application in isolation (Data Structure, Animation Producer, and UI Components).

2.  **Refine `delete` animation**: The `delete` animation, especially for cases with two children, can be complex. There's an opportunity to add more intermediate steps to make the node replacement process even clearer to the user.

3.  **Implement More Data Structures**: The architecture is now primed for extension. Adding a `Heap` (by extending `BinaryTree`) or a `Red-Black Tree` are excellent next steps.

4.  **AI-Powered Explanations**: To enhance the educational value, a Genkit flow could be created to translate the `action` object of a `GraphScene` into a human-readable explanation (e.g., `{type: "visit", value: 25}` becomes "Searching for 25. Current node value is greater, so moving left.").
