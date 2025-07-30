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
- 🔍 Zoom and pan capabilities for precise mask editing
- 🖱️ Intuitive controls: mouse wheel zoom, space+drag panning
- 📦 Use as a component, hook, or via React context
- ⚡ Imperative API via `ref`
- 📱 Responsive design that adapts to container size
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
import React from 'react';
import { MaskEditor, toMask } from 'react-canvas-masker';

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

| Prop                 | Type                             | Required   | Default   | Description                                                                                  |          |           |               |              |              |              |              |             |       |              |         |                |     |          |                                                                                                      |
| -------------------- | -------------------------------- | ---------- | --------- | -------------------------------------------------------------------------------------------- | -------- | --------- | ------------- | ------------ | ------------ | ------------ | ------------ | ----------- | ----- | ------------ | ------- | -------------- | --- | -------- | ---------------------------------------------------------------------------------------------------- |
| `src`                | `string`                         | Yes        | —         | Source URL of the image to edit.                                                             |          |           |               |              |              |              |              |             |       |              |         |                |     |          |                                                                                                      |
| `cursorSize`         | `number`                         | No         | `10`      | Radius (in pixels) of the brush for editing the mask.                                        |          |           |               |              |              |              |              |             |       |              |         |                |     |          |                                                                                                      |
| `onCursorSizeChange` | `(size: number) => void`         | No         | —         | Callback when the user changes the brush size via mouse wheel.                               |          |           |               |              |              |              |              |             |       |              |         |                |     |          |                                                                                                      |
| `maskOpacity`        | `number`                         | No         | `0.4`     | CSS opacity, decimal between 0–1.                                                            |          |           |               |              |              |              |              |             |       |              |         |                |     |          |                                                                                                      |
| `maskColor`          | `string`                         | No         | `#ffffff` | Hex color (with or without leading '#') for the mask.                                        |          |           |               |              |              |              |              |             |       |              |         |                |     |          |                                                                                                      |
| `maskBlendMode`      | \`"normal"                       | "multiply" | "screen"  | "overlay"                                                                                    | "darken" | "lighten" | "color-dodge" | "color-burn" | "hard-light" | "soft-light" | "difference" | "exclusion" | "hue" | "saturation" | "color" | "luminosity"\` | No  | `normal` | [CSS blending mode](https://developer.mozilla.org/en-US/docs/Web/CSS/blend-mode) for the mask layer. |
| `onDrawingChange`    | `(isDrawing: boolean) => void`   | Yes        | —         | Called when the user starts or stops drawing.                                                |          |           |               |              |              |              |              |             |       |              |         |                |     |          |                                                                                                      |
| `maxWidth`           | `number`                         | No         | `1240`    | Maximum width for loaded images. Images larger than this will be scaled down automatically.  |          |           |               |              |              |              |              |             |       |              |         |                |     |          |                                                                                                      |
| `maxHeight`          | `number`                         | No         | `1240`    | Maximum height for loaded images. Images larger than this will be scaled down automatically. |          |           |               |              |              |              |              |             |       |              |         |                |     |          |                                                                                                      |
| `crossOrigin`        | `string`                         | No         | —         | Value for the `crossOrigin` attribute on the underlying `<img>`. Useful for CORS images.     |          |           |               |              |              |              |              |             |       |              |         |                |     |          |                                                                                                      |
| `onUndoRequest`      | `() => void`                     | No         | —         | Called when the user requests an undo action.                                                |          |           |               |              |              |              |              |             |       |              |         |                |     |          |                                                                                                      |
| `onRedoRequest`      | `() => void`                     | No         | —         | Called when the user requests a redo action.                                                 |          |           |               |              |              |              |              |             |       |              |         |                |     |          |                                                                                                      |
| `onMaskChange`       | `(mask: string) => void`         | No         | —         | Called with the current mask (as a dataURL) when the mask changes. Debounced while drawing.  |          |           |               |              |              |              |              |             |       |              |         |                |     |          |                                                                                                      |
| `scale`              | `number`                         | No         | `1`       | Initial zoom scale for the image editor.                                                     |          |           |               |              |              |              |              |             |       |              |         |                |     |          |                                                                                                      |
| `minScale`           | `number`                         | No         | `0.8`     | Minimum allowed zoom scale.                                                                  |          |           |               |              |              |              |              |             |       |              |         |                |     |          |                                                                                                      |
| `maxScale`           | `number`                         | No         | `4`       | Maximum allowed zoom scale.                                                                  |          |           |               |              |              |              |              |             |       |              |         |                |     |          |                                                                                                      |
| `onScaleChange`      | `(scale: number) => void`        | No         | —         | Callback when the zoom scale changes.                                                        |          |           |               |              |              |              |              |             |       |              |         |                |     |          |                                                                                                      |
| `enableWheelZoom`    | `boolean`                        | No         | `true`    | Enable/disable zooming with the mouse wheel.                                                 |          |           |               |              |              |              |              |             |       |              |         |                |     |          |                                                                                                      |
| `onPanChange`        | `(x: number, y: number) => void` | No         | —         | Callback when the pan position changes.                                                      |          |           |               |              |              |              |              |             |       |              |         |                |     |          |                                                                                                      |
| `constrainPan`       | `boolean`                        | No         | `true`    | Enable/disable constraints that keep the image in view while panning.                        |          |           |               |              |              |              |              |             |       |              |         |                |     |          |                                                                                                      |

---

## 🧩 Ref API (`MaskEditorCanvasRef`)

The `MaskEditor` component exposes useful methods via `ref`:

| Name          | Type                             | Description                                       |                          |
| ------------- | -------------------------------- | ------------------------------------------------- | ------------------------ |
| `maskCanvas`  | \`HTMLCanvasElement              | null\`                                            | The mask canvas element. |
| `undo()`      | `() => void`                     | Undo the last mask change.                        |                          |
| `redo()`      | `() => void`                     | Redo the last undone mask change.                 |                          |
| `clear()`     | `() => void`                     | Clear the mask.                                   |                          |
| `resetZoom()` | `() => void`                     | Reset zoom to initial scale and center the image. |                          |
| `setPan()`    | `(x: number, y: number) => void` | Set the pan position manually.                    |                          |

---

## 🧪 Advanced Usage

### Using the `useMaskEditor` hook

You can manage the full mask editing flow yourself:

```tsx
import { useMaskEditor } from 'react-canvas-masker';

const CustomMaskEditor = () => {
  const {
    canvasRef,
    maskCanvasRef,
    cursorCanvasRef,
    containerRef, // Container reference for zoom/pan
    size,
    scale, // Current zoom scale
    transform, // Current transform state with scale and translation
    handleMouseDown,
    handleMouseUp,
    undo,
    redo,
    clear,
    resetZoom, // Reset zoom and center the image
    setPan, // Set pan position manually
    isPanning, // Boolean indicating if currently panning
  } = useMaskEditor({
    src: 'https://placekitten.com/256/256',
    maskColor: '#00ff00',
    maxWidth: 1024, // Optional: limit image width
    maxHeight: 1024, // Optional: limit image height
    crossOrigin: 'anonymous', // Optional: set crossOrigin for CORS
    onDrawingChange: (drawing) => console.log(drawing),
    // Zoom and pan options
    scale: 1, // Initial scale
    minScale: 0.5, // Minimum zoom allowed
    maxScale: 5, // Maximum zoom allowed
    enableWheelZoom: true, // Enable mouse wheel zoom
    constrainPan: true, // Keep image in view while panning
    onScaleChange: (newScale) => console.log(`Zoom level: ${newScale}`),
    onPanChange: (x, y) => console.log(`Pan position: ${x}, ${y}`),
  });

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '500px', position: 'relative' }}
    >
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${transform.scale}) translate(${transform.translateX}px, ${transform.translateY}px)`,
          transition: isPanning ? 'none' : 'transform 0.15s ease-out',
        }}
      >
        <canvas ref={canvasRef} width={size.x} height={size.y} />
        <canvas ref={maskCanvasRef} width={size.x} height={size.y} />
        <canvas
          ref={cursorCanvasRef}
          width={size.x}
          height={size.y}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
        />
      </div>
      <div className="controls">
        <button onClick={undo}>Undo</button>
        <button onClick={redo}>Redo</button>
        <button onClick={clear}>Clear</button>
        <button onClick={resetZoom}>Reset Zoom</button>
        <button onClick={() => setPan(0, 0)}>Center Image</button>
      </div>
    </div>
  );
};
```

### Using `MaskEditorProvider` context

Ideal if you want to split canvas and controls across components:

```tsx
import { MaskEditorProvider, useMaskEditorContext } from 'react-canvas-masker';

const MaskEditorCanvas = () => {
  const {
    canvasRef,
    maskCanvasRef,
    cursorCanvasRef,
    containerRef,
    size,
    transform,
    isPanning,
    handleMouseDown,
    handleMouseUp,
  } = useMaskEditorContext();

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '500px', position: 'relative' }}
    >
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${transform.scale}) translate(${transform.translateX}px, ${transform.translateY}px)`,
          transition: isPanning ? 'none' : 'transform 0.15s ease-out',
        }}
      >
        <canvas ref={canvasRef} width={size.x} height={size.y} />
        <canvas ref={maskCanvasRef} width={size.x} height={size.y} />
        <canvas
          ref={cursorCanvasRef}
          width={size.x}
          height={size.y}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
        />
      </div>
    </div>
  );
};

const MaskEditorControls = () => {
  const { undo, redo, clear, resetZoom, setPan, scale } =
    useMaskEditorContext();

  return (
    <div className="controls">
      <button onClick={undo}>Undo</button>
      <button onClick={redo}>Redo</button>
      <button onClick={clear}>Clear</button>
      <button onClick={resetZoom}>Reset Zoom</button>
      <button onClick={() => setPan(0, 0)}>Center Image</button>
      <div>Current Zoom: {Math.round(scale * 100)}%</div>
    </div>
  );
};

const App = () => (
  <MaskEditorProvider
    src="https://placekitten.com/256/256"
    maxWidth={1024} // Optional: limit image width
    maxHeight={1024} // Optional: limit image height
    crossOrigin="anonymous" // Optional: set crossOrigin for CORS
    onDrawingChange={() => {}}
    // Zoom and pan options
    scale={1}
    minScale={0.5}
    maxScale={5}
    enableWheelZoom={true}
    constrainPan={true}
    onScaleChange={(scale) => console.log(`Zoom: ${scale}`)}
    onPanChange={(x, y) => console.log(`Pan: ${x}, ${y}`)}
  >
    <MaskEditorCanvas />
    <MaskEditorControls />
  </MaskEditorProvider>
);
```

---

## � Zoom and Pan Features

The editor includes sophisticated zoom and pan capabilities to enable precise mask editing:

### User Interactions

- **Zoom**: Use `Ctrl/Cmd + Mouse Wheel` to zoom in/out centered on cursor position
- **Pan**: Hold `Space` and drag to pan the image, or use middle mouse button
- **Resize Brush**: Use `Mouse Wheel` (without modifier keys) to adjust brush size

### Automatic Behaviors

- **Responsive Scaling**: Images automatically scale to fit their container
- **Smooth Transitions**: Gentle animations when zooming (disabled during active panning)
- **Position Constraints**: Optional boundaries prevent the image from being panned too far out of view
- **Centered Reset**: `resetZoom()` function centers the image and resets scale to 1

### Programmatic Control

```tsx
// Example of programmatically controlling zoom and pan
const CustomZoomControls = () => {
  const maskEditorRef = React.useRef(null);

  const zoomIn = () => {
    // Get current scale from your state management or context
    const currentScale = 1.5; // Example value
    // Set new scale via your state management
    // ...
  };

  return (
    <>
      <button onClick={() => maskEditorRef.current?.resetZoom()}>
        Reset Zoom & Center
      </button>
      <button onClick={() => maskEditorRef.current?.setPan(50, 20)}>
        Move to Position
      </button>
    </>
  );
};
```

---

## �💡 Use Cases

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

This is a cleaned-up and improved version of an unmaintained package, refactored into a hook-first, React 18+ friendly library with a focus on AI tooling and performance. Key enhancements include:

- Advanced zoom and pan capabilities for precise editing
- Optimized event handling and rendering
- Responsive design that adapts to container dimensions
- Improved coordinate calculations for pixel-perfect precision
- Enhanced user controls with intuitive keyboard and mouse interactions
