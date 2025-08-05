import React from 'react';

import { MaskEditor } from './components/MaskEditor';
import { useMaskEditor, type MaskEditorCanvasRef } from './hooks/useMaskEditor';
import { toMask } from './utils';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof MaskEditor> = {
  component: MaskEditor,
  title: 'Mask Editor',
};
export default meta;

type Story = StoryObj<typeof MaskEditor>;

export const BareEditorStory: Story = {
  args: {
    src: './cat.jpg',
    maskColor: '#ffffff',
  },
  name: 'Default',
  render: (args) => {
    const [size, setSize] = React.useState(10);
    const canvas = React.useRef<MaskEditorCanvasRef>(null);
    const [mask, setMask] = React.useState('');
    return (
      <>
        <MaskEditor
          {...args}
          cursorSize={size}
          onCursorSizeChange={setSize}
          canvasRef={canvas}
          onDrawingChange={(isDrawing) => {
            console.log('Drawing state changed:', isDrawing);
          }}
          onUndoRequest={() => console.log('Undo requested')}
          onRedoRequest={() => console.log('Redo requested')}
        />
        <button onClick={() => setMask(toMask(canvas.current?.maskCanvas))}>
          Extract Mask
        </button>
        <button onClick={() => canvas.current?.undo?.()}>Undo</button>
        <button onClick={() => canvas.current?.redo?.()}>Redo</button>
        <button onClick={() => canvas.current?.clear?.()}>Clear</button>
        <img src={mask} style={{ border: '1px solid gray' }} />
      </>
    );
  },
};

export const CatEditorStory: Story = {
  args: {
    src: 'https://raw.githubusercontent.com/la-voliere/react-mask-editor/ae23a726b8adf2712667b2e66d6c0244ef967e9c/src/cat.jpg',
    maskColor: '#ffffff',
  },
  name: 'Non square image',
  render: BareEditorStory.render,
};

export const HookUsageStory: Story = {
  render: () => {
    const [size, setSize] = React.useState(10);
    const {
      canvasRef,
      maskCanvasRef,
      cursorCanvasRef,
      size: canvasSize,
      handleMouseDown,
      handleMouseUp,
      undo,
      redo,
      clear,
    } = useMaskEditor({
      src: 'https://raw.githubusercontent.com/la-voliere/react-mask-editor/ae23a726b8adf2712667b2e66d6c0244ef967e9c/src/cat.jpg',
      cursorSize: size,
      onCursorSizeChange: setSize,
      maskColor: '#ffffff',
      onDrawingChange: (isDrawing) =>
        console.log('Drawing state changed:', isDrawing),
      onUndoRequest: () => console.log('Undo requested'),
      onRedoRequest: () => console.log('Redo requested'),
    });
    const [mask, setMask] = React.useState('');
    return (
      <div>
        <div className="react-mask-editor-outer">
          <div
            className="react-mask-editor-inner"
            style={{ width: canvasSize.x, height: canvasSize.y }}
          >
            <canvas
              ref={canvasRef}
              style={{ width: canvasSize.x, height: canvasSize.y }}
              width={canvasSize.x}
              height={canvasSize.y}
              className="react-mask-editor-base-canvas"
            />
            <canvas
              ref={maskCanvasRef}
              width={canvasSize.x}
              height={canvasSize.y}
              style={{
                width: canvasSize.x,
                height: canvasSize.y,
                opacity: 0.75,
                mixBlendMode: 'normal',
              }}
              className="react-mask-editor-mask-canvas"
            />
            <canvas
              ref={cursorCanvasRef}
              width={canvasSize.x}
              height={canvasSize.y}
              onMouseUp={handleMouseUp}
              onMouseDown={handleMouseDown}
              style={{ width: canvasSize.x, height: canvasSize.y }}
              className="react-mask-editor-cursor-canvas"
            />
          </div>
        </div>
        <button onClick={() => setMask(toMask(maskCanvasRef.current))}>
          Extract Mask
        </button>
        <button onClick={undo}>Undo</button>
        <button onClick={redo}>Redo</button>
        <button onClick={clear}>Clear</button>
        <img src={mask} style={{ border: '1px solid gray' }} />
      </div>
    );
  },
};
