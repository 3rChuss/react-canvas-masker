import React from 'react';
export interface ZoomPanOptions {
    initialScale?: number;
    minScale?: number;
    maxScale?: number;
    enableWheelZoom?: boolean;
    constrainPan?: boolean;
    onScaleChange?: (scale: number) => void;
    onPanChange?: (x: number, y: number) => void;
}
export interface ZoomPanState {
    scale: number;
    transform: {
        scale: number;
        translateX: number;
        translateY: number;
    };
    baseScale: number;
    effectiveScale: number;
    isPanning: boolean;
    isSpaceKeyDown: boolean;
    isZoomKeyDown: boolean;
}
export interface ZoomPanActions {
    setScale: React.Dispatch<React.SetStateAction<number>>;
    resetZoom: () => void;
    setPan: (x: number, y: number) => void;
    getImageCoordinates: (clientX: number, clientY: number) => {
        x: number;
        y: number;
    };
    zoomIn: () => void;
    zoomOut: () => void;
}
export declare function useZoomPan(containerRef: React.RefObject<HTMLDivElement>, contentSize: {
    x: number;
    y: number;
}, options?: ZoomPanOptions): [ZoomPanState, ZoomPanActions];
//# sourceMappingURL=useZoomPan.d.ts.map