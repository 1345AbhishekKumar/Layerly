'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as fabric from 'fabric';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

import { cn } from '../lib/utils';
import { useBackgroundRemoval } from '../hooks/use-background-removal';
import { useHistory, HISTORY_STORE_PROPS } from '../hooks/use-history';
import { useAutosave } from '../hooks/use-autosave';
import { useShortcuts } from '../hooks/use-shortcuts';
import { useGallery } from '../hooks/use-gallery';
import { useIsMobile } from '../hooks/use-mobile';
import { addTextToCanvas, LAYER_IDS, enforceLayerOrder, reCenterComposition } from '../lib/fabric-utils';
import { CustomFabricObject } from '../types/editor';

import { EditorStoreProvider, useEditorStore } from '../providers/editor-store-provider';
import { TopNavbar } from './editor/TopNavbar';
import { LeftToolbar } from './editor/LeftToolbar';
import { WorkspaceCanvas } from './editor/WorkspaceCanvas';
import { RightSidebar } from './editor/RightSidebar';
import { GalleryModal } from './GalleryModal';
import { ExportModal } from './ExportModal';

// Inner component that consumes store
function EditorInner() {
  const canvas = useEditorStore((s) => s.canvas);
  const setCanvas = useEditorStore((s) => s.setCanvas);
  const setActiveObject = useEditorStore((s) => s.setActiveObject);
  const setIsExporting = useEditorStore((s) => s.setIsExporting);
  const isEraserMode = useEditorStore((s) => s.isEraserMode);
  const eraserSize = useEditorStore((s) => s.eraserSize);
  const isGalleryOpen = useEditorStore((s) => s.isGalleryOpen);
  const setIsGalleryOpen = useEditorStore((s) => s.setIsGalleryOpen);
  const clipboard = useEditorStore((s) => s.clipboard);
  const setClipboard = useEditorStore((s) => s.setClipboard);
  const setHoverState = useEditorStore((s) => s.setHoverState);
  const isCompact = useEditorStore((s) => s.isCompact);
  const currentGalleryId = useEditorStore((s) => s.currentGalleryId);
  const setCurrentGalleryId = useEditorStore((s) => s.setCurrentGalleryId);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  
  const { removeBackground, isProcessing: bgProcessing, progress } = useBackgroundRemoval();
  const { undo, redo, saveHistory, canUndo, canRedo, clearHistory } = useHistory(canvas);
  const { images, saveImageToGallery, deleteImage, isLoading: isGalleryLoading } = useGallery();

  const handleSaveToGallery = useCallback(async (isAuto = false) => {
    if (!canvas || canvas.getObjects().length === 0) return;
    
    let options: any = { format: 'jpeg', quality: 0.6, multiplier: 0.5 };
    const baseImg = canvas.getObjects().find((obj: any) => obj.id === LAYER_IDS.BASE_IMAGE);
    
    if (baseImg) {
      options = {
        ...options,
        left: baseImg.left!, top: baseImg.top!,
        width: baseImg.width! * baseImg.scaleX!,
        height: baseImg.height! * baseImg.scaleY!,
      };
    }
    
    try {
      const thumbUrl = canvas.toDataURL(options);
      const result = await saveImageToGallery(thumbUrl, canvas.toObject(HISTORY_STORE_PROPS), currentGalleryId || undefined);
      
      if (!currentGalleryId && result?.id) {
        setCurrentGalleryId(result.id);
      }
      
      if (!isAuto) toast.success('Saved to gallery!');
    } catch (e) {
      console.error('Save to gallery failed', e);
      if (!isAuto) toast.error('Save failed. Make sure you only use local images to avoid CORS issues.');
    }
  }, [canvas, currentGalleryId, saveImageToGallery, setCurrentGalleryId]);

  const handleLoadFromGallery = useCallback((image: any) => {
    if (!canvas || !image.canvasState) return;
    setCurrentGalleryId(image.id);
    canvas.loadFromJSON(image.canvasState).then(() => {
      reCenterComposition(canvas);
      canvas.renderAll();
      saveHistory(); 
      setIsGalleryOpen(false);
    });
  }, [canvas, saveHistory, setIsGalleryOpen, setCurrentGalleryId]);

  const handleGalleryAutoSave = useCallback(() => {
    if (currentGalleryId) {
      handleSaveToGallery(true);
    }
  }, [currentGalleryId, handleSaveToGallery]);

  const { clearAutosave } = useAutosave(canvas, saveHistory, handleGalleryAutoSave);

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Zen Mode states
  useEffect(() => {
    if (!isCompact || isMobile) return;

    let rAF = 0;
    let currentTop = false;
    let currentLeft = false;
    let currentRight = false;
    let currentBottom = false;

    const handleMouseMove = (e: MouseEvent) => {
      cancelAnimationFrame(rAF);
      rAF = requestAnimationFrame(() => {
        const { clientX, clientY } = e;
        const { innerWidth, innerHeight } = window;
        
        const topHover = clientY <= 120;
        const leftHover = clientX <= 120;
        const rightHover = clientX >= innerWidth - 320;
        const bottomHover = clientY >= innerHeight - 120;

        if (topHover !== currentTop || leftHover !== currentLeft || rightHover !== currentRight || bottomHover !== currentBottom) {
          currentTop = topHover;
          currentLeft = leftHover;
          currentRight = rightHover;
          currentBottom = bottomHover;
          
          setHoverState({ top: topHover, left: leftHover, right: rightHover, bottom: bottomHover });
        }
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(rAF);
    };
  }, [isCompact, isMobile, setHoverState]);

  useEffect(() => {
    (async () => {
      const WebFont = (await import('webfontloader')).default;
      WebFont.load({
        google: {
          families: ['Space Grotesk:300,400,500,600,700', 'Inter:400,500,700']
        }
      });
    })();
  }, []);

  // History Events
  useEffect(() => {
    if (!canvas) return;
    const handleSave = () => {
      import('../lib/fabric-utils').then(({ enforceLayerOrder }) => {
        enforceLayerOrder(canvas);
      });
      saveHistory();
    };
    
    canvas.on('object:modified', handleSave);
    canvas.on('object:added', handleSave);
    canvas.on('object:removed', handleSave);
    
    return () => {
      canvas.off('object:modified', handleSave);
      canvas.off('object:added', handleSave);
      canvas.off('object:removed', handleSave);
    };
  }, [canvas, saveHistory]);

  // Eraser Settings
  useEffect(() => {
    if (!canvas) return;
    
    if (isEraserMode) {
      // eslint-disable-next-line react-hooks/immutability
      canvas.isDrawingMode = true;
      const brush = new fabric.PencilBrush(canvas);
      brush.width = eraserSize;
      brush.color = 'rgba(0,0,0,1)'; 
      canvas.freeDrawingBrush = brush;
    } else {
      canvas.isDrawingMode = false;
    }
  }, [canvas, isEraserMode, eraserSize]);

  useEffect(() => {
    if (!canvas) return;
    const handlePathCreated = (e: any) => {
      if (isEraserMode) {
        const path = e.path;
        canvas.remove(path); // Remove from main canvas
        
        const fgImg = canvas.getObjects().find(o => (o as CustomFabricObject).id === LAYER_IDS.FOREGROUND_IMAGE) as fabric.Image;
        
        if (fgImg) {
          if (!fgImg.clipPath) {
            fgImg.clipPath = new fabric.Group([], {
              inverted: true,
              absolutePositioned: true
            });
          }
          
          (fgImg.clipPath as fabric.Group).add(path);
          canvas.requestRenderAll();
          saveHistory();
        }
      }
    };
    canvas.on('path:created', handlePathCreated);
    return () => { canvas.off('path:created', handlePathCreated); };
  }, [canvas, isEraserMode, saveHistory]);

  // Canvas Init
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;
    
    const initCanvas = new fabric.Canvas(canvasRef.current, {
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      preserveObjectStacking: true,
      backgroundColor: '#111111',
      selectionBorderColor: '#6366f1',
      selectionColor: 'rgba(99, 102, 241, 0.1)'
    });

    setCanvas(initCanvas);

    initCanvas.on('selection:created', () => setActiveObject(initCanvas.getActiveObject() || null));
    initCanvas.on('selection:updated', () => setActiveObject(initCanvas.getActiveObject() || null));
    initCanvas.on('selection:cleared', () => setActiveObject(null));

    let prevWidth = 0;
    let prevHeight = 0;

    const resizeObserver = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      
      // Initialize on first run
      if (prevWidth === 0 || prevHeight === 0) {
        prevWidth = width;
        prevHeight = height;
        initCanvas.setDimensions({ width, height });
        return;
      }

      const dx = (width - prevWidth) / 2;
      const dy = (height - prevHeight) / 2;
      
      initCanvas.setDimensions({ width, height });

      // Only shift if there is a meaningful change (> 0.5px) to avoid sub-pixel jitter
      if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
        initCanvas.getObjects().forEach(obj => {
          obj.set({
            left: (obj.left || 0) + dx,
            top: (obj.top || 0) + dy
          });
          
          // Shift clipPath if it's absolute positioned
          if (obj.clipPath && obj.clipPath.absolutePositioned) {
            obj.clipPath.set({
              left: (obj.clipPath.left || 0) + dx,
              top: (obj.clipPath.top || 0) + dy
            });
          }
          
          obj.setCoords();
        });
      }

      prevWidth = width;
      prevHeight = height;
      initCanvas.renderAll();
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      initCanvas.dispose();
    };
  }, [setCanvas, setActiveObject]);

  // Actions
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!acceptedFiles.length || !canvas) return;
    const file = acceptedFiles[0];
    
    setCurrentGalleryId(null);
    clearAutosave();
    canvas.clear();
    clearHistory();
    canvas.set({ backgroundColor: '#111' });

    const reader = new FileReader();
    reader.onload = (f) => {
      const data = f.target?.result as string;
      fabric.FabricImage.fromURL(data).then(async (baseImg) => {
        const cw = canvas.width!;
        const ch = canvas.height!;
        const targetW = cw * 0.9;
        const targetH = ch * 0.9;
        const scale = Math.min(targetW / baseImg.width!, targetH / baseImg.height!);

        baseImg.set({
          scaleX: scale, scaleY: scale,
          originX: 'center', originY: 'center',
          left: cw / 2, top: ch / 2,
          selectable: false, evented: false, 
        });

        (baseImg as CustomFabricObject).id = LAYER_IDS.BASE_IMAGE;
        canvas.add(baseImg);
        canvas.sendObjectToBack(baseImg);

        addTextToCanvas(canvas);

        try {
          const fgUrl = await removeBackground(file);
          fabric.FabricImage.fromURL(fgUrl).then((fgImg) => {
            fgImg.set({
              scaleX: scale, scaleY: scale,
              originX: 'center', originY: 'center',
              left: cw / 2, top: ch / 2,
              selectable: false, evented: false, 
              perPixelTargetFind: true,
            });
            (fgImg as CustomFabricObject).id = LAYER_IDS.FOREGROUND_IMAGE;
            canvas.add(fgImg);
            canvas.bringObjectToFront(fgImg);
            canvas.requestRenderAll();
          });
        } catch(e) {
          console.error(e);
        }
      });
    };
    reader.readAsDataURL(file);
    
  }, [canvas, removeBackground, clearHistory, clearAutosave, setCurrentGalleryId]);

  const handleManualUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onDrop([e.target.files[0]]);
    }
  };

  const handleExport = () => {
    if (!canvas || canvas.getObjects().length === 0) {
      toast.error('Nothing to export!');
      return;
    }
    setIsExportModalOpen(true);
  };

  const copySelected = useCallback(() => {
    if (!canvas) return;
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
      activeObject.clone().then((cloned: any) => setClipboard(cloned));
    }
  }, [canvas, setClipboard]);

  const pasteSelected = useCallback(() => {
    if (!canvas || !clipboard) return;
    clipboard.clone().then((clonedObj: any) => {
      canvas.discardActiveObject();
      clonedObj.set({
        left: clonedObj.left + 10,
        top: clonedObj.top + 10,
        evented: true,
      });
      if (clonedObj.type === 'activeSelection') {
        clonedObj.canvas = canvas;
        clonedObj.forEachObject((obj: any) => canvas.add(obj));
        clonedObj.setCoords();
      } else {
        if (clonedObj.id) clonedObj.id = uuidv4();
        canvas.add(clonedObj);
      }
      canvas.setActiveObject(clonedObj);
      canvas.requestRenderAll();
      saveHistory();
    });
  }, [canvas, clipboard, saveHistory]);

  const deleteSelected = useCallback(() => {
    if (!canvas) return;
    const activeObjects = canvas.getActiveObjects();
    let removed = false;
    activeObjects.forEach(obj => {
      if ((obj as CustomFabricObject).id !== LAYER_IDS.BASE_IMAGE && (obj as CustomFabricObject).id !== LAYER_IDS.FOREGROUND_IMAGE) {
        canvas.remove(obj);
        removed = true;
      }
    });
    if (removed) {
      canvas.discardActiveObject();
      canvas.requestRenderAll();
      saveHistory();
    }
  }, [canvas, saveHistory]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      if (typeof document.documentElement.requestFullscreen === 'function') {
        document.documentElement.requestFullscreen().catch(err => {
          console.error(`Error attempting to enable fullscreen: ${err.message}`);
        });
      }
    } else {
      if (typeof document.exitFullscreen === 'function') {
        document.exitFullscreen();
      }
    }
  }, []);

  useShortcuts(
    canvas, undo, redo, saveHistory, handleSaveToGallery,
    deleteSelected, copySelected, pasteSelected
  );

  return (
    <div className="absolute inset-0 flex bg-neutral-950 text-white overflow-hidden font-sans">
      <TopNavbar 
        undo={undo} redo={redo} canUndo={canUndo} canRedo={canRedo}
        handleSaveToGallery={handleSaveToGallery}
        handleExport={handleExport}
        toggleFullscreen={toggleFullscreen}
      />

      <div className={cn("flex flex-1 w-full h-full relative overflow-hidden transition-all duration-500", isCompact ? "pt-0" : "pt-16")}>
        <LeftToolbar onManualUpload={handleManualUpload} />
        
        <WorkspaceCanvas 
          canvasRef={canvasRef} 
          containerRef={containerRef} 
          onDropFiles={onDrop} 
          bgProcessing={bgProcessing} 
          progress={progress} 
        />
        
        <RightSidebar />
      </div>

      <GalleryModal 
        isOpen={isGalleryOpen} 
        onClose={() => setIsGalleryOpen(false)} 
        images={images} 
        onDelete={deleteImage}
        onEdit={handleLoadFromGallery}
        isLoading={isGalleryLoading}
      />

      <ExportModal 
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />
    </div>
  );
}

// Ensure context wraps correctly by exporting the final Editor
export function Editor() {
  return (
    <EditorStoreProvider>
      <EditorInner />
    </EditorStoreProvider>
  );
}
