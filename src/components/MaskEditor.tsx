import * as React from 'react';

import '../maskEditor.less';
import { useMaskEditor } from '../hooks/useMaskEditor';

import type { UseMaskEditorProps } from '../hooks/useMaskEditor';
import type { MaskEditorCanvasRef } from '../hooks/useMaskEditor';

export type { MaskEditorCanvasRef };

export interface MaskEditorProps extends UseMaskEditorProps {
  canvasRef?: React.RefObject<MaskEditorCanvasRef>;
}

export const MaskEditor: React.FC<MaskEditorProps> = (props) => {
  const { canvasRef: externalMaskCanvasRef, ...hookProps } = props;

  const {
    canvasRef,
    clear,
    cursorCanvasRef,
    handleMouseDown,
    handleMouseUp,
    key,
    maskBlendMode,
    maskCanvasRef,
    maskOpacity,
    redo,
    size,
    undo,
  } = useMaskEditor(hookProps);

  // Expose API via ref if provided
  React.useImperativeHandle(
    externalMaskCanvasRef,
    () => ({
      maskCanvas: maskCanvasRef.current,
      undo,
      redo,
      clear,
    }),
    [maskCanvasRef, undo, redo, clear],
  );

  return (
    <div className="react-mask-editor-outer">
      <div
        className="react-mask-editor-inner"
        style={{
          width: size.x,
          height: size.y,
        }}
      >
        <canvas
          key={key}
          ref={canvasRef}
          style={{
            width: size.x,
            height: size.y,
          }}
          width={size.x}
          height={size.y}
          className="react-mask-editor-base-canvas"
        />
        <canvas
          ref={maskCanvasRef}
          width={size.x}
          height={size.y}
          style={{
            width: size.x,
            height: size.y,
            opacity: maskOpacity,
            mixBlendMode: maskBlendMode as any,
          }}
          className="react-mask-editor-mask-canvas"
        />
        <canvas
          ref={cursorCanvasRef}
          width={size.x}
          height={size.y}
          onMouseUp={handleMouseUp}
          onMouseDown={handleMouseDown}
          style={{
            width: size.x,
            height: size.y,
          }}
          className="react-mask-editor-cursor-canvas"
        />
      </div>
    </div>
  );
};
