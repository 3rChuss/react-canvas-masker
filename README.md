# React Mask Editor (Enhanced Fork) (react-masker)

> A modern, flexible React component and hook for image mask editing. This is an improved fork of the original [`react-mask-editor`](https://www.npmjs.com/package/react-mask-editor) with a robust hook-based architecture, better undo/redo, and a more flexible API.

---

## Features

- Draw 1-bit (black/white) masks over any image using a brush tool
- Undo/redo, clear, and customizable brush size, color, opacity, and blend mode
- Use as a component, hook, or with context for advanced scenarios
- Exposes imperative API via ref for integration with your app
- Example app included for local development and testing

---

## Installation

```bash
npm install react-masker
# or

```

---

## Usage (Component)

```tsx
import React from "react";
import { MaskEditor, toMask } from "react-masker";

const MyComponent = () => {
  const canvas = React.useRef(null);
  return (
    <>
      <MaskEditor src="https://placekitten.com/256/256" canvasRef={canvas} />
      <button
        onClick={() => {
          if (canvas.current?.maskCanvas) {
            console.log(toMask(canvas.current.maskCanvas));
          }
        }}
      >
        Get Mask
      </button>
    </>
  );
};
```

### Customization

You can customize the editor using these optional props:

| Prop                 | Description                                                                                         | Default     |
| -------------------- | --------------------------------------------------------------------------------------------------- | ----------- |
| `cursorSize`         | Radius (in pixels) of the brush for editing the mask                                                | `10`        |
| `onCursorSizeChange` | Callback when the user changes the brush size via mousewheel                                        | `undefined` |
| `maskOpacity`        | CSS opacity, decimal between 0 – 1                                                                  | `0.4`       |
| `maskColor`          | Hex color (with or without leading '#')                                                             | `#ffffff`   |
| `maskBlendMode`      | [CSS blending mode](https://developer.mozilla.org/en-US/docs/Web/CSS/blend-mode) for the mask layer | `normal`    |

---

## Advanced Usage

### 1. As a Hook (`useMaskEditor`)

Use the full mask editor logic in your own component:

```tsx
import { useMaskEditor } from "react-masker";

const CustomMaskEditor = () => {
  const {
    canvasRef,
    maskCanvasRef,
    cursorCanvasRef,
    size,
    handleMouseDown,
    handleMouseUp,
    undo,
    redo,
    clear,
  } = useMaskEditor({
    src: "https://placekitten.com/256/256",
    maskColor: "#00ff00",
    onDrawingChange: (drawing) => console.log(drawing),
  });

  return (
    <div>
      <canvas ref={canvasRef} width={size.x} height={size.y} />
      <canvas ref={maskCanvasRef} width={size.x} height={size.y} />
      <canvas
        ref={cursorCanvasRef}
        width={size.x}
        height={size.y}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
      />
      <button onClick={undo}>Undo</button>
      <button onClick={redo}>Redo</button>
      <button onClick={clear}>Clear</button>
    </div>
  );
};
```

### 2. With Context API (`MaskEditorProvider`)

Share editor state across multiple components:

```tsx
import { MaskEditorProvider, useMaskEditorContext } from "react-masker";

const MaskEditorCanvas = () => {
  const {
    canvasRef,
    maskCanvasRef,
    cursorCanvasRef,
    size,
    handleMouseDown,
    handleMouseUp,
  } = useMaskEditorContext();
  return (
    <>
      <canvas ref={canvasRef} width={size.x} height={size.y} />
      <canvas ref={maskCanvasRef} width={size.x} height={size.y} />
      <canvas
        ref={cursorCanvasRef}
        width={size.x}
        height={size.y}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
      />
    </>
  );
};

const MaskEditorControls = () => {
  const { undo, redo, clear } = useMaskEditorContext();
  return (
    <>
      <button onClick={undo}>Undo</button>
      <button onClick={redo}>Redo</button>
      <button onClick={clear}>Clear</button>
    </>
  );
};

const App = () => (
  <MaskEditorProvider
    src="https://placekitten.com/256/256"
    onDrawingChange={() => {}}
  >
    <MaskEditorCanvas />
    <MaskEditorControls />
  </MaskEditorProvider>
);
```

### 3. Ref API

The `MaskEditor` component exposes `undo`, `redo`, `clear`, and `maskCanvas` via its ref:

```tsx
const canvas = React.useRef<MaskEditorCanvasRef>(null);
<MaskEditor src="..." canvasRef={canvas} ... />
<button onClick={() => canvas.current?.undo?.()}>Undo</button>
<button onClick={() => {
  if (canvas.current?.maskCanvas) {
    console.log(toMask(canvas.current.maskCanvas));
  }
}}>Get Mask</button>
```

---

## Example App

This repo includes a full example app for local development and testing.

### Run the Example

1. Install all dependencies in the root:
   ```bash
   npm install
   ```
2. Go to the `example` directory:
   ```bash
   cd example
   npm install
   npm run dev
   ```
3. Open the local URL shown by Vite (e.g. http://localhost:5173) in your browser.

You can edit `example/src/App.tsx` to test the component, hook, and context API directly.

---

## About this fork

- This package is a modern, actively maintained fork of [`react-masker`](https://www.npmjs.com/package/react-masker).
- All business logic is now in a reusable hook (`useMaskEditor`).
- Undo/redo and mask logic are robust and extensible.
- The API is fully documented and ready for npm publishing.
- Example app included for local development and testing.

---

## License

MIT
