'use client';

import React, { useState } from 'react';
import * as fabric from 'fabric';
import { Eye, EyeOff, Lock, Unlock, Plus, Trash2, AlertCircle } from 'lucide-react';
import { CustomFabricObject } from '../types/editor';
import { cn } from '../lib/utils';
import { enforceLayerOrder, LAYER_IDS, insertBelowForeground } from '../lib/fabric-utils';

interface LayersPanelProps {
  canvas: fabric.Canvas | null;
  activeObject: fabric.Object | null;
  isCompact?: boolean;
}

export function LayersPanel({ canvas, activeObject, isCompact }: LayersPanelProps) {
  const [, forceUpdate] = React.useReducer((x) => x + 1, 0);
  const [deletingObj, setDeletingObj] = useState<CustomFabricObject | null>(null);

  // Re-render when objects change
  React.useEffect(() => {
    if (!canvas) return;

    const update = () => forceUpdate();
    canvas.on('object:added', update);
    canvas.on('object:removed', update);
    canvas.on('object:modified', update);
    return () => {
      canvas.off('object:added', update);
      canvas.off('object:removed', update);
      canvas.off('object:modified', update);
    };
  }, [canvas]);

  if (!canvas) return null;

  // Fabric's getObjects() returns objects ordered from back to front (bottom to top)
  // For the UI, we want top to bottom
  const objects = [...canvas.getObjects()].reverse() as CustomFabricObject[];

  const toggleVisibility = (obj: CustomFabricObject) => {
    obj.set('visible', !obj.visible);
    canvas.requestRenderAll();
    forceUpdate();
  };

  const activeObjects = canvas.getActiveObjects();

  const toggleLock = (obj: CustomFabricObject) => {
    const isLocked = obj.lockMovementX;
    obj.set({
      lockMovementX: !isLocked,
      lockMovementY: !isLocked,
      lockRotation: !isLocked,
      lockScalingX: !isLocked,
      lockScalingY: !isLocked,
      hasControls: isLocked, // true when unlocking
      selectable: isLocked,
      evented: isLocked || obj.id === LAYER_IDS.BASE_IMAGE // base image usually isn't evented but can be if we want
    });
    canvas.discardActiveObject();
    canvas.requestRenderAll();
    forceUpdate();
  };

  const moveUp = (obj: CustomFabricObject) => {
    canvas.bringObjectForward(obj);
    canvas.requestRenderAll();
    forceUpdate();
  };

  const moveDown = (obj: CustomFabricObject) => {
    canvas.sendObjectBackwards(obj);
    canvas.requestRenderAll();
    forceUpdate();
  };

  const confirmDelete = () => {
    if (deletingObj && canvas) {
      if (deletingObj.id !== LAYER_IDS.BASE_IMAGE && deletingObj.id !== LAYER_IDS.FOREGROUND_IMAGE) {
        canvas.remove(deletingObj);
        canvas.discardActiveObject();
        canvas.requestRenderAll();
      }
    }
    setDeletingObj(null);
  };

  const addImageLayer = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (f) => {
        const data = f.target?.result as string;
        fabric.FabricImage.fromURL(data).then((img) => {
          // Calculate scale to fit canvas
          const cw = canvas.width || 800;
          const ch = canvas.height || 600;
          const targetW = cw * 0.5;
          const targetH = ch * 0.5;
          const scale = Math.min(targetW / (img.width || 1), targetH / (img.height || 1));

          img.set({
            scaleX: scale,
            scaleY: scale,
            originX: 'center',
            originY: 'center',
            left: cw / 2,
            top: ch / 2,
            perPixelTargetFind: true,
          });
          
          (img as CustomFabricObject).id = `img-${Date.now()}`;
          (img as CustomFabricObject).name = file.name;
          
          insertBelowForeground(canvas, img as CustomFabricObject);
          canvas.setActiveObject(img);
          canvas.requestRenderAll();
          forceUpdate();
        });
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  return (
    <div className={cn("space-y-4", isCompact && "space-y-3")}>
      <div className={cn("flex justify-between items-center mb-4", isCompact && "mb-2")}>
        <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Layers</h2>
        <button 
          onClick={addImageLayer}
          className="bg-neutral-800 hover:bg-neutral-700 text-white p-1 rounded transition-colors"
          title="Add Image Layer"
        >
          <Plus className={cn("w-4 h-4", isCompact && "w-3.5 h-3.5")} />
        </button>
      </div>

      <div className={cn("space-y-2", isCompact && "space-y-1.5")}>
        {objects.map((obj, i) => {
          const isBase = obj.id === LAYER_IDS.BASE_IMAGE;
          const isFg = obj.id === LAYER_IDS.FOREGROUND_IMAGE;
          const isText = obj.type === 'i-text';
          const isGroup = obj.type === 'group';
          const isActive = activeObjects.includes(obj);
          
          let displayName = obj.name || 'Layer';
          if (isBase) displayName = 'Base Background';
          if (isFg) displayName = 'Extracted Subject';
          if (isText) displayName = `Text: ${(obj as fabric.IText).text?.substring(0, 10)}...`;
          if (isGroup) displayName = 'Grouped Layer';

          const isLocked = obj.lockMovementX;

          return (
            <div 
              key={obj.id ? `${obj.id}-${i}` : i}
              className={cn(
                "flex items-center gap-2 rounded-lg bg-neutral-800/30 border border-neutral-700/30 transition-colors",
                isCompact ? "p-1.5" : "p-2",
                isActive && "border-indigo-500/50 bg-indigo-500/10"
              )}
              onClick={(e) => {
                if (!isLocked) {
                  if (e.shiftKey) {
                    // Multi-select
                    let currentActive = canvas.getActiveObjects();
                    if (currentActive.includes(obj)) {
                      // Remove from selection
                      const newSelection = currentActive.filter(o => o !== obj);
                      canvas.discardActiveObject();
                      if (newSelection.length > 1) {
                        const sel = new fabric.ActiveSelection(newSelection, { canvas });
                        canvas.setActiveObject(sel);
                      } else if (newSelection.length === 1) {
                        canvas.setActiveObject(newSelection[0]);
                      }
                    } else {
                      // Add to selection
                      currentActive.push(obj);
                      canvas.discardActiveObject();
                      const sel = new fabric.ActiveSelection(currentActive, { canvas });
                      canvas.setActiveObject(sel);
                    }
                  } else {
                    // Single select
                    canvas.setActiveObject(obj);
                  }
                  canvas.requestRenderAll();
                }
              }}
            >
              <button 
                className="text-neutral-500 hover:text-white transition-colors p-1"
                onClick={(e) => { e.stopPropagation(); toggleVisibility(obj); }}
              >
                {obj.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
              
              <div className="flex-1 overflow-hidden">
                <p className="text-sm text-neutral-200 truncate select-none">{displayName}</p>
              </div>

              <div className="flex items-center gap-1">
                <button 
                  className="text-neutral-500 hover:text-white transition-colors p-1"
                  onClick={(e) => { e.stopPropagation(); toggleLock(obj); }}
                >
                  {isLocked ? <Lock className="w-3 h-3 text-red-400" /> : <Unlock className="w-3 h-3" />}
                </button>
                <div className="flex flex-col ml-1">
                  <button 
                    disabled={i === 0} // cannot move up if already top
                    className="text-neutral-500 hover:text-white disabled:opacity-30 disabled:hover:text-neutral-500 transition-colors"
                    onClick={(e) => { e.stopPropagation(); moveUp(obj); }}
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                  </button>
                  <button 
                    disabled={i === objects.length - 1} // cannot move down if already bottom
                    className="text-neutral-500 hover:text-white disabled:opacity-30 disabled:hover:text-neutral-500 transition-colors"
                    onClick={(e) => { e.stopPropagation(); moveDown(obj); }}
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </button>
                </div>
                {!isBase && !isFg && (
                  <button 
                    className="text-neutral-500 hover:text-red-400 transition-colors p-1 ml-1"
                    onClick={(e) => { e.stopPropagation(); setDeletingObj(obj); }}
                    title="Delete Layer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {objects.length === 0 && (
          <div className="text-center text-neutral-500 text-sm mt-4">
            No layers found.
          </div>
        )}
      </div>

      {deletingObj && (
        <div className="absolute inset-0 z-50 bg-neutral-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-5 w-full max-w-sm shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-red-500/10 text-red-400 rounded-full">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-medium text-white mb-1">Delete Layer?</h3>
                <p className="text-sm text-neutral-400">
                  Are you sure you want to delete <span className="font-semibold text-white">{deletingObj.name || 'this layer'}</span>? This action can be undone later.
                </p>
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button 
                onClick={() => setDeletingObj(null)}
                className="px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 bg-neutral-800 border border-neutral-600 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                className="px-4 py-2 text-sm font-medium text-white hover:bg-red-500 bg-red-600 rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
