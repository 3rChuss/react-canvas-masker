import * as React from 'react';
import {
  MaskEditor,
  toMask,
  type MaskEditorCanvasRef,
} from 'react-canvas-masker';
// import { MaskEditor, toMask, type MaskEditorCanvasRef } from '../../src/index';
import 'react-canvas-masker/dist/style.css';
// import './App.css';
import MaskEditorProviderExample from './MaskEditorProviderExample';

function App() {
  const canvas = React.useRef<MaskEditorCanvasRef>(
    null,
  ) as React.RefObject<MaskEditorCanvasRef>;
  const [mask, setMask] = React.useState('');
  const [size, setSize] = React.useState(20);
  const [color, setColor] = React.useState('#c3c3c3');
  const [scale, setScale] = React.useState(1);
  const [panPosition, setPanPosition] = React.useState({ x: 0, y: 0 });
  const imgSrc =
    'https://static.vecteezy.com/system/resources/previews/049/855/471/large_2x/nature-background-high-resolution-wallpaper-for-a-serene-and-stunning-view-free-photo.jpg';
  console.log('Mask:', mask);

  return (
    <>
      <div style={{ padding: 32 }}>
        <h2>Test MaskEditor (standalone usage)</h2>
        <div
          style={{
            display: 'flex',
            gap: 24,
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <label>
            Mask Color:
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
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
              onChange={(e) => setSize(Number(e.target.value))}
              style={{ marginLeft: 8 }}
            />
            <span style={{ marginLeft: 8 }}>{size}px</span>
          </label>
          <label>
            Zoom:
            <input
              type="range"
              min={0.5}
              max={4}
              step={0.1}
              value={scale}
              onChange={(e) => setScale(Number(e.target.value))}
              style={{ marginLeft: 8 }}
            />
            <span style={{ marginLeft: 8 }}>{Math.round(scale * 100)}%</span>
          </label>
          <div style={{ marginLeft: 16 }}>
            Pan Position: X: {Math.round(panPosition.x)} Y:{' '}
            {Math.round(panPosition.y)}
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: '1602px',
              height: '900px',
              justifyContent: 'center',
              alignItems: 'center',
              position: 'relative',
              display: 'flex',
            }}
          >
            <MaskEditor
              key={'mask-editor'}
              src={imgSrc}
              maskColor={color}
              cursorSize={size}
              onCursorSizeChange={setSize}
              canvasRef={canvas}
              maskOpacity={0.5}
              onDrawingChange={console.log}
              onUndoRequest={() => console.log('Undo requested')}
              onRedoRequest={() => console.log('Redo requested')}
              onMaskChange={setMask}
              scale={scale}
              maxScale={4}
              onScaleChange={setScale}
              enableWheelZoom
              maxWidth={1602}
              constrainPan
              onPanChange={(x, y) => setPanPosition({ x, y })}
            />
          </div>
        </div>
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
          <button
            onClick={() => {
              if (canvas.current?.zoomIn) {
                canvas.current.zoomIn();
              }
            }}
          >
            Zoom in
          </button>
          <button
            onClick={() => {
              if (canvas.current?.zoomOut) {
                canvas.current.zoomOut();
              }
            }}
          >
            Zoom out
          </button>
          <button
            onClick={() => {
              // Usar la nueva función resetZoom en lugar de solo setScale
              if (canvas.current?.resetZoom) {
                canvas.current.resetZoom();
              } else {
                setScale(1);
              }
            }}
          >
            Reset Zoom
          </button>
          <button
            onClick={() => {
              if (canvas.current?.setPan) {
                canvas.current.setPan(0, 0);
              }
            }}
          >
            Center View
          </button>
        </div>
        {mask && (
          <div
            style={{
              marginTop: 16,
              display: 'flex',
              gap: 24,
              alignItems: 'flex-start',
            }}
          >
            <div>
              <div style={{ marginBottom: 8 }}>
                <strong>Original image</strong>
              </div>
              <img
                src={imgSrc}
                alt="Original"
                style={{
                  maxWidth: 320,
                  maxHeight: 240,
                  display: 'block',
                  objectFit: 'cover',
                }}
              />
            </div>
            <div>
              <div style={{ marginBottom: 8 }}>
                <strong>Extracted mask</strong>
              </div>
              <img
                src={mask}
                alt="Extracted Mask"
                style={{
                  maxWidth: 320,
                  maxHeight: 240,
                  display: 'block',
                  objectFit: 'cover',
                }}
              />
            </div>
            <div>
              <div style={{ marginBottom: 8 }}>
                <strong>Overlay</strong>
              </div>
              <div style={{ position: 'relative', width: 320, height: 240 }}>
                <img
                  src={imgSrc}
                  alt="Original for overlay"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
                <img
                  src={mask}
                  alt="Mask overlay"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    opacity: 0.6,
                    pointerEvents: 'none',
                  }}
                />
              </div>
            </div>
          </div>
        )}
        <div style={{ marginTop: 16 }}></div>
      </div>
      <div style={{ padding: 32 }}>
        <MaskEditorProviderExample />
      </div>
    </>
  );
}

export default App;
