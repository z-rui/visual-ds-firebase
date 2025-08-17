# **App Name**: Visual DS

## Core Features:

- Binary Search Tree Visualization: Display a binary search tree in an intuitive graphical format.
- Interactive Controls: Enable users to interact with the binary search tree, like adding nodes, deleting nodes, searching etc.
- Layer Separation: Separate the representation layer and the data structure logic layer.
- Layer Decoupling: Decouple the representation layer and the data structure logic layer as much as possible, avoiding quick hacks or code smells, and making the framework as generic as possible.
- Generic Representation Layer: Make the representation layer generic, without knowing data-structure-specific operations, and expose an interface to the data structure layer with basic atomic operations such as node/edge insertion/deletion/movement. It should support representing binary trees initially, but with future extensibility to adapt to other data structures.
- Pure Data Structure Logic: The data structure layer should look like pure operations on data structures, without knowing the details of the representation; specifically, it should not control the timing of the animation - the representation layer is responsible for this.
- Visitor Highlight: Implement a 'visitor' feature which is a highlighted circle that shows the current node being visited during a data structure operation.

## Style Guidelines:

- Primary color: Medium blue (#6495ED) to suggest reliability and order.
- Background color: Very light blue (#F0F8FF).
- Accent color: Purple-blue (#4682B4) for interactive elements and highlights.
- Body and headline font: 'Inter', a grotesque-style sans-serif.
- Use clear, simple icons for interactive elements to maintain clarity and ease of use.
- Use a clean, structured layout with clear divisions between data structure display, controls, and informational elements.
- Use subtle animations to illustrate data structure changes, making transitions smooth and easy to follow.