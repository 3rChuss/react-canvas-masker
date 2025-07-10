import * as React from "react";
import { MaskEditor, toMask, type MaskEditorCanvasRef} from '../../src/index'
import './App.css'
import MaskEditorProviderExample from "./MaskEditorProviderExample";


function App() {
  const canvas = React.useRef<MaskEditorCanvasRef>(null) as React.RefObject<MaskEditorCanvasRef>;
  const [mask, setMask] = React.useState("");
  const [size, setSize] = React.useState(10);
  const [color, setColor] = React.useState("#13cf4c");

  console.log("Mask:", mask);

  return (
    <>
      <div style={{ padding: 32 }}>
        <h2>Test MaskEditor (standalone usage)</h2>
        <div style={{ display: "flex", gap: 24, alignItems: "center", marginBottom: 16 }}>
          <label>
            Mask Color:
            <input
              type="color"
              value={color}
              onChange={e => setColor(e.target.value)}
              style={{ marginLeft: 8 }}
            />
          </label>
          <label>
            Cursor Size:
            <input
              type="range"
              min={1}
              max={100}
              value={size}
              onChange={e => setSize(Number(e.target.value))}
              style={{ marginLeft: 8 }}
            />
            <span style={{ marginLeft: 8 }}>{size}px</span>
          </label>
        </div>
        <MaskEditor
          key={"mask-editor"}
          src='https://images.unsplash.com/photo-1746311372686-e164b0bcb333?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
          maskColor={color}
          cursorSize={size}
          maxHeight={ 600 }
          maxWidth={ 600 }
          crossOrigin="anonymous"
          onCursorSizeChange={setSize}
          canvasRef={canvas}
          onDrawingChange={console.log}
          onUndoRequest={() => console.log("Undo requested")}
          onRedoRequest={() => console.log("Redo requested")}
          onMaskChange={setMask}
        />
        <div style={{ marginTop: 16 }}>
          <button
            onClick={() => {
              if (canvas.current?.maskCanvas) {
                setMask(toMask(canvas.current.maskCanvas));
              }
            }}
          >
            Extract Mask
          </button>
          <button onClick={() => canvas.current?.undo?.()}>Undo</button>
          <button onClick={() => canvas.current?.redo?.()}>Redo</button>
          <button onClick={() => canvas.current?.clear?.()}>Clear</button>
        </div>
        <div style={{ marginTop: 16 }}>
          <img
            src={mask}
            alt="mask preview"
            style={{ border: "1px solid #ccc" }}
          />
        </div>
      </div>
      <div style={{ padding: 32, }}>
        <MaskEditorProviderExample />
      </div>
    </>
  );
}

export default App
