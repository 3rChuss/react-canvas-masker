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
  baseScale: number; // Factor de escala automática
  effectiveScale: number; // Escala combinada (baseScale * userScale)
}

export const MaskEditorDefaults = {
  cursorSize: 10,
  maskOpacity: 0.4,
  maskColor: '#ffffff',
  maskBlendMode: 'normal',
  scale: 1,
  minScale: 0.5,
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

  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = React.useRef<HTMLCanvasElement>(null);
  const cursorCanvasRef = React.useRef<HTMLCanvasElement>(null);
  // Container ref for zoom transformations
  const containerRef = React.useRef<HTMLDivElement>(null);

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
  // Zoom state
  const [scale, setScale] = React.useState(initialScale);
  const [transform, setTransform] = React.useState({
    scale: initialScale,
    translateX: 0,
    translateY: 0,
  });
  // Pan state
  const [isPanning, setIsPanning] = React.useState(false);
  const [isSpaceKeyDown, setIsSpaceKeyDown] = React.useState(false);
  const [isZoomKeyDown, setIsZoomKeyDown] = React.useState(false);
  const [lastMousePosition, setLastMousePosition] = React.useState({
    x: 0,
    y: 0,
  });

  // Scale factor for automatic scaling
  const [baseScale, setBaseScale] = React.useState(1);
  const [containerSize, setContainerSize] = React.useState({
    width: 0,
    height: 0,
  });

  // Reference for the last transform values
  const lastTransformRef = React.useRef({
    x: 0,
    y: 0,
  });

  const lastKnownValuesRef = React.useRef({
    baseScale: 1,
    containerWidth: 0,
    containerHeight: 0,
  });

  // Effective scale (combined)
  const effectiveScale = React.useMemo(
    () => baseScale * scale,
    [baseScale, scale],
  );

  const getImageCoordinates = React.useCallback(
    (clientX: number, clientY: number) => {
      if (!containerRef.current) return { x: 0, y: 0 };

      const rect = containerRef.current.getBoundingClientRect();
      const offsetX = clientX - rect.left;
      const offsetY = clientY - rect.top;

      const x = offsetX / (transform.scale * baseScale) - transform.translateX;
      const y = offsetY / (transform.scale * baseScale) - transform.translateY;

      return { x, y };
    },
    [transform, baseScale],
  );

  const calculateBaseScale = React.useCallback(() => {
    if (!containerRef.current || size.x === 0 || size.y === 0)
      return {
        baseScale: 1,
        containerWidth: 0,
        containerHeight: 0,
      };

    const container = containerRef.current;
    const computedStyle = window.getComputedStyle(container);
    const paddingHorizontal =
      parseFloat(computedStyle.paddingLeft) +
      parseFloat(computedStyle.paddingRight);
    const paddingVertical =
      parseFloat(computedStyle.paddingTop) +
      parseFloat(computedStyle.paddingBottom);

    const availableWidth = container.clientWidth - paddingHorizontal;
    const availableHeight = container.clientHeight - paddingVertical;

    const widthRatio = availableWidth / size.x;
    const heightRatio = availableHeight / size.y;

    // Calculate the new base scale
    const newBaseScale = Math.min(1, widthRatio, heightRatio);

    return {
      baseScale: newBaseScale,
      containerWidth: availableWidth,
      containerHeight: availableHeight,
    };
  }, [size]);

  React.useEffect(() => {
    // Only run when we have valid dimensions
    if (size.x === 0 || size.y === 0 || !containerRef.current) return;

    const container = containerRef.current;

    const {
      baseScale: initialBaseScale,
      containerWidth,
      containerHeight,
    } = calculateBaseScale();

    if (Math.abs(initialBaseScale - baseScale) > 0.01) {
      setBaseScale(initialBaseScale);
    }

    if (
      Math.abs(containerWidth - containerSize.width) > 5 ||
      Math.abs(containerHeight - containerSize.height) > 5
    ) {
      setContainerSize({ width: containerWidth, height: containerHeight });
    }

    lastKnownValuesRef.current = {
      baseScale: initialBaseScale,
      containerWidth,
      containerHeight,
    };

    let resizeTimeout: ReturnType<typeof setTimeout>;
    const resizeObserver = new ResizeObserver(() => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        const {
          baseScale: newBaseScale,
          containerWidth: newWidth,
          containerHeight: newHeight,
        } = calculateBaseScale();

        if (
          Math.abs(newBaseScale - lastKnownValuesRef.current.baseScale) > 0.01
        ) {
          lastKnownValuesRef.current.baseScale = newBaseScale;
          setBaseScale(newBaseScale);
        }

        if (
          Math.abs(newWidth - lastKnownValuesRef.current.containerWidth) > 5 ||
          Math.abs(newHeight - lastKnownValuesRef.current.containerHeight) > 5
        ) {
          lastKnownValuesRef.current.containerWidth = newWidth;
          lastKnownValuesRef.current.containerHeight = newHeight;
          setContainerSize({ width: newWidth, height: newHeight });
        }
      }, 50);
    });

    resizeObserver.observe(container);

    return () => {
      clearTimeout(resizeTimeout);
      resizeObserver.disconnect();
    };
  }, [
    size,
    calculateBaseScale,
    baseScale,
    containerSize.width,
    containerSize.height,
  ]);

  React.useEffect(() => {
    if (
      !containerRef.current ||
      size.x === 0 ||
      size.y === 0 ||
      containerSize.width === 0
    ) {
      return;
    }

    if (baseScale < 1) {
      const centerOffsetX =
        (containerSize.width - size.x * baseScale) / (2 * baseScale);
      const centerOffsetY =
        (containerSize.height - size.y * baseScale) / (2 * baseScale);

      if (
        Math.abs(lastTransformRef.current.x - centerOffsetX) > 0.5 ||
        Math.abs(lastTransformRef.current.y - centerOffsetY) > 0.5
      ) {
        lastTransformRef.current = { x: centerOffsetX, y: centerOffsetY };

        setTransform((prev) => ({
          ...prev,
          translateX: centerOffsetX,
          translateY: centerOffsetY,
        }));

        if (onPanChange) {
          const timer = setTimeout(() => {
            onPanChange(centerOffsetX, centerOffsetY);
          }, 0);
          return () => clearTimeout(timer);
        }
      }
    }
  }, [baseScale, containerSize, size]);

  // Cursor and mask drawing
  React.useEffect(() => {
    const listener = (evt: MouseEvent) => {
      if (!containerRef.current || isPanning) return; // Skip drawing if panning

      const { x: imageX, y: imageY } = getImageCoordinates(
        evt.clientX,
        evt.clientY,
      );

      if (cursorContext) {
        cursorContext.clearRect(0, 0, size.x, size.y);
        cursorContext.beginPath();
        cursorContext.fillStyle = maskColor;
        cursorContext.strokeStyle = maskColor;
        cursorContext.globalAlpha = maskOpacity + 0.1; // Slightly increase opacity for cursor
        cursorContext.arc(imageX, imageY, currentCursorSize, 0, 360);
        cursorContext.fill();
        cursorContext.stroke();
      }

      // Only draw if not panning and mouse button is pressed
      if (maskContext && evt.buttons > 0 && !isPanning && !isSpaceKeyDown) {
        maskContext.beginPath();
        maskContext.fillStyle =
          evt.buttons > 1 || evt.shiftKey ? '#ffffff' : maskColor;
        maskContext.arc(imageX, imageY, currentCursorSize, 0, 360);
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
        const { x: imageX, y: imageY } = getImageCoordinates(
          evt.clientX,
          evt.clientY,
        );

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
        cursorContext.arc(imageX, imageY, newSize, 0, 360);
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
    scale,
    transform,
    getImageCoordinates,
    onCursorSizeChange,
    maskOpacity,
    isPanning,
    isSpaceKeyDown,
  ]);

  // Handle zoom with mouse wheel
  React.useEffect(() => {
    if (!enableWheelZoom || !containerRef.current) return;

    const container = containerRef.current;

    const handleWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();

      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const delta = -e.deltaY * 0.01;
      const newScale = Math.max(minScale, Math.min(maxScale, scale + delta));

      if (newScale !== scale) {
        const currentEffectiveScale = scale * baseScale;
        const newEffectiveScale = newScale * baseScale;

        const mouseXInImage = mouseX / currentEffectiveScale;
        const mouseYInImage = mouseY / currentEffectiveScale;

        const newMouseXInImage = mouseX / newEffectiveScale;
        const newMouseYInImage = mouseY / newEffectiveScale;

        const translateX =
          transform.translateX + (newMouseXInImage - mouseXInImage);
        const translateY =
          transform.translateY + (newMouseYInImage - mouseYInImage);

        setScale(newScale);
        setTransform({
          ...transform,
          scale: newScale,
          translateX,
          translateY,
        });

        onScaleChange?.(newScale);
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [
    scale,
    transform,
    baseScale,
    minScale,
    maxScale,
    enableWheelZoom,
    onScaleChange,
  ]);

  const resetZoom = React.useCallback(() => {
    setScale(1);

    if (baseScale < 1 && containerRef.current) {
      const centerOffsetX =
        (containerSize.width - size.x * baseScale) / (2 * baseScale);
      const centerOffsetY =
        (containerSize.height - size.y * baseScale) / (2 * baseScale);

      setTransform({
        scale: 1,
        translateX: centerOffsetX,
        translateY: centerOffsetY,
      });
    } else {
      setTransform({
        scale: 1,
        translateX: 0,
        translateY: 0,
      });
    }

    onScaleChange?.(1);
    if (onPanChange) {
      onPanChange(transform.translateX, transform.translateY);
    }
  }, [baseScale, containerSize, size, onScaleChange, onPanChange]);

  // Add a setPan function to programmatically set pan position
  const setPan = React.useCallback(
    (x: number, y: number) => {
      setTransform((prev) => {
        // Apply constraints if enabled
        let constrainedX = x;
        let constrainedY = y;

        if (constrainPan && containerRef.current) {
          const containerWidth = containerRef.current.clientWidth;
          const containerHeight = containerRef.current.clientHeight;
          const contentWidth = size.x * transform.scale;
          const contentHeight = size.y * transform.scale;

          // Calculate maximum pan limits to prevent showing blank space
          const maxPanX = Math.max(
            0,
            (contentWidth - containerWidth) / (2 * transform.scale),
          );
          const maxPanY = Math.max(
            0,
            (contentHeight - containerHeight) / (2 * transform.scale),
          );

          // Constrain within the calculated limits
          constrainedX = Math.min(maxPanX, Math.max(-maxPanX, x));
          constrainedY = Math.min(maxPanY, Math.max(-maxPanY, y));
        }

        // Notify parent about pan change if callback is provided
        if (
          onPanChange &&
          (prev.translateX !== constrainedX || prev.translateY !== constrainedY)
        ) {
          onPanChange(constrainedX, constrainedY);
        }

        return {
          ...prev,
          translateX: constrainedX,
          translateY: constrainedY,
        };
      });
    },
    [constrainPan, onPanChange, size, transform.scale],
  );

  // Keyboard event listeners for space key and ctrl/cmd key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if not in input element
      const tag = (e.target as HTMLElement)?.tagName;
      if (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        (e.target as HTMLElement)?.isContentEditable
      )
        return;

      // Activate panning mode with space key
      if (e.code === 'Space' && !isSpaceKeyDown && transform.scale > 1) {
        e.preventDefault();
        setIsSpaceKeyDown(true);
      }

      // Track zoom key (Ctrl/Cmd) for cursor change
      if ((e.ctrlKey || e.metaKey) && !isZoomKeyDown) {
        setIsZoomKeyDown(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsSpaceKeyDown(false);
        setIsPanning(false);
      }

      // Check if Ctrl/Cmd keys were released
      if (!e.ctrlKey && !e.metaKey && isZoomKeyDown) {
        setIsZoomKeyDown(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Also handle when window loses focus
    const handleBlur = () => {
      setIsSpaceKeyDown(false);
      setIsZoomKeyDown(false);
      setIsPanning(false);
    };

    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [isSpaceKeyDown, isZoomKeyDown, transform.scale]);

  // Pan handling with mouse events
  React.useEffect(() => {
    if (!containerRef.current || transform.scale <= 1) return;

    const container = containerRef.current;

    const handleMouseDown = (e: MouseEvent) => {
      // Middle mouse button (button === 1) or left button with space key pressed
      if (e.button === 1 || (e.button === 0 && isSpaceKeyDown)) {
        e.preventDefault();
        setIsPanning(true);
        setLastMousePosition({ x: e.clientX, y: e.clientY });

        // Add grabbing cursor class to document body
        document.body.classList.add('panning-active');
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isPanning) return;

      e.preventDefault();

      // Calculate delta movement
      const deltaX = (e.clientX - lastMousePosition.x) / transform.scale;
      const deltaY = (e.clientY - lastMousePosition.y) / transform.scale;

      // Update pan position
      setPan(transform.translateX + deltaX, transform.translateY + deltaY);

      // Update last position
      setLastMousePosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (isPanning) {
        setIsPanning(false);
        document.body.classList.remove('panning-active');
      }
    };

    // Also stop panning if mouse leaves the window
    const handleMouseLeave = () => {
      if (isPanning) {
        setIsPanning(false);
        document.body.classList.remove('panning-active');
      }
    };

    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [
    isPanning,
    isSpaceKeyDown,
    lastMousePosition,
    transform.scale,
    transform.translateX,
    transform.translateY,
    setPan,
  ]);

  // Reset pan position when scale is reset to 1
  React.useEffect(() => {
    if (transform.scale <= 1) {
      setPan(0, 0);
    }
  }, [transform.scale, setPan]);

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
          // Check if image exceeds max dimensions
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

      // Don't start drawing if we're in panning mode
      if (isPanning || isSpaceKeyDown) return;

      // Get the transformed coordinates
      const { x, y } = getImageCoordinates(e.clientX, e.clientY);

      if (maskContext) {
        maskContext.beginPath();
        maskContext.fillStyle =
          e.buttons > 1 || e.shiftKey ? '#ffffff' : maskColor;
        maskContext.arc(x, y, currentCursorSize, 0, 360);
        maskContext.fill();
      }

      setIsDrawing(true);
    },
    [
      getImageCoordinates,
      maskContext,
      currentCursorSize,
      maskColor,
      isPanning,
      isSpaceKeyDown,
    ],
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
    scale,
    setScale,
    transform,
    containerRef,
    resetZoom,
    isPanning,
    isZoomKeyDown,
    setPan,
    baseScale,
    effectiveScale,
  };
}
