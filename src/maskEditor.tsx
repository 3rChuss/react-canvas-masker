import * as React from "react";
import "./maskEditor.less";
import { hexToRgb } from "./utils";

export interface HistoryState {
  imageData: ImageData;
  timestamp: number;
}

// Extended canvas interface with undo and redo methods
export interface MaskEditorCanvasRef extends HTMLCanvasElement {
  undo: () => void;
  redo: () => void;
  clear: () => void;
}

export interface MaskEditorProps {
  src: string;
  canvasRef?: React.RefObject<MaskEditorCanvasRef>;
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
}

// Avoids potential CORS issues with canvas
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

export const MaskEditorDefaults = {
  cursorSize: 10,
  maskOpacity: 0.75,
  maskColor: "#23272d",
  maskBlendMode: "normal",
};

export const MaskEditor: React.FC<MaskEditorProps> = (
  props: MaskEditorProps
) => {
  const src = props.src;
  const cursorSize = props.cursorSize ?? MaskEditorDefaults.cursorSize;
  const maskColor = props.maskColor ?? MaskEditorDefaults.maskColor;
  const maskBlendMode = props.maskBlendMode ?? MaskEditorDefaults.maskBlendMode;
  const maskOpacity = props.maskOpacity ?? MaskEditorDefaults.maskOpacity;

  const canvas = React.useRef<HTMLCanvasElement | null>(null);
  // Use the provided canvasRef or create a new one if not provided
  const maskCanvas =
    props.canvasRef || React.useRef<HTMLCanvasElement | null>(null);
  const cursorCanvas = React.useRef<HTMLCanvasElement | null>(null);
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

  React.useLayoutEffect(() => {
    if (canvas.current && !context) {
      const ctx = (canvas.current as HTMLCanvasElement).getContext("2d");
      setContext(ctx);
    }
  }, [canvas]);

  React.useLayoutEffect(() => {
    if (maskCanvas.current && !context) {
      const ctx = (maskCanvas.current as HTMLCanvasElement).getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, size.x, size.y);
      }
      setMaskContext(ctx);
    }
  }, [maskCanvas, size]);

  React.useLayoutEffect(() => {
    if (cursorCanvas.current && !context) {
      const ctx = (cursorCanvas.current as HTMLCanvasElement).getContext("2d");
      setCursorContext(ctx);
    }
  }, [cursorCanvas]);

  React.useEffect(() => {
    const loadImage = async () => {
      if (src && context) {
        try {
          const base64Src = await fetchImageAsBase64(src);

          const img = new Image();
          img.onload = () => {
            if (size?.x !== img.width && size?.y !== img.height) {
              setSize({ x: img.width, y: img.height });
            }

            const canvasEl = canvas.current;
            if (canvasEl) {
              canvasEl.width = img.width;
              canvasEl.height = img.height;
            }

            context?.drawImage(img, 0, 0, img.width, img.height);
          };
          img.src = base64Src;
        } catch (error) {
          console.error("Error loading image:", error);
        }
      }
    };

    loadImage();
  }, [src, canvas.current?.width, canvas.current?.height, context, size]);

  React.useEffect(() => {
    const listener = (evt: MouseEvent) => {
      if (cursorContext) {
        cursorContext.clearRect(0, 0, size.x, size.y);

        cursorContext.beginPath();
        cursorContext.fillStyle = `${maskColor}88`;
        cursorContext.strokeStyle = maskColor;
        cursorContext.arc(evt.offsetX, evt.offsetY, cursorSize, 0, 360);
        cursorContext.fill();
        cursorContext.stroke();
      }
      if (maskContext && evt.buttons > 0) {
        maskContext.beginPath();
        maskContext.fillStyle =
          evt.buttons > 1 || evt.shiftKey ? "#ffffff" : maskColor;
        maskContext.arc(evt.offsetX, evt.offsetY, cursorSize, 0, 360);
        maskContext.fill();
      }
    };
    const scrollListener = (evt: WheelEvent) => {
      if (cursorContext) {
        props.onCursorSizeChange(
          Math.max(0, cursorSize + (evt.deltaY > 0 ? 1 : -1))
        );

        cursorContext.clearRect(0, 0, size.x, size.y);

        cursorContext.beginPath();
        cursorContext.fillStyle = `${maskColor}88`;
        cursorContext.strokeStyle = maskColor;
        cursorContext.arc(evt.offsetX, evt.offsetY, cursorSize, 0, 360);
        cursorContext.fill();
        cursorContext.stroke();

        evt.stopPropagation();
        evt.preventDefault();
      }
    };

    cursorCanvas.current?.addEventListener("mousemove", listener);
    if (props.onCursorSizeChange) {
      cursorCanvas.current?.addEventListener("wheel", scrollListener);
    }
    return () => {
      cursorCanvas.current?.removeEventListener("mousemove", listener);
      if (props.onCursorSizeChange) {
        cursorCanvas.current?.removeEventListener("wheel", scrollListener);
      }
    };
  }, [cursorContext, maskContext, cursorCanvas, cursorSize, maskColor, size]);

  const replaceMaskColor = React.useCallback(
    (hexColor: string, invert: boolean) => {
      const imageData = maskContext?.getImageData(0, 0, size.x, size.y);
      const color = hexToRgb(hexColor);
      if (imageData) {
        for (var i = 0; i < imageData?.data.length; i += 4) {
          const pixelColor =
            (imageData.data[i] === 255) != invert ? [255, 255, 255] : color;
          imageData.data[i] = pixelColor[0];
          imageData.data[i + 1] = pixelColor[1];
          imageData.data[i + 2] = pixelColor[2];
          imageData.data[i + 3] = imageData.data[i + 3];
        }
        maskContext?.putImageData(imageData, 0, 0);
      }
    },
    [maskContext, size]
  );

  React.useEffect(() => replaceMaskColor(maskColor, false), [maskColor, size]);

  const saveToHistory = React.useCallback(() => {
    const imageData = maskContext?.getImageData(0, 0, size.x, size.y);

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
  }, [maskContext, size, props, historyIndex, history]);

  console.log(history, historyIndex);

  const handleMouseDown = React.useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      setIsDrawing(true);
    },
    [props, saveToHistory]
  );

  const handleMouseUp = React.useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      setIsDrawing(false);
      saveToHistory();
    },
    [saveToHistory, props]
  );

  React.useEffect(() => {
    props.onDrawingChange(isDrawing);
  }, [isDrawing, props]);

  const restoreFromHistory = React.useCallback(
    (index: number) => {
      if (index < -1 || index >= history.length) {
        return;
      }

      if (index === -1) {
        maskContext?.clearRect(0, 0, size.x, size.y);

        setHistoryIndex(-1);
        return;
      }

      if (history[index]) {
        maskContext?.putImageData(history[index].imageData, 0, 0);
        setHistoryIndex(index);
      }
    },
    [history, maskContext, size]
  );

  const handleUndo = React.useCallback(() => {
    restoreFromHistory(historyIndex - 1);

    // Call the onUndoRequest prop if provided
    if (props.onUndoRequest) {
      props.onUndoRequest();
    }
  }, [history, historyIndex, maskContext, props.onUndoRequest]);

  const handleRedo = React.useCallback(() => {
    const nextState = history[historyIndex + 1];
    if (nextState) {
      restoreFromHistory(historyIndex + 1);
    }
    // Call the onRedoRequest prop if provided
    if (props.onRedoRequest) {
      props.onRedoRequest();
    }
  }, [
    history,
    historyIndex,
    maskContext,
    props.onRedoRequest,
    restoreFromHistory,
  ]);

  const handleClear = React.useCallback(() => {
    maskContext?.clearRect(0, 0, size.x, size.y);
    setHistory([]);
    setHistoryIndex(0);
  }, [maskContext, size]);

  // Expose undo and redo methods through ref
  React.useImperativeHandle(
    props.canvasRef,
    () => ({
      ...maskCanvas.current,
      undo: handleUndo,
      redo: handleRedo,
      clear: handleClear,
    }),
    [maskCanvas.current, handleUndo, handleRedo]
  );

  return (
    <div className="react-mask-editor-outer">
      <div
        className="react-mask-editor-inner"
        style={{
          width: size.x,
          height: size.y,
        }}
        key="test"
      >
        <canvas
          ref={canvas}
          key="no-rerender"
          style={{
            width: size.x,
            height: size.y,
          }}
          width={size.x}
          height={size.y}
          className="react-mask-editor-base-canvas"
        />
        <canvas
          ref={maskCanvas}
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
          ref={cursorCanvas}
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
