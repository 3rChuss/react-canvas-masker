import * as React from "react";
import "./maskEditor.less";
export interface MaskEditorProps {
    src: string;
    canvasRef?: React.MutableRefObject<HTMLCanvasElement>;
    cursorSize?: number;
    onCursorSizeChange?: (size: number) => void;
    maskOpacity?: number;
    maskColor?: string;
    maskBlendMode?: "normal" | "multiply" | "screen" | "overlay" | "darken" | "lighten" | "color-dodge" | "color-burn" | "hard-light" | "soft-light" | "difference" | "exclusion" | "hue" | "saturation" | "color" | "luminosity";
}
export declare const MaskEditorDefaults: {
    cursorSize: number;
    maskOpacity: number;
    maskColor: string;
    maskBlendMode: string;
};
export declare const MaskEditor: React.FC<MaskEditorProps>;
