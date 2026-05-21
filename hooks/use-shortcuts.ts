import { useEffect } from 'react';
import * as fabric from 'fabric';

export function useShortcuts(
  canvas: fabric.Canvas | null,
  undo: () => void,
  redo: () => void,
  saveHistory: () => void,
  handleSaveToGallery: () => void,
  deleteSelected: () => void,
  copySelected: () => void,
  pasteSelected: () => void,
) {
  useEffect(() => {
    if (!canvas) return;
    
    let isNudging = false;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in form inputs
      const isInput = document.activeElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName);
      const activeObj = canvas.getActiveObject() as fabric.IText;
      if (activeObj && activeObj.isEditing) return;
      if (isInput) return;

      const step = e.shiftKey ? 10 : 1;
      
      // Ctrl/Cmd + Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      } 
      // Ctrl/Cmd + Y
      else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        redo();
      }
      // Ctrl/Cmd + S
      else if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSaveToGallery();
      }
      // Ctrl/Cmd + C
      else if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        e.preventDefault();
        copySelected();
      }
      // Ctrl/Cmd + V
      else if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault();
        pasteSelected();
      }
      // Delete / Backspace
      else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteSelected();
      }
      // Arrow Nudges
      else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        const obj = canvas.getActiveObject();
        if (obj) {
          e.preventDefault();
          if (e.key === 'ArrowUp') obj.top! -= step;
          else if (e.key === 'ArrowDown') obj.top! += step;
          else if (e.key === 'ArrowLeft') obj.left! -= step;
          else if (e.key === 'ArrowRight') obj.left! += step;
          
          obj.setCoords();
          canvas.requestRenderAll();
          isNudging = true;
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && isNudging) {
        isNudging = false;
        saveHistory();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [canvas, undo, redo, saveHistory, handleSaveToGallery, deleteSelected, copySelected, pasteSelected]);
}
