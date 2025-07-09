import * as React from "react";
import { hexToRgb, toMask } from "../utils";
import debounce from "lodash.debounce";

export interface HistoryState {
  imageData: ImageData;
  timestamp: number;
}

export interface UseMaskEditorProps {
  src: string;
  cursorSize?: number;
  onCursorSizeChange?: (size: number) => void;
  maskOpacity?: number;
  maskColor?: string;
  maskBlendMode?:
    | "normal"
    | "multiply"
    | "screen"
    | "overlay"
    | "darken"
    | "lighten"
    | "color-dodge"
    | "color-burn"
    | "hard-light"
    | "soft-light"
    | "difference"
    | "exclusion"
    | "hue"
    | "saturation"
    | "color"
    | "luminosity";
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
  maskCanvasRef: React.RefObject<HTMLCanvasElement>;
  cursorCanvasRef: React.RefObject<HTMLCanvasElement>;
  size: { x: number; y: number };
  isDrawing: boolean;
  handleMouseDown: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  handleMouseUp: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  undo: () => void;
  redo: () => void;
  clear: () => void;
  cursorSize: number;
  setCursorSize: React.Dispatch<React.SetStateAction<number>>;
  maskColor: string;
  maskOpacity: number;
  maskBlendMode: string;
  history: HistoryState[];
  historyIndex: number;
}

export const MaskEditorDefaults = {
  cursorSize: 10,
  maskOpacity: 0.4,
  maskColor: "#ffffff",
  maskBlendMode: "normal",
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
    return debounce((mask: string) => {
      onMaskChange(mask);
    }, 300);
  }, [onMaskChange]);

  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = React.useRef<HTMLCanvasElement>(null);
  const cursorCanvasRef = React.useRef<HTMLCanvasElement>(null);

  const [context, setContext] =
    React.useState<CanvasRenderingContext2D | null>(null);
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

  // Contexts
  React.useLayoutEffect(() => {
    if (canvasRef.current && !context) {
      setContext(canvasRef.current.getContext("2d"));
    }
  }, [canvasRef, context]);

  React.useLayoutEffect(() => {
    if (maskCanvasRef.current && !maskContext) {
      const ctx = maskCanvasRef.current.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, size.x, size.y);
      }
      setMaskContext(ctx);
    }
  }, [maskCanvasRef, size, maskContext]);

  React.useLayoutEffect(() => {
    if (cursorCanvasRef.current && !cursorContext) {
      setCursorContext(cursorCanvasRef.current.getContext("2d"));
    }
  }, [cursorCanvasRef, cursorContext]);

  // Load image and set canvas sizes
  React.useEffect(() => {
    const loadImage = async () => {
      if (!src) return;
      try {
        const base64Src = await fetchImageAsBase64(src);
        const img = new window.Image();
        img.onload = () => {
          // Primero, actualizamos el tamaño del estado y de los canvas
          setSize({ x: img.width, y: img.height });
          if (canvasRef.current) {
            canvasRef.current.width = img.width;
            canvasRef.current.height = img.height;
          }
          if (maskCanvasRef.current) {
            maskCanvasRef.current.width = img.width;
            maskCanvasRef.current.height = img.height;
          }
          if (cursorCanvasRef.current) {
            cursorCanvasRef.current.width = img.width;
            cursorCanvasRef.current.height = img.height;
          }
          // Esperamos un tick para asegurar que el contexto se actualizó
          setTimeout(() => {
            const ctx = canvasRef.current?.getContext("2d");
            ctx?.clearRect(0, 0, img.width, img.height);
            ctx?.drawImage(img, 0, 0, img.width, img.height);
          }, 0);
        };
        img.src = base64Src;
      } catch (error) {
        console.error("Error loading image:", error);
      }
    };
    loadImage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

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
          evt.buttons > 1 || evt.shiftKey ? "#ffffff" : maskColor;
        maskContext.arc(evt.offsetX, evt.offsetY, currentCursorSize, 0, 360);
        maskContext.fill();
      }
    };
    const scrollListener = (evt: WheelEvent) => {
      if (cursorContext) {
        const newSize = Math.max(
          1,
          currentCursorSize + (evt.deltaY > 0 ? 1 : -1)
        );
        setCursorSize(newSize);
        onCursorSizeChange?.(newSize);
        cursorContext.clearRect(0, 0, size.x, size.y);
        cursorContext.beginPath();
        cursorContext.fillStyle = `${maskColor}88`;
        cursorContext.strokeStyle = maskColor;
        cursorContext.arc(evt.offsetX, evt.offsetY, newSize, 0, 360);
        cursorContext.fill();
        cursorContext.stroke();
        evt.stopPropagation();
        evt.preventDefault();
      }
    };
    cursorCanvasRef.current?.addEventListener("mousemove", listener);
    if (onCursorSizeChange) {
      cursorCanvasRef.current?.addEventListener("wheel", scrollListener);
    }
    return () => {
      cursorCanvasRef.current?.removeEventListener("mousemove", listener);
      if (onCursorSizeChange) {
        cursorCanvasRef.current?.removeEventListener("wheel", scrollListener);
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
    [maskContext, size]
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
    [history, maskContext, size]
  );

  // Handlers
  const handleMouseDown = React.useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      setIsDrawing(true);
    },
    []
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
    [saveToHistory, onMaskChange, maskCanvasRef]
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  return {
    canvasRef,
    maskCanvasRef,
    cursorCanvasRef,
    size,
    isDrawing,
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
