import React from 'react';

import '../maskEditor.less';

import { useMaskEditor } from '../hooks/useMaskEditor';

import type { UseMaskEditorProps } from '../hooks/useMaskEditor';
import type { MaskEditorCanvasRef } from '../hooks/useMaskEditor';

export type { MaskEditorCanvasRef };

export interface MaskEditorProps extends UseMaskEditorProps {
  canvasRef?: React.RefObject<MaskEditorCanvasRef>;
}

export const MaskEditor: React.FC<MaskEditorProps> = (props) => {
  const {
    canvasRef: externalMaskCanvasRef,
    maxWidth = 1240,
    maxHeight = 1240,
    ...hookProps
  } = props;

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
    effectiveScale,
    zoomIn,
    zoomOut,
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
      zoomIn,
      zoomOut,
    }),
    [maskCanvasRef, undo, redo, clear, resetZoom, setPan, zoomIn, zoomOut],
  );

  const transformStyle = React.useMemo(() => {
    return {
      position: 'absolute' as const,
      top: '50%',
      left: '50%',
      transform: `translate(-50%, -50%) scale(${effectiveScale}) translate(${transform.translateX}px, ${transform.translateY}px)`,
      transformOrigin: 'center',
      transition: isPanning ? 'none' : 'transform 0.15s ease-out',
      width: size.x + 'px',
      height: size.y + 'px',
      display: 'block',
    };
  }, [transform, effectiveScale, isPanning, size]);

  // Determine the appropriate cursor based on current state
  const containerCursorStyle = React.useMemo(() => {
    if (isPanning) {
      return 'grabbing';
    } else if (isZoomKeyDown) {
      return 'zoom-in';
    } else if (scale > 1 && isPanning) {
      return 'grab';
    }
    return 'default';
  }, [isPanning, scale, isZoomKeyDown]);

  const handleKeyDown = React.useCallback((e: React.KeyboardEvent) => {
    if (e.code === 'Space') {
      e.preventDefault();
    }
  }, []);

  // Add a debug ID to see if component rendered when image is missing
  const uniqueId = React.useMemo(
    () => Math.random().toString(36).substring(2, 9),
    [],
  );

  return (
    <div
      className="react-mask-editor-outer"
      data-mask-editor-id={uniqueId}
      style={{
        maxWidth: `${maxWidth}px`,
        maxHeight: `${maxHeight}px`,
        minHeight: '300px',
        width: '100%',
        height: '100%',
      }}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div
        className="react-mask-editor-inner"
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          position: 'relative',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <div
          className="canvas-container"
          style={{
            position: 'relative',
            maxWidth: '100%',
            maxHeight: '100%',
            width: '100%',
            height: '100%',
            minHeight: '200px',
            overflow: 'hidden',
          }}
        >
          <div
            className="all-canvases"
            style={{
              ...transformStyle,
            }}
          >
            <canvas
              key={key}
              ref={canvasRef}
              style={{
                width: size.x,
                height: size.y,
                display: 'block', // Ensure proper display
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
                position: 'absolute',
                top: 0,
                left: 0,
                pointerEvents: 'none',
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
                cursor: containerCursorStyle,
                position: 'absolute',
                top: 0,
                left: 0,
                zIndex: 200, // Ensure cursor layer is on top
              }}
              className="react-mask-editor-cursor-canvas"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
