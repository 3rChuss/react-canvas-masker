import * as React from "react";
import { MaskEditor, toMask, type MaskEditorCanvasRef} from 'react-canvas-masker'
//  import { MaskEditor, toMask, type MaskEditorCanvasRef} from '../../src/index'
import 'react-canvas-masker/dist/style.css'
import './App.css'
import MaskEditorProviderExample from "./MaskEditorProviderExample";


function App() {
  const canvas = React.useRef<MaskEditorCanvasRef>(null) as React.RefObject<MaskEditorCanvasRef>;
  const [mask, setMask] = React.useState("");
  const [size, setSize] = React.useState(20);
  const [color, setColor] = React.useState('#c3c3c3');

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
          src="https://firebasestorage.googleapis.com/v0/b/aliz-otp-genai-poc-sandbox-assets/o/b0d9a293-3ce4-4b76-ba27-b945826e881b%2F1751276672390%2Fsample_1.png?alt=media&token=43eb8d0f-5db7-4f83-a1c9-c0f5d20487b8"
          maskColor={color}
          cursorSize={size}
          onCursorSizeChange={setSize}
          canvasRef={canvas}
          maskOpacity={0.5}
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
