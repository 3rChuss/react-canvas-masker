import React from 'react';

import { hexToRgb, toMask, simpleDebounce } from '../utils';

import { useHistory, HistoryState } from './useHistory';
import { useZoomPan } from './useZoomPan';

export interface UseMaskEditorProps {
  src: string;
  /**
   * Cross-origin attribute for the image.
   * Useful if the image is hosted on a different domain and requires CORS.
   */
  crossOrigin?: string;
  /**
   * Maximum width for loaded images (default: 1240)
   */
  maxWidth?: number;
  /**
   * Maximum height for loaded images (default: 1240)
   */
  maxHeight?: number;
  cursorSize?: number;
  onCursorSizeChange?: (size: number) => void;
  maskOpacity?: number;
  maskColor?: string;
  maskBlendMode?:
    | 'normal'
    | 'multiply'
    | 'screen'
    | 'overlay'
    | 'darken'
    | 'lighten'
    | 'color-dodge'
    | 'color-burn'
    | 'hard-light'
    | 'soft-light'
    | 'difference'
    | 'exclusion'
    | 'hue'
    | 'saturation'
    | 'color'
    | 'luminosity';
  onDrawingChange: (isDrawing: boolean) => void;
  onUndoRequest?: () => void;
  onRedoRequest?: () => void;
  /**
   * Called with the current mask (as a dataURL) when the mask changes.
   * Debounced while drawing, called immediately on mouse up.
   */
  onMaskChange?: (mask: string) => void;
  /**
   * Current zoom scale (default: 1)
   */
  scale?: number;
  /**
   * Minimum allowed zoom scale (default: 0.5)
   */
  minScale?: number;
  /**
   * Maximum allowed zoom scale (default: 4)
   */
  maxScale?: number;
  /**
   * Callback when zoom scale changes
   */
  onScaleChange?: (scale: number) => void;
  /**
   * Enable/disable zoom with mouse wheel (default: true)
   */
  enableWheelZoom?: boolean;
  /**
   * Callback when pan position changes (dx, dy)
   */
  onPanChange?: (x: number, y: number) => void;

  /**
   * Enable/disable pan constraints to keep image in view (default: true)
   */
  constrainPan?: boolean;
}

export interface MaskEditorCanvasRef {
  maskCanvas: HTMLCanvasElement | null;
  undo: () => void;
  redo: () => void;
  clear: () => void;
  resetZoom: () => void;
  setPan: (x: number, y: number) => void;
}

export interface UseMaskEditorReturn {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  clear: () => void;
  cursorCanvasRef: React.RefObject<HTMLCanvasElement>;
  cursorSize: number;
  handleMouseDown: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  handleMouseUp: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  history: HistoryState[];
  historyIndex: number;
  isDrawing: boolean;
  key: number;
  maskBlendMode: string;
  maskCanvasRef: React.RefObject<HTMLCanvasElement>;
  maskColor: string;
  maskOpacity: number;
  redo: () => void;
  setCursorSize: React.Dispatch<React.SetStateAction<number>>;
  size: { x: number; y: number };
  undo: () => void;
  scale: number;
  setScale: React.Dispatch<React.SetStateAction<number>>;
  transform: {
    scale: number;
    translateX: number;
    translateY: number;
  };
  containerRef: React.RefObject<HTMLDivElement>;
  resetZoom: () => void;
  isPanning: boolean;
  isZoomKeyDown: boolean;
  setPan: (x: number, y: number) => void;
  effectiveScale: number; // Combine(baseScale * userScale)
}

export const MaskEditorDefaults = {
  cursorSize: 10,
  maskOpacity: 0.4,
  maskColor: '#ffffff',
  maskBlendMode: 'normal',
  scale: 1,
  minScale: 0.8,
  maxScale: 4,
  enableWheelZoom: true,
  constrainPan: true,
};

const fetchImageAsBase64 = async (url: string): Promise<string> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`);
  }
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export function useMaskEditor(props: UseMaskEditorProps): UseMaskEditorReturn {
  const {
    src,
    crossOrigin,
    maxWidth = 1240,
    maxHeight = 1240,
    cursorSize: initialCursorSize = MaskEditorDefaults.cursorSize,
    maskColor = MaskEditorDefaults.maskColor,
    maskBlendMode = MaskEditorDefaults.maskBlendMode,
    maskOpacity = MaskEditorDefaults.maskOpacity,
    onCursorSizeChange,
    onDrawingChange,
    onUndoRequest,
    onRedoRequest,
    onMaskChange,
    scale: initialScale = MaskEditorDefaults.scale,
    minScale = MaskEditorDefaults.minScale,
    maxScale = MaskEditorDefaults.maxScale,
    onScaleChange,
    enableWheelZoom = MaskEditorDefaults.enableWheelZoom,
    onPanChange,
    constrainPan = MaskEditorDefaults.constrainPan,
  } = props;

  // Debounced mask change callback
  const debouncedMaskChange = React.useMemo(() => {
    if (!onMaskChange) return undefined;
    return simpleDebounce((mask: string) => {
      onMaskChange(mask);
    }, 300);
  }, [onMaskChange]);

  // Refs
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = React.useRef<HTMLCanvasElement>(null);
  const cursorCanvasRef = React.useRef<HTMLCanvasElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Canvas contexts
  const [context, setContext] = React.useState<CanvasRenderingContext2D | null>(
    null,
  );
  const [maskContext, setMaskContext] =
    React.useState<CanvasRenderingContext2D | null>(null);
  const [cursorContext, setCursorContext] =
    React.useState<CanvasRenderingContext2D | null>(null);

  // Basic state
  const [size, setSize] = React.useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [isDrawing, setIsDrawing] = React.useState(false);
  const [currentCursorSize, setCursorSize] = React.useState(initialCursorSize);
  const [key, setKey] = React.useState(0);

  // Use the zoom and pan hook
  const [zoomPanState, zoomPanActions] = useZoomPan(containerRef, size, {
    initialScale,
    minScale,
    maxScale,
    enableWheelZoom,
    constrainPan,
    onScaleChange,
    onPanChange,
  });

  // Use the history hook
  const historyManager = useHistory(maskContext, size, {
    onUndoRequest,
    onRedoRequest,
    maxHistorySize: 50,
  });

  // Cursor and mask drawing
  React.useEffect(() => {
    const listener = (evt: MouseEvent) => {
      if (!containerRef.current || zoomPanState.isPanning) return; // Skip drawing if panning

      const { x: imageX, y: imageY } = zoomPanActions.getImageCoordinates(
        evt.clientX,
        evt.clientY,
      );

      if (cursorContext) {
        cursorContext.clearRect(0, 0, size.x, size.y);
        cursorContext.beginPath();
        cursorContext.fillStyle = maskColor;
        cursorContext.strokeStyle = '#000';
        cursorContext.lineWidth = 1;
        cursorContext.globalAlpha = maskOpacity + 0.1; // Slightly increase opacity for cursor
        cursorContext.arc(imageX, imageY, currentCursorSize, 0, Math.PI * 2);
        cursorContext.fill();
        cursorContext.stroke();
      }

      // Only draw if not panning and mouse button is pressed
      if (
        maskContext &&
        evt.buttons > 0 &&
        !zoomPanState.isPanning &&
        !zoomPanState.isSpaceKeyDown
      ) {
        maskContext.beginPath();
        maskContext.fillStyle =
          evt.buttons > 1 || evt.shiftKey ? '#ffffff' : maskColor;
        maskContext.arc(imageX, imageY, currentCursorSize, 0, Math.PI * 2);
        maskContext.fill();
      }
    };

    const scrollListener = (evt: WheelEvent) => {
      if (
        !evt.ctrlKey &&
        !evt.metaKey &&
        cursorContext &&
        containerRef.current
      ) {
        const { x: imageX, y: imageY } = zoomPanActions.getImageCoordinates(
          evt.clientX,
          evt.clientY,
        );

        const newSize = Math.max(
          1,
          currentCursorSize + (evt.deltaY > 0 ? -1 : 1), // Inverted
        );
        setCursorSize(newSize);
        onCursorSizeChange?.(newSize);

        cursorContext.clearRect(0, 0, size.x, size.y);
        cursorContext.beginPath();
        cursorContext.fillStyle = maskColor;
        cursorContext.strokeStyle = '#000';
        cursorContext.lineWidth = 1;
        cursorContext.globalAlpha = maskOpacity + 0.1; // Slightly increase opacity for cursor
        cursorContext.arc(imageX, imageY, newSize, 0, Math.PI * 2);
        cursorContext.fill();
        cursorContext.stroke();

        evt.stopPropagation();
        evt.preventDefault();
      }
    };

    // Replace previous mousemove listener
    const cursorCanvas = cursorCanvasRef.current;
    if (cursorCanvas) {
      cursorCanvas.addEventListener('mousemove', listener);
      if (onCursorSizeChange) {
        cursorCanvas.addEventListener('wheel', scrollListener, {
          passive: false,
        });
      }
    }

    return () => {
      if (cursorCanvas) {
        cursorCanvas.removeEventListener('mousemove', listener);
        if (onCursorSizeChange) {
          cursorCanvas.removeEventListener('wheel', scrollListener);
        }
      }
    };
  }, [
    cursorContext,
    maskContext,
    currentCursorSize,
    maskColor,
    size,
    zoomPanState,
    zoomPanActions,
    onCursorSizeChange,
    maskOpacity,
  ]);

  // Contexts
  React.useLayoutEffect(() => {
    if (canvasRef.current && !context) {
      setContext(canvasRef.current.getContext('2d'));
    }
  }, [canvasRef, context]);

  React.useLayoutEffect(() => {
    if (maskCanvasRef.current && !maskContext) {
      const ctx = maskCanvasRef.current.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, size.x, size.y);
      }
      setMaskContext(ctx);
    }
  }, [maskCanvasRef, size, maskContext]);

  React.useLayoutEffect(() => {
    if (cursorCanvasRef.current && !cursorContext) {
      setCursorContext(cursorCanvasRef.current.getContext('2d'));
    }
  }, [cursorCanvasRef, cursorContext]);

  // Function to prepare and apply image size
  const prepareAndApplyImage = React.useCallback(
    (img: HTMLImageElement) => {
      // Calculate dimensions
      let targetWidth = img.width;
      let targetHeight = img.height;
      if (img.width > maxWidth || img.height > maxHeight) {
        const widthRatio = maxWidth / img.width;
        const heightRatio = maxHeight / img.height;
        const ratio = Math.min(widthRatio, heightRatio);
        targetWidth = Math.round(img.width * ratio);
        targetHeight = Math.round(img.height * ratio);
      }

      // Set size state and update canvases
      setSize({ x: targetWidth, y: targetHeight });

      // Apply dimensions to all canvases
      [canvasRef, maskCanvasRef, cursorCanvasRef].forEach((ref) => {
        if (ref.current) {
          ref.current.width = targetWidth;
          ref.current.height = targetHeight;
        }
      });

      // Draw image on main canvas
      setTimeout(() => {
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, targetWidth, targetHeight);
          ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
        }
      }, 0);

      // Force re-render to update canvas
      setKey((prev) => prev + 1);
    },
    [maxWidth, maxHeight],
  );

  // Load image and set canvas sizes with improved error handling and debugging
  React.useEffect(() => {
    const loadImage = async () => {
      if (!src) {
        console.error('No source provided for image');
        return;
      }

      // Create image element
      const img = new window.Image();
      if (crossOrigin) {
        img.crossOrigin = crossOrigin;
      }

      // Set up onload and error handlers
      img.onload = () => {
        prepareAndApplyImage(img);
      };

      img.onerror = (error) => {
        console.error('Error al cargar la imagen:', error);
      };

      // Try to load image with fetch first (to handle CORS)
      try {
        const base64Src = await fetchImageAsBase64(src);
        img.src = base64Src;
      } catch (error) {
        console.error('Error cargando imagen con fetch:', error);
        // Try direct load as fallback
        img.src = src;
      }
    };

    loadImage();
  }, [src, crossOrigin, prepareAndApplyImage]);

  React.useEffect(() => {
    setCursorSize(initialCursorSize);
  }, [initialCursorSize]);

  // Mask color replacement
  const replaceMaskColor = React.useCallback(
    (hexColor: string, invert: boolean) => {
      if (!maskContext) return;
      if (size.x === 0 || size.y === 0) return;
      const imageData = maskContext.getImageData(0, 0, size.x, size.y);
      const color = hexToRgb(hexColor);
      if (imageData && color) {
        for (let i = 0; i < imageData.data.length; i += 4) {
          const pixelColor =
            (imageData.data[i] === 255) != invert ? [255, 255, 255] : color;
          imageData.data[i] = pixelColor[0];
          imageData.data[i + 1] = pixelColor[1];
          imageData.data[i + 2] = pixelColor[2];
        }
        maskContext.putImageData(imageData, 0, 0);
      }
    },
    [maskContext, size, maskColor],
  );

  React.useEffect(() => {
    replaceMaskColor(maskColor, false);
  }, [maskColor, size, replaceMaskColor]);

  // Handlers
  const handleMouseDown = React.useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      e.preventDefault();

      // Don't start drawing if we're in panning mode
      if (zoomPanState.isPanning || zoomPanState.isSpaceKeyDown) return;

      // Get the transformed coordinates
      const { x, y } = zoomPanActions.getImageCoordinates(e.clientX, e.clientY);

      if (maskContext) {
        maskContext.beginPath();
        maskContext.fillStyle =
          e.buttons > 1 || e.shiftKey ? '#ffffff' : maskColor;
        maskContext.arc(x, y, currentCursorSize, 0, Math.PI * 2);
        maskContext.fill();
      }

      setIsDrawing(true);
    },
    [zoomPanActions, zoomPanState, maskContext, currentCursorSize, maskColor],
  );

  const handleMouseUp = React.useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      setIsDrawing(false);
      setTimeout(() => {
        historyManager.saveToHistory();
        // Call onMaskChange immediately on mouse up
        if (onMaskChange && maskCanvasRef.current) {
          onMaskChange(toMask(maskCanvasRef.current));
        }
      }, 0);
    },
    [historyManager, onMaskChange, maskCanvasRef],
  );

  React.useEffect(() => {
    onDrawingChange(isDrawing);
  }, [isDrawing, onDrawingChange]);

  // Mask change effect (debounced while drawing)
  React.useEffect(() => {
    if (!onMaskChange || !maskCanvasRef.current) return;
    if (isDrawing && debouncedMaskChange) {
      debouncedMaskChange(toMask(maskCanvasRef.current));
    }
    // Cleanup debounce on unmount
    return () => {
      if (debouncedMaskChange) debouncedMaskChange.cancel();
    };
  }, [isDrawing, maskCanvasRef, onMaskChange, debouncedMaskChange]);

  // Undo/Redo/Clear with additional mask change notifications
  const undo = React.useCallback(() => {
    historyManager.undo();
    // Call onMaskChange after undo
    if (onMaskChange && maskCanvasRef.current) {
      onMaskChange(toMask(maskCanvasRef.current));
    }
  }, [historyManager, onMaskChange, maskCanvasRef]);

  const redo = React.useCallback(() => {
    historyManager.redo();
    // Call onMaskChange after redo
    if (onMaskChange && maskCanvasRef.current) {
      onMaskChange(toMask(maskCanvasRef.current));
    }
  }, [historyManager, onMaskChange, maskCanvasRef]);

  const clear = React.useCallback(() => {
    historyManager.clear();
    // Call onMaskChange after clear
    if (onMaskChange && maskCanvasRef.current) {
      onMaskChange(toMask(maskCanvasRef.current));
    }
  }, [historyManager, onMaskChange, maskCanvasRef]);

  // Keyboard shortcuts for undo/redo (Ctrl+Z / Ctrl+Y)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid interfering with input fields
      const tag = (e.target as HTMLElement)?.tagName;
      if (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        (e.target as HTMLElement)?.isContentEditable
      )
        return;

      if (
        (e.ctrlKey || e.metaKey) &&
        !e.shiftKey &&
        e.key.toLowerCase() === 'z'
      ) {
        e.preventDefault();
        undo();
      } else if (
        (e.ctrlKey || e.metaKey) &&
        (e.key.toLowerCase() === 'y' ||
          (e.shiftKey && e.key.toLowerCase() === 'z'))
      ) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [undo, redo]);

  return {
    canvasRef,
    maskCanvasRef,
    cursorCanvasRef,
    size,
    isDrawing,
    key,
    handleMouseDown,
    handleMouseUp,
    undo,
    redo,
    clear,
    cursorSize: currentCursorSize,
    setCursorSize,
    maskColor,
    maskOpacity,
    maskBlendMode,
    history: historyManager.history,
    historyIndex: historyManager.historyIndex,
    scale: zoomPanState.scale,
    setScale: zoomPanActions.setScale,
    transform: zoomPanState.transform,
    containerRef,
    resetZoom: zoomPanActions.resetZoom,
    isPanning: zoomPanState.isPanning,
    isZoomKeyDown: zoomPanState.isZoomKeyDown,
    setPan: zoomPanActions.setPan,
    effectiveScale: zoomPanState.effectiveScale,
  };
}
