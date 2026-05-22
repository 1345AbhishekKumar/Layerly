import { useEffect, useRef } from 'react';
import * as fabric from 'fabric';
import { get, set, del } from 'idb-keyval';
import { HISTORY_STORE_PROPS } from './use-history';
import { toast } from 'sonner';
import { reCenterComposition } from '../lib/fabric-utils';

export function useAutosave(
  canvas: fabric.Canvas | null, 
  saveHistory: () => void,
  onGalleryAutoSave?: () => void
) {
  const isInitialLoad = useRef(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const galleryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const onGalleryAutoSaveRef = useRef(onGalleryAutoSave);

  useEffect(() => {
    onGalleryAutoSaveRef.current = onGalleryAutoSave;
  }, [onGalleryAutoSave]);

  useEffect(() => {
    if (!canvas) return;

    const loadAutosave = async () => {
      try {
        const savedState = await get('cinetext_autosave');
        // Only auto-restore if we have a saved state AND the canvas is currently empty
        if (savedState && canvas.getObjects().length === 0) {
          const parsedState = typeof savedState === 'string' ? JSON.parse(savedState) : savedState;
          canvas.loadFromJSON(parsedState).then(() => {
            reCenterComposition(canvas);
            canvas.requestRenderAll();
            saveHistory(); // ensure history is updated
            toast.success('Restored your previous work');
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
      // 1. Session Recovery (1s debounce)
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        try {
          const json = JSON.stringify(canvas.toObject(HISTORY_STORE_PROPS));
          if (canvas.getObjects().length > 0) {
            set('cinetext_autosave', json).catch(e => console.error('Auto-save failed', e));
          } else {
            del('cinetext_autosave').catch(e => console.error('Auto-save clear failed', e));
          }
        } catch (e) {
          console.error('Failed to serialize for autosave', e);
        }
      }, 1000); 

      // 2. Gallery Auto-save (3s debounce)
      if (onGalleryAutoSaveRef.current) {
        if (galleryTimeoutRef.current) clearTimeout(galleryTimeoutRef.current);
        galleryTimeoutRef.current = setTimeout(() => {
          onGalleryAutoSaveRef.current?.();
        }, 3000);
      }
    };

    canvas.on('object:modified', saveToIdb);
    canvas.on('object:added', saveToIdb);
    canvas.on('object:removed', saveToIdb);

    return () => {
      canvas.off('object:modified', saveToIdb);
      canvas.off('object:added', saveToIdb);
      canvas.off('object:removed', saveToIdb);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (galleryTimeoutRef.current) clearTimeout(galleryTimeoutRef.current);
    };
  }, [canvas]);

  const clearAutosave = async () => {
    try {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (galleryTimeoutRef.current) clearTimeout(galleryTimeoutRef.current);
      await del('cinetext_autosave');
    } catch (e) {
      console.error('Failed to clear autosave', e);
    }
  };

  return { clearAutosave };
}
