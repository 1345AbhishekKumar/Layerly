'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEditorStore } from '@/providers/editor-store-provider';
import { useIsMobile } from '@/hooks/use-mobile';
import { PropertiesPanel } from '@/components/PropertiesPanel';
import { LayersPanel } from '@/components/LayersPanel';
import { AIAssistantTab } from './AIAssistantTab';
import { Sparkles } from 'lucide-react';

export function RightSidebar() {
  const isCompact = useEditorStore((s) => s.isCompact);
  const hoverState = useEditorStore((s) => s.hoverState);
  const focusState = useEditorStore((s) => s.focusState);
  const setFocusState = useEditorStore((s) => s.setFocusState);
  const activeTab = useEditorStore((s) => s.activeTab);
  const setActiveTab = useEditorStore((s) => s.setActiveTab);
  const isPropertiesOpenMobile = useEditorStore((s) => s.isPropertiesOpenMobile);
  const setIsPropertiesOpenMobile = useEditorStore((s) => s.setIsPropertiesOpenMobile);
  const isEraserMode = useEditorStore((s) => s.isEraserMode);
  const eraserSize = useEditorStore((s) => s.eraserSize);
  const setEraserSize = useEditorStore((s) => s.setEraserSize);
  const canvas = useEditorStore((s) => s.canvas);
  const activeObject = useEditorStore((s) => s.activeObject);
  const isMobile = useIsMobile();

  const showRight = !isCompact || hoverState.right || focusState.right;

  const handleFocus = () => setFocusState(prev => ({ ...prev, right: true }));
  const handleBlur = (e: React.FocusEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setFocusState(prev => ({ ...prev, right: false }));
    }
  };

  return (
    <AnimatePresence>
      {(!isMobile || isPropertiesOpenMobile) && (
        <motion.div 
          initial={isMobile ? { x: '100%', opacity: 0 } : false}
          animate={{ 
            x: isMobile ? 0 : (isCompact ? (showRight ? "0px" : "300px") : "0px"),
            y: 0,
            opacity: isMobile ? 1 : (isCompact ? (showRight ? 1 : 0) : 1),
            scale: isMobile ? 1 : (isCompact ? (showRight ? 1 : 0.95) : 1),
            width: isCompact && !isMobile ? 256 : (isMobile ? 'auto' : 320)
          }}
          exit={isMobile ? { x: '100%', opacity: 0 } : undefined}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={{ pointerEvents: (!isMobile && isCompact && !showRight) ? "none" : "auto" }}
          className={cn(
            "shrink-0 flex flex-col backdrop-blur-2xl border-white/10 z-50 shadow-2xl overflow-hidden",
            isMobile 
              ? "w-72 absolute top-4 right-4 bottom-24 border rounded-2xl bg-neutral-900/60" 
              : isCompact 
                ? "absolute right-4 top-20 bottom-8 rounded-2xl border bg-neutral-900/60" 
                : "border-l relative bg-neutral-900/60 h-full transition-all duration-500"
          )}
        >
          {isMobile && (
            <div className="flex justify-between items-center p-4 border-b border-white/10 bg-black/20">
              <span className="font-medium text-sm text-neutral-200">Tools</span>
              <button onClick={() => setIsPropertiesOpenMobile(false)} className="p-1 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          
          <div className="flex border-b border-white/10 shrink-0 bg-black/10">
            <button 
              className={cn(
                "flex-1 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2",
                isCompact ? "py-2.5" : "py-3",
                activeTab === 'properties' ? "border-indigo-500 text-indigo-400" : "border-transparent text-neutral-500 hover:text-neutral-300"
              )}
              onClick={() => setActiveTab('properties')}
            >
              Props
            </button>
            <button 
              className={cn(
                "flex-1 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2",
                isCompact ? "py-2.5" : "py-3",
                activeTab === 'layers' ? "border-indigo-500 text-indigo-400" : "border-transparent text-neutral-500 hover:text-neutral-300"
              )}
              onClick={() => setActiveTab('layers')}
            >
              Layers
            </button>
            <button 
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2",
                isCompact ? "py-2.5" : "py-3",
                activeTab === 'ai' ? "border-indigo-500 text-indigo-400" : "border-transparent text-neutral-500 hover:text-neutral-300"
              )}
              onClick={() => setActiveTab('ai')}
            >
              <Sparkles className="w-3.5 h-3.5" />
              AI
            </button>
          </div>
          
          <div className={cn("flex-1 overflow-y-auto", isCompact ? "p-4" : "p-6")}>
            {activeTab === 'properties' && (
              <>
                {isEraserMode ? (
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-white mb-4">Eraser Tool</h3>
                    <div className="space-y-2">
                      <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider flex justify-between">
                        <span>Brush Size</span>
                        <span>{eraserSize}px</span>
                      </label>
                      <input 
                        type="range"
                        min="5"
                        max="100"
                        value={eraserSize}
                        onChange={(e) => setEraserSize(Number(e.target.value))}
                        className="w-full accent-indigo-500"
                      />
                    </div>
                    <p className="text-xs text-neutral-500 mt-4 leading-relaxed">
                      Erase mode is active. Click and drag over the canvas to cut out parts of objects. The eraser permanently subtracts from the scene rendering stack.
                    </p>
                  </div>
                ) : (
                  <PropertiesPanel activeObject={activeObject} canvas={canvas} isCompact={isCompact} />
                )}
              </>
            )}
            {activeTab === 'layers' && (
              <LayersPanel canvas={canvas} activeObject={activeObject} isCompact={isCompact} />
            )}
            {activeTab === 'ai' && (
              <AIAssistantTab canvas={canvas} activeObject={activeObject} isCompact={isCompact} />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
