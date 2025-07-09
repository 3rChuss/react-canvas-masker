import { MaskEditorProvider, useMaskEditorContext } from "../../src";
import cat from "./assets/images/cat.jpg";

// Canvas and controls as separate components using the context
function MaskEditorCanvas() {
  const {
    canvasRef,
    maskCanvasRef,
    cursorCanvasRef,
    size,
    handleMouseDown,
    handleMouseUp,
  } = useMaskEditorContext();
  return (
    <div style={{ position: "relative", width: size.x, height: size.y }}>
      <canvas
        ref={canvasRef}
        width={size.x}
        height={size.y}
        style={{ position: "absolute", left: 0, top: 0, zIndex: 1 }}
      />
      <canvas
        ref={maskCanvasRef}
        width={size.x}
        height={size.y}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          zIndex: 2,
          pointerEvents: "none",
        }}
      />
      <canvas
        ref={cursorCanvasRef}
        width={size.x}
        height={size.y}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          zIndex: 3,
          pointerEvents: "auto",
        }}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
      />
    </div>
  );
}

function MaskEditorControls() {
  const { undo, redo, clear, historyIndex } = useMaskEditorContext();
  return (
    <div style={{ marginTop: 16 }}>
      <button onClick={undo}>Undo</button>
      <button onClick={redo}>Redo</button>
      <button onClick={clear}>Clear</button>
      <span style={{ marginLeft: 8, color: "#888" }}>
        History: {historyIndex + 1}
      </span>
    </div>
  );
}

export default function MaskEditorProviderExample() {
  return (
    <MaskEditorProvider
      src={cat}
      onDrawingChange={(drawing) => console.log("Drawing:", drawing)}
    >
      <h2>MaskEditorProvider Example</h2>
      <MaskEditorCanvas />
      <MaskEditorControls />
    </MaskEditorProvider>
  );
}
