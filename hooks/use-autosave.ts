import { useEffect, useRef } from 'react';
import * as fabric from 'fabric';
import { get, set, del } from 'idb-keyval';
import { HISTORY_STORE_PROPS } from './use-history';
import { toast } from 'sonner';

export function useAutosave(canvas: fabric.Canvas | null, saveHistory: () => void) {
  const isInitialLoad = useRef(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!canvas) return;

    const loadAutosave = async () => {
      try {
        const savedState = await get('cinetext_autosave');
        if (savedState) {
          toast('Previous session found', {
            action: {
              label: 'Restore',
              onClick: () => {
                canvas.loadFromJSON(savedState).then(() => {
                  canvas.requestRenderAll();
                  saveHistory(); // ensure history is updated
                  toast.success('Session restored');
                });
              }
            },
            cancel: {
              label: 'Discard',
              onClick: () => {
                del('cinetext_autosave');
              }
            },
            duration: 10000,
          });
        }
      } catch (e) {
        console.error('Failed to load autosave', e);
      }
    };

    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      loadAutosave();
    }
  }, [canvas, saveHistory]);

  useEffect(() => {
    if (!canvas) return;

    const saveToIdb = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        try {
          const json = JSON.stringify(canvas.toObject(HISTORY_STORE_PROPS));
          // If the canvas is empty, maybe don't auto-save, or do save to clear?
          // We can check if it has objects to avoid clearing incorrectly.
          if (canvas.getObjects().length > 0) {
            set('cinetext_autosave', json).catch(e => console.error('Auto-save failed', e));
          } else {
            del('cinetext_autosave').catch(e => console.error('Auto-save clear failed', e));
          }
        } catch (e) {
          console.error('Failed to serialize for autosave', e);
        }
      }, 1000); // 1s debounce
    };

    canvas.on('object:modified', saveToIdb);
    canvas.on('object:added', saveToIdb);
    canvas.on('object:removed', saveToIdb);

    return () => {
      canvas.off('object:modified', saveToIdb);
      canvas.off('object:added', saveToIdb);
      canvas.off('object:removed', saveToIdb);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [canvas]);

  const clearAutosave = async () => {
    try {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      await del('cinetext_autosave');
    } catch (e) {
      console.error('Failed to clear autosave', e);
    }
  };

  return { clearAutosave };
}
