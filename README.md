# React Mask Editor

> A modern, flexible React component and hook for image mask editing. This is an enhanced fork of the original [`react-mask-editor`](https://www.npmjs.com/package/react-mask-editor) with a robust hook-based architecture, improved undo/redo, and a more flexible API.

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
npm install react-canvas-masker
# or

```

---

## Usage

### Basic Example

```tsx
import React from "react";
import { MaskEditor, toMask } from "react-canvas-masker";

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

---

## Props

| Prop                 | Type                                                                                                                                                                                                                           | Required | Default   | Description                                                                                          |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- | --------- | ---------------------------------------------------------------------------------------------------- |
| `src`                | `string`                                                                                                                                                                                                                       | Yes      | —         | Source URL of the image to edit.                                                                     |
| `cursorSize`         | `number`                                                                                                                                                                                                                       | No       | `10`      | Radius (in pixels) of the brush for editing the mask.                                                |
| `onCursorSizeChange` | `(size: number) => void`                                                                                                                                                                                                       | No       | —         | Callback when the user changes the brush size via mouse wheel.                                       |
| `maskOpacity`        | `number`                                                                                                                                                                                                                       | No       | `0.4`     | CSS opacity, decimal between 0–1.                                                                    |
| `maskColor`          | `string`                                                                                                                                                                                                                       | No       | `#ffffff` | Hex color (with or without leading '#') for the mask.                                                |
| `maskBlendMode`      | `"normal" \| "multiply" \| "screen" \| "overlay" \| "darken" \| "lighten" \| "color-dodge" \| "color-burn" \| "hard-light" \| "soft-light" \| "difference" \| "exclusion" \| "hue" \| "saturation" \| "color" \| "luminosity"` | No       | `normal`  | [CSS blending mode](https://developer.mozilla.org/en-US/docs/Web/CSS/blend-mode) for the mask layer. |
| `onDrawingChange`    | `(isDrawing: boolean) => void`                                                                                                                                                                                                 | Yes      | —         | Called when the user starts or stops drawing.                                                        |
| `onUndoRequest`      | `() => void`                                                                                                                                                                                                                   | No       | —         | Called when the user requests an undo action.                                                        |
| `onRedoRequest`      | `() => void`                                                                                                                                                                                                                   | No       | —         | Called when the user requests a redo action.                                                         |
| `onMaskChange`       | `(mask: string) => void`                                                                                                                                                                                                       | No       | —         | Called with the current mask (as a dataURL) when the mask changes. Debounced while drawing.          |

---

## Events & Methods

### Ref API (`MaskEditorCanvasRef`)

The `MaskEditor` component exposes the following methods and properties via its `ref`:

| Name         | Type                        | Description                       |
| ------------ | --------------------------- | --------------------------------- |
| `maskCanvas` | `HTMLCanvasElement \| null` | The mask canvas element.          |
| `undo()`     | `() => void`                | Undo the last mask change.        |
| `redo()`     | `() => void`                | Redo the last undone mask change. |
| `clear()`    | `() => void`                | Clear the mask.                   |

---

## Advanced Usage

### 1. As a Hook (`useMaskEditor`)

Use the full mask editor logic in your own component:

```tsx
import { useMaskEditor } from "react-canvas-masker";

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
import { MaskEditorProvider, useMaskEditorContext } from "react-canvas-masker";

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

---

## Notes

- All mask operations are performed on a separate canvas for performance.
- The mask is returned as a PNG dataURL (black/white).
- The editor supports up to 50 undo/redo steps.
- The package is a modern, actively maintained fork of [`react-mask-editor`](https://www.npmjs.com/package/react-mask-editor).

---

## License

MIT

## About this fork
