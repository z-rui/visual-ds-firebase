# Visual DS - A Data Structure Visualizer

Visual DS is an interactive web application designed to help users visualize the operations of complex data structures and algorithms. It provides a clear, animated, step-by-step view of how data structures like Binary Search Trees are manipulated.

This project is built with a modern web stack and a clean architecture to promote maintainability and extensibility.

## Tech Stack

*   **Framework**: [Next.js](https://nextjs.org/) (with App Router)
*   **Language**: [TypeScript](https://www.typescriptlang.org/)
*   **UI**: [React](https://reactjs.org/)
*   **Component Library**: [shadcn/ui](https://ui.shadcn.com/) - for unstyled, accessible UI primitives.
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
*   **Animation**: [Framer Motion](https://www.framer.com/motion/)
*   **Layout Calculation**: [dagre](https://github.com/dagrejs/dagre) - for calculating node positions in the tree layout.
*   **AI/Generative Features**: [Firebase Genkit](https://firebase.google.com/docs/genkit)
*   **Testing**: The project is architected to be highly testable, with a plan to use **Vitest** and **React Testing Library** for unit and component tests.

## Architecture Overview

The application is built on a clean, three-layer architecture that separates the core logic of the data structure from its visual representation and animation. This separation of concerns is critical for managing complexity and allowing the application to be extended with new data structures in the future.

1.  **The Data Structure Layer (The "What")**
    *   **Location**: `src/lib/ds/`
    *   **Role**: Contains the pure data structure class (e.g., `BinarySearchTree`). It is responsible for managing the data and enforcing algorithmic rules. The class is initialized with a "producer" object that implements the `GraphEventSink` interface. During an operation (e.g., `insert`), the algorithm calls methods on this producer to describe its actions.
    *   **Key Characteristic**: This layer has **no knowledge** of anything visual. It only knows about a semantic interface (`GraphEventSink`) which it uses to announce its actions.

2.  **The Animation Producer Layer (The "How")**
    *   **Location**: `src/lib/animation/graph.ts`
    *   **Role**: Implements the `GraphEventSink` interface. The `useBinarySearchTreeVisualizer` hook creates an instance of the `GraphAnimationProducer` and passes it to the `BinarySearchTree`'s constructor. As the algorithm calls the producer's methods (`visit`, `updateLayout`, etc.), the producer generates and accumulates a step-by-step sequence of "snapshots" (`GraphScene` objects) that describe how the visualization should look at each moment.

3.  **The UI & State Management Layer (The "Display")**
    *   **Location**: `src/components/visual-ds/`, `src/hooks/`
    *   **Role**: This layer is responsible for everything the user sees and interacts with. It consumes the animation steps produced by the layer above and uses `framer-motion` to render and animate the SVG components. It also includes the user controls for manipulating the data structure.

For more detailed information on the implementation and specific animation requirements, see `src/lib/DEVELOPMENT.md`.
