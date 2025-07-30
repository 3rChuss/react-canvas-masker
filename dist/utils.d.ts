export declare const toMask: (canvas: HTMLCanvasElement) => string;
export declare const hexToRgb: (color: string) => number[];
export declare function simpleDebounce<T extends (...args: any[]) => void>(fn: T, wait: number): T & {
    cancel: () => void;
};
//# sourceMappingURL=utils.d.ts.map