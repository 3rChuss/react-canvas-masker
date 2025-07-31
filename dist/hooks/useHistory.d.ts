export interface HistoryState {
    imageData: ImageData;
    timestamp: number;
}
interface UseHistoryOptions {
    onUndoRequest?: () => void;
    onRedoRequest?: () => void;
    maxHistorySize?: number;
}
export declare function useHistory(context: CanvasRenderingContext2D | null, size: {
    x: number;
    y: number;
}, options?: UseHistoryOptions): {
    history: HistoryState[];
    historyIndex: number;
    saveToHistory: () => void;
    restoreFromHistory: (index: number) => void;
    undo: () => void;
    redo: () => void;
    clear: () => void;
};
export {};
//# sourceMappingURL=useHistory.d.ts.map