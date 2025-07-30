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
    scale,
    transform,
    containerRef,
    resetZoom,
  } = useMaskEditor(hookProps);

  // Expose API via ref if provided
  React.useImperativeHandle(
    externalMaskCanvasRef,
    () => ({
      maskCanvas: maskCanvasRef.current,
      undo,
      redo,
      clear,
      resetZoom, // Expose the reset zoom function through the ref
    }),
    [maskCanvasRef, undo, redo, clear, resetZoom],
  );

  // Construct transform style for zoom and pan
  const transformStyle = React.useMemo(() => {
    return {
      transform: `scale(${transform.scale}) translate(${transform.translateX}px, ${transform.translateY}px)`,
      transformOrigin: '0 0',
    };
  }, [transform]);

  return (
    <div className="react-mask-editor-outer">
      <div
        className="react-mask-editor-inner"
        ref={containerRef}
        style={{
          width: size.x,
          height: size.y,
          overflow: 'hidden', // Contain zoomed content
        }}
      >
        <div className="all-canvases" style={transformStyle}>
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
    </div>
  );
};
