import * as React from 'react';
import { HistoryState } from './useHistory';
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
    maskBlendMode?: 'normal' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten' | 'color-dodge' | 'color-burn' | 'hard-light' | 'soft-light' | 'difference' | 'exclusion' | 'hue' | 'saturation' | 'color' | 'luminosity';
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
    size: {
        x: number;
        y: number;
    };
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
    effectiveScale: number;
}
export declare const MaskEditorDefaults: {
    cursorSize: number;
    maskOpacity: number;
    maskColor: string;
    maskBlendMode: string;
    scale: number;
    minScale: number;
    maxScale: number;
    enableWheelZoom: boolean;
    constrainPan: boolean;
};
export declare function useMaskEditor(props: UseMaskEditorProps): UseMaskEditorReturn;
//# sourceMappingURL=useMaskEditor.d.ts.map