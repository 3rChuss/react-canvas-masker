import * as React from "react";
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
    maskBlendMode?: "normal" | "multiply" | "screen" | "overlay" | "darken" | "lighten" | "color-dodge" | "color-burn" | "hard-light" | "soft-light" | "difference" | "exclusion" | "hue" | "saturation" | "color" | "luminosity";
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
    size: {
        x: number;
        y: number;
    };
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
export declare const MaskEditorDefaults: {
    cursorSize: number;
    maskOpacity: number;
    maskColor: string;
    maskBlendMode: string;
};
export declare function useMaskEditor(props: UseMaskEditorProps): UseMaskEditorReturn;
