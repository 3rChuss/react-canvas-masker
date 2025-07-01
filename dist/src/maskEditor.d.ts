import * as React from "react";
import "./maskEditor.less";
export interface HistoryState {
    imageData: ImageData;
    timestamp: number;
}
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
    maskBlendMode?: "normal" | "multiply" | "screen" | "overlay" | "darken" | "lighten" | "color-dodge" | "color-burn" | "hard-light" | "soft-light" | "difference" | "exclusion" | "hue" | "saturation" | "color" | "luminosity";
    onDrawingChange: (isDrawing: boolean) => void;
    onUndoRequest?: () => void;
    onRedoRequest?: () => void;
}
export declare const MaskEditorDefaults: {
    cursorSize: number;
    maskOpacity: number;
    maskColor: string;
    maskBlendMode: string;
};
export declare const MaskEditor: React.FC<MaskEditorProps>;
