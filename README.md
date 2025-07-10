# react-canvas-masker

> 🖌️ A lightweight, flexible React component and hook for drawing and extracting masks from images using canvas. Perfect for AI workflows, in-browser image editing tools, and selective manipulation.

---

## 🧠 What is `react-canvas-masker`?

`react-canvas-masker` is a modern and actively maintained React library that allows users to **draw freeform masks over images**, extract those masked regions, and integrate with **AI-powered image processing** workflows or any kind of **canvas-based editing tool**.

It’s built as an enhanced fork of [`react-mask-editor`](https://www.npmjs.com/package/react-mask-editor), rewritten with:

- ✅ Hook-based architecture
- 🔁 Undo/redo support
- 🔧 Flexible API
- 🧼 Clean and modern codebase

---

## 🚀 Features

- ✅ Draw 1-bit (black/white) masks over any image using a brush tool
- 🔁 Undo/redo and clear support
- 🎨 Customizable brush: size, color, opacity, blend mode
- 💡 Use as a component, hook, or via React context
- ⚡ Imperative API via `ref`
- 🧪 Local demo/example app included

---

## 📆 Installation

```bash
npm install react-canvas-masker
# or
yarn add react-canvas-masker
```

---

## 👨‍💼 Basic Usage – React Component

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

## ⚙️ Component Props

| Prop                 | Type                           | Required   | Default   | Description                                                                                  |          |           |               |              |              |              |              |             |       |              |         |                |     |          |                                                                                                      |
| -------------------- | ------------------------------ | ---------- | --------- | -------------------------------------------------------------------------------------------- | -------- | --------- | ------------- | ------------ | ------------ | ------------ | ------------ | ----------- | ----- | ------------ | ------- | -------------- | --- | -------- | ---------------------------------------------------------------------------------------------------- |
| `src`                | `string`                       | Yes        | —         | Source URL of the image to edit.                                                             |          |           |               |              |              |              |              |             |       |              |         |                |     |          |                                                                                                      |
| `cursorSize`         | `number`                       | No         | `10`      | Radius (in pixels) of the brush for editing the mask.                                        |          |           |               |              |              |              |              |             |       |              |         |                |     |          |                                                                                                      |
| `onCursorSizeChange` | `(size: number) => void`       | No         | —         | Callback when the user changes the brush size via mouse wheel.                               |          |           |               |              |              |              |              |             |       |              |         |                |     |          |                                                                                                      |
| `maskOpacity`        | `number`                       | No         | `0.4`     | CSS opacity, decimal between 0–1.                                                            |          |           |               |              |              |              |              |             |       |              |         |                |     |          |                                                                                                      |
| `maskColor`          | `string`                       | No         | `#ffffff` | Hex color (with or without leading '#') for the mask.                                        |          |           |               |              |              |              |              |             |       |              |         |                |     |          |                                                                                                      |
| `maskBlendMode`      | \`"normal"                     | "multiply" | "screen"  | "overlay"                                                                                    | "darken" | "lighten" | "color-dodge" | "color-burn" | "hard-light" | "soft-light" | "difference" | "exclusion" | "hue" | "saturation" | "color" | "luminosity"\` | No  | `normal` | [CSS blending mode](https://developer.mozilla.org/en-US/docs/Web/CSS/blend-mode) for the mask layer. |
| `onDrawingChange`    | `(isDrawing: boolean) => void` | Yes        | —         | Called when the user starts or stops drawing.                                                |          |           |               |              |              |              |              |             |       |              |         |                |     |          |                                                                                                      |
| `maxWidth`           | `number`                       | No         | `1240`    | Maximum width for loaded images. Images larger than this will be scaled down automatically.  |          |           |               |              |              |              |              |             |       |              |         |                |     |          |                                                                                                      |
| `maxHeight`          | `number`                       | No         | `1240`    | Maximum height for loaded images. Images larger than this will be scaled down automatically. |          |           |               |              |              |              |              |             |       |              |         |                |     |          |                                                                                                      |
| `onUndoRequest`      | `() => void`                   | No         | —         | Called when the user requests an undo action.                                                |          |           |               |              |              |              |              |             |       |              |         |                |     |          |                                                                                                      |
| `onRedoRequest`      | `() => void`                   | No         | —         | Called when the user requests a redo action.                                                 |          |           |               |              |              |              |              |             |       |              |         |                |     |          |                                                                                                      |
| `onMaskChange`       | `(mask: string) => void`       | No         | —         | Called with the current mask (as a dataURL) when the mask changes. Debounced while drawing.  |          |           |               |              |              |              |              |             |       |              |         |                |     |          |                                                                                                      |

---

## 🧩 Ref API (`MaskEditorCanvasRef`)

The `MaskEditor` component exposes useful methods via `ref`:

| Name         | Type                | Description                       |                          |
| ------------ | ------------------- | --------------------------------- | ------------------------ |
| `maskCanvas` | \`HTMLCanvasElement | null\`                            | The mask canvas element. |
| `undo()`     | `() => void`        | Undo the last mask change.        |                          |
| `redo()`     | `() => void`        | Redo the last undone mask change. |                          |
| `clear()`    | `() => void`        | Clear the mask.                   |                          |

---

## 🧪 Advanced Usage

### Using the `useMaskEditor` hook

You can manage the full mask editing flow yourself:

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
    maxWidth: 1024, // Optional: limit image width
    maxHeight: 1024, // Optional: limit image height
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

### Using `MaskEditorProvider` context

Ideal if you want to split canvas and controls across components:

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
    maxWidth={1024} // Optional: limit image width
    maxHeight={1024} // Optional: limit image height
    onDrawingChange={() => {}}
  >
    <MaskEditorCanvas />
    <MaskEditorControls />
  </MaskEditorProvider>
);
```

---

## 💡 Use Cases

`react-canvas-masker` is great for:

- ✨ **AI image editing apps** (e.g. Stable Diffusion, DALL·E, Sora, etc.)
- 🔧 **Web-based design tools** (like Figma clones or mockup tools)
- 📍 **Educational tools** where users interact with images
- 🔮 **Selective filtering or redacting images** (blur, crop, etc.)
- 🚀 **Creative playgrounds** or generative UIs

---

## 📜 Notes

- All mask operations are done on a separate canvas for performance
- The mask is returned as a **black-and-white PNG (base64)**
- Supports up to 50 undo/redo steps
- Forked and modernized from [`react-mask-editor`](https://www.npmjs.com/package/react-mask-editor)

---

## 📖 License

MIT

---

## 🙌 About This Fork

This is a cleaned-up and improved version of an unmaintained package, refactored into a hook-first, React 18+ friendly library with a focus on AI tooling and performance.
