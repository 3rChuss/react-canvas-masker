import * as React from 'react';

import { hexToRgb, toMask, simpleDebounce } from '../utils';

export interface HistoryState {
  imageData: ImageData;
  timestamp: number;
}

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
}

export interface MaskEditorCanvasRef {
  maskCanvas: HTMLCanvasElement | null;
  undo: () => void;
  redo: () => void;
  clear: () => void;
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
}

export const MaskEditorDefaults = {
  cursorSize: 10,
  maskOpacity: 0.4,
  maskColor: '#ffffff',
  maskBlendMode: 'normal',
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
  } = props;

  // Debounced mask change callback
  const debouncedMaskChange = React.useMemo(() => {
    if (!onMaskChange) return undefined;
    return simpleDebounce((mask: string) => {
      onMaskChange(mask);
    }, 300);
  }, [onMaskChange]);

  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = React.useRef<HTMLCanvasElement>(null);
  const cursorCanvasRef = React.useRef<HTMLCanvasElement>(null);

  const [context, setContext] = React.useState<CanvasRenderingContext2D | null>(
    null,
  );
  const [maskContext, setMaskContext] =
    React.useState<CanvasRenderingContext2D | null>(null);
  const [cursorContext, setCursorContext] =
    React.useState<CanvasRenderingContext2D | null>(null);
  const [size, setSize] = React.useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [isDrawing, setIsDrawing] = React.useState(false);
  const [history, setHistory] = React.useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = React.useState(-1);
  const [currentCursorSize, setCursorSize] = React.useState(initialCursorSize);
  const [key, setKey] = React.useState(0);

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

  // Load image and set canvas sizes
  React.useEffect(() => {
    const loadImage = async () => {
      if (!src) return;
      try {
        const base64Src = await fetchImageAsBase64(src);
        const img = new window.Image();
        if (crossOrigin) {
          img.crossOrigin = crossOrigin;
        }
        img.onload = () => {
          let targetWidth = img.width;
          let targetHeight = img.height;
          // Redimensionar si es más grande que el máximo
          if (img.width > maxWidth || img.height > maxHeight) {
            const widthRatio = maxWidth / img.width;
            const heightRatio = maxHeight / img.height;
            const ratio = Math.min(widthRatio, heightRatio);
            targetWidth = Math.round(img.width * ratio);
            targetHeight = Math.round(img.height * ratio);
          }
          setSize({ x: targetWidth, y: targetHeight });
          if (canvasRef.current) {
            canvasRef.current.width = targetWidth;
            canvasRef.current.height = targetHeight;
          }
          if (maskCanvasRef.current) {
            maskCanvasRef.current.width = targetWidth;
            maskCanvasRef.current.height = targetHeight;
          }
          if (cursorCanvasRef.current) {
            cursorCanvasRef.current.width = targetWidth;
            cursorCanvasRef.current.height = targetHeight;
          }
          setTimeout(() => {
            const ctx = canvasRef.current?.getContext('2d');
            ctx?.clearRect(0, 0, targetWidth, targetHeight);
            ctx?.drawImage(img, 0, 0, targetWidth, targetHeight);
          }, 0);
        };
        setTimeout(() => {
          img.src = base64Src;
        }, 0);
        // Force re-render to update canvas
        setKey((prev) => prev + 1); // Force re-render to update canvas
      } catch (error) {
        console.error('Error loading image:', error);
        console.error('Trying to load image from src directly');

        const img = new window.Image();
        if (crossOrigin) {
          img.crossOrigin = crossOrigin;
        }
        img.onload = () => {
          let targetWidth = img.width;
          let targetHeight = img.height;
          if (img.width > maxWidth || img.height > maxHeight) {
            const widthRatio = maxWidth / img.width;
            const heightRatio = maxHeight / img.height;
            const ratio = Math.min(widthRatio, heightRatio);
            targetWidth = Math.round(img.width * ratio);
            targetHeight = Math.round(img.height * ratio);
          }
          setSize({ x: targetWidth, y: targetHeight });
          if (canvasRef.current) {
            canvasRef.current.width = targetWidth;
            canvasRef.current.height = targetHeight;
          }
          if (maskCanvasRef.current) {
            maskCanvasRef.current.width = targetWidth;
            maskCanvasRef.current.height = targetHeight;
          }
          if (cursorCanvasRef.current) {
            cursorCanvasRef.current.width = targetWidth;
            cursorCanvasRef.current.height = targetHeight;
          }
          setTimeout(() => {
            const ctx = canvasRef.current?.getContext('2d');
            ctx?.clearRect(0, 0, targetWidth, targetHeight);
            ctx?.drawImage(img, 0, 0, targetWidth, targetHeight);
          }, 0);
        };
        setTimeout(() => {
          img.src = src;
        }, 0);
        setKey((prev) => prev + 1); // Force re-render to update canvas
      }
    };
    loadImage();
  }, [src, crossOrigin, maxWidth, maxHeight]);

  React.useEffect(() => {
    setCursorSize(initialCursorSize);
  }, [initialCursorSize]);

  // Cursor and mask drawing
  React.useEffect(() => {
    const listener = (evt: MouseEvent) => {
      if (cursorContext) {
        cursorContext.clearRect(0, 0, size.x, size.y);
        cursorContext.beginPath();
        cursorContext.fillStyle = maskColor;
        cursorContext.strokeStyle = maskColor;
        cursorContext.globalAlpha = maskOpacity + 0.1; // Slightly increase opacity for cursor
        cursorContext.arc(evt.offsetX, evt.offsetY, currentCursorSize, 0, 360);
        cursorContext.fill();
        cursorContext.stroke();
      }
      if (maskContext && evt.buttons > 0) {
        maskContext.beginPath();
        maskContext.fillStyle =
          evt.buttons > 1 || evt.shiftKey ? '#ffffff' : maskColor;
        maskContext.arc(evt.offsetX, evt.offsetY, currentCursorSize, 0, 360);
        maskContext.fill();
      }
    };
    const scrollListener = (evt: WheelEvent) => {
      if (cursorContext) {
        const newSize = Math.max(
          1,
          currentCursorSize + (evt.deltaY > 0 ? 1 : -1),
        );
        setCursorSize(newSize);
        onCursorSizeChange?.(newSize);
        cursorContext.clearRect(0, 0, size.x, size.y);
        cursorContext.beginPath();
        cursorContext.fillStyle = maskColor;
        cursorContext.strokeStyle = maskColor;
        cursorContext.globalAlpha = maskOpacity + 0.1; // Slightly increase opacity for cursor
        cursorContext.arc(evt.offsetX, evt.offsetY, newSize, 0, 360);
        cursorContext.fill();
        cursorContext.stroke();
        evt.stopPropagation();
        evt.preventDefault();
      }
    };
    cursorCanvasRef.current?.addEventListener('mousemove', listener);
    if (onCursorSizeChange) {
      cursorCanvasRef.current?.addEventListener('wheel', scrollListener);
    }
    return () => {
      cursorCanvasRef.current?.removeEventListener('mousemove', listener);
      if (onCursorSizeChange) {
        cursorCanvasRef.current?.removeEventListener('wheel', scrollListener);
      }
    };
  }, [
    cursorContext,
    maskContext,
    currentCursorSize,
    maskColor,
    size,
    onCursorSizeChange,
  ]);

  // Replace mask color
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

  // History
  const saveToHistory = React.useCallback(() => {
    if (!maskContext || size.x === 0 || size.y === 0) return;
    try {
      const imageData = maskContext.getImageData(0, 0, size.x, size.y);
      const newState: HistoryState = {
        imageData,
        timestamp: Date.now(),
      };
      setHistory((prev) => {
        const newHistory = prev.slice(0, historyIndex + 1);
        newHistory.push(newState);
        return newHistory.slice(-50);
      });
      setHistoryIndex((prev) => Math.min(prev + 1, 49));
    } catch (error) {
      // Avoid crash if canvas is not ready
    }
  }, [maskContext, size, historyIndex]);

  const restoreFromHistory = React.useCallback(
    (index: number) => {
      if (!maskContext || size.x === 0 || size.y === 0) return;
      if (index < -1 || index >= history.length) return;
      if (index === -1) {
        maskContext.clearRect(0, 0, size.x, size.y);
        setHistoryIndex(-1);
        return;
      }
      if (history[index]) {
        maskContext.putImageData(history[index].imageData, 0, 0);
        setHistoryIndex(index);
      }
    },
    [history, maskContext, size],
  );

  // Handlers
  const handleMouseDown = React.useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      setIsDrawing(true);
    },
    [],
  );
  const handleMouseUp = React.useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      setIsDrawing(false);
      setTimeout(() => {
        saveToHistory();
        // Call onMaskChange immediately on mouse up
        if (onMaskChange && maskCanvasRef.current) {
          onMaskChange(toMask(maskCanvasRef.current));
        }
      }, 0);
    },
    [saveToHistory, onMaskChange, maskCanvasRef],
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
  }, [isDrawing, maskCanvasRef, onMaskChange]);

  // Undo/Redo/Clear
  const undo = React.useCallback(() => {
    restoreFromHistory(historyIndex - 1);
    onUndoRequest?.();
    // Call onMaskChange after undo
    if (onMaskChange && maskCanvasRef.current) {
      onMaskChange(toMask(maskCanvasRef.current));
    }
  }, [
    restoreFromHistory,
    historyIndex,
    onUndoRequest,
    onMaskChange,
    maskCanvasRef,
  ]);

  const redo = React.useCallback(() => {
    if (history[historyIndex + 1]) {
      restoreFromHistory(historyIndex + 1);
      onRedoRequest?.();
      // Call onMaskChange after redo
      if (onMaskChange && maskCanvasRef.current) {
        onMaskChange(toMask(maskCanvasRef.current));
      }
    }
  }, [
    restoreFromHistory,
    history,
    historyIndex,
    onRedoRequest,
    onMaskChange,
    maskCanvasRef,
  ]);

  const clear = React.useCallback(() => {
    if (!maskContext || size.x === 0 || size.y === 0) return;
    maskContext.clearRect(0, 0, size.x, size.y);
    setHistory([]);
    setHistoryIndex(-1);
    // Call onMaskChange after clear
    if (onMaskChange && maskCanvasRef.current) {
      onMaskChange(toMask(maskCanvasRef.current));
    }
  }, [maskContext, size, onMaskChange, maskCanvasRef]);

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
    history,
    historyIndex,
  };
}
