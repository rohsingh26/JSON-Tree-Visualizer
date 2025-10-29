# JSON Tree Visualizer

This is a React-based web application that allows users to visualize JSON data in a tree structure.
It provides features like search by JSON path, light/dark mode toggle, and an interactive draggable view.

Deployed link: https://json-tree-visualizer-ten.vercel.app/

## Features

* Visualize JSON data as a connected tree structure
* Search JSON nodes by JSON path (for example: `$.user.name` or `items[0].id`)
* Highlight and center matching nodes when searched
* Light/Dark theme toggle button
* Draggable and pannable tree view


## Installation

Follow the steps below to run the project locally.

### 1. Clone the repository

```bash
git clone https://github.com/rohsingh26/JSON-Tree-Visualizer.git
```

### 2. Go to the project directory

```bash
cd JSON-Tree-Visualizer
```

### 3. Install dependencies

```bash
npm install
```

### 4. Run the app

```bash
npm run dev
```

The app will start on `http://localhost:5173`.


## Dependencies

* react
* react-dom
* @xyflow/react
* vite
* sass
