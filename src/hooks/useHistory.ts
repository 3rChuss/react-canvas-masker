import * as React from 'react';

export interface HistoryState {
  imageData: ImageData;
  timestamp: number;
}

interface UseHistoryOptions {
  onUndoRequest?: () => void;
  onRedoRequest?: () => void;
  maxHistorySize?: number;
}

export function useHistory(
  context: CanvasRenderingContext2D | null,
  size: { x: number; y: number },
  options: UseHistoryOptions = {},
) {
  const { onUndoRequest, onRedoRequest, maxHistorySize = 50 } = options;

  const [history, setHistory] = React.useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = React.useState(-1);

  // Save current state to history
  const saveToHistory = React.useCallback(() => {
    if (!context || size.x === 0 || size.y === 0) return;

    try {
      const imageData = context.getImageData(0, 0, size.x, size.y);
      const newState: HistoryState = {
        imageData,
        timestamp: Date.now(),
      };

      setHistory((prev) => {
        // Remove any "future" states if we're in the middle of the history
        const newHistory = prev.slice(0, historyIndex + 1);
        newHistory.push(newState);

        // Limit history size
        return newHistory.slice(-maxHistorySize);
      });

      setHistoryIndex((prev) => Math.min(prev + 1, maxHistorySize - 1));
    } catch (error) {
      // Avoid crash if canvas is not ready
      console.warn('Failed to save history state:', error);
    }
  }, [context, size, historyIndex, maxHistorySize]);

  // Restore from history at specified index
  const restoreFromHistory = React.useCallback(
    (index: number) => {
      if (!context || size.x === 0 || size.y === 0) return;

      if (index < -1 || index >= history.length) return;

      if (index === -1) {
        // Special case: clear canvas
        context.clearRect(0, 0, size.x, size.y);
        setHistoryIndex(-1);
        return;
      }

      if (history[index]) {
        context.putImageData(history[index].imageData, 0, 0);
        setHistoryIndex(index);
      }
    },
    [history, context, size],
  );

  // Undo action
  const undo = React.useCallback(() => {
    restoreFromHistory(historyIndex - 1);
    onUndoRequest?.();
  }, [restoreFromHistory, historyIndex, onUndoRequest]);

  // Redo action
  const redo = React.useCallback(() => {
    if (history[historyIndex + 1]) {
      restoreFromHistory(historyIndex + 1);
      onRedoRequest?.();
    }
  }, [restoreFromHistory, history, historyIndex, onRedoRequest]);

  // Clear all history
  const clear = React.useCallback(() => {
    if (!context || size.x === 0 || size.y === 0) return;

    context.clearRect(0, 0, size.x, size.y);
    setHistory([]);
    setHistoryIndex(-1);
  }, [context, size]);

  // Return the history management functions and state
  return {
    history,
    historyIndex,
    saveToHistory,
    restoreFromHistory,
    undo,
    redo,
    clear,
  };
}
