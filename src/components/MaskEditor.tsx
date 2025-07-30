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
    isPanning,
    isZoomKeyDown,
    setPan,
    baseScale,
    effectiveScale,
  } = useMaskEditor(hookProps);

  // Expose API via ref if provided
  React.useImperativeHandle(
    externalMaskCanvasRef,
    () => ({
      maskCanvas: maskCanvasRef.current,
      undo,
      redo,
      clear,
      resetZoom,
      setPan,
    }),
    [maskCanvasRef, undo, redo, clear, resetZoom, setPan],
  );

  const transformStyle = React.useMemo(() => {
    return {
      transform: `scale(${effectiveScale}) translate(${transform.translateX}px, ${transform.translateY}px)`,
      transformOrigin: '0 0',
      transition: 'transform 0.15s ease-out',
    };
  }, [transform, effectiveScale]);

  // Determine the appropriate cursor based on current state
  const containerCursorStyle = React.useMemo(() => {
    if (isPanning) {
      return 'grabbing';
    } else if (isZoomKeyDown) {
      return 'zoom-in'; // CSS cursor for zoom
    } else if (scale > 1) {
      return 'grab';
    }
    return 'default';
  }, [isPanning, scale, isZoomKeyDown]);

  return (
    <div className="react-mask-editor-outer">
      <div
        className="react-mask-editor-inner"
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          cursor: containerCursorStyle,
          position: 'relative',
        }}
      >
        <div
          className="all-canvases"
          style={transformStyle}
          data-size={`${size.x}x${size.y}`}
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
              cursor: isPanning ? 'grabbing' : 'default',
            }}
            className="react-mask-editor-cursor-canvas"
          />
        </div>
      </div>
    </div>
  );
};
