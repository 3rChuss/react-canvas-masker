import * as React from "react";
import { MaskEditor, toMask, type MaskEditorCanvasRef} from '../../src/index'
import './App.css'
import cat from './assets/images/cat.jpg'
import MaskEditorProviderExample from "./MaskEditorProviderExample";

function App() {
  const canvas = React.useRef<MaskEditorCanvasRef>(null) as React.RefObject<MaskEditorCanvasRef>;
  const [mask, setMask] = React.useState("");
  const [size, setSize] = React.useState(10);

  return (
    <>
    <div style={{ padding: 32 }}>
      <h2>Test MaskEditor (standalone usage)</h2>
      <MaskEditor
        key={"mask-editor"}
        src={cat}
        maskColor="#ffffff"
        cursorSize={size}
        onCursorSizeChange={setSize}
        canvasRef={canvas}
        onDrawingChange={console.log}
        onUndoRequest={() => console.log("Undo requested")}
        onRedoRequest={() => console.log("Redo requested")}
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
     <div style={{ padding: 32 }}>
      <MaskEditorProviderExample />
     </div>
    </>
  );
};

export default App
