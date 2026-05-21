import { useState, useCallback, useRef, useEffect } from 'react';
import * as fabric from 'fabric';

export const HISTORY_STORE_PROPS = ['id', 'name', 'isForeground', 'selectable', 'evented'];

export function useHistory(canvas: fabric.Canvas | null) {
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isProcessingRef = useRef(false);

  const saveHistory = useCallback(() => {
    if (!canvas || isProcessingRef.current) return;

    const json = JSON.stringify(canvas.toObject(HISTORY_STORE_PROPS));

    setHistory((prev) => {
      // If we are not at the end of the history, we branch off
      const nextHistory = prev.slice(0, historyIndex + 1);
      nextHistory.push(json);
      // Keep only last 50 states
      if (nextHistory.length > 50) {
        nextHistory.shift();
        return nextHistory;
      }
      return nextHistory;
    });

    setHistoryIndex((prev) => {
        if (history.slice(0, historyIndex + 1).length >= 50) return 49;
        return prev + 1;
    });
  }, [canvas, history, historyIndex]);

  const undo = useCallback(() => {
    if (!canvas || historyIndex <= 0) return;

    isProcessingRef.current = true;
    const previousIndex = historyIndex - 1;
    const previousState = history[previousIndex];

    setHistoryIndex(previousIndex);
    
    canvas.loadFromJSON(previousState).then(() => {
      canvas.renderAll();
      canvas.fire('selection:cleared');
      isProcessingRef.current = false;
    });
  }, [canvas, history, historyIndex]);

  const redo = useCallback(() => {
    if (!canvas || historyIndex >= history.length - 1) return;

    isProcessingRef.current = true;
    const nextIndex = historyIndex + 1;
    const nextState = history[nextIndex];

    setHistoryIndex(nextIndex);

    canvas.loadFromJSON(nextState).then(() => {
      canvas.renderAll();
      canvas.fire('selection:cleared');
      isProcessingRef.current = false;
    });

  }, [canvas, history, historyIndex]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    setHistoryIndex(-1);
  }, []);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // Initialize history on first load
  useEffect(() => {
    if (canvas && history.length === 0) {
       saveHistory();
    }
  }, [canvas, history.length, saveHistory]);

  return { undo, redo, saveHistory, canUndo, canRedo, clearHistory };
}
