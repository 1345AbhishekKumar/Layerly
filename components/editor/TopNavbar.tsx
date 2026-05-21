'use client';

import React from 'react';
import { Layers, Undo, Redo, Save, ImagePlay, Download, Loader2, Maximize, Minimize, PanelRightClose, PanelRightOpen, LogIn } from 'lucide-react';
import { motion } from 'motion/react';
import { ClerkLoaded, ClerkLoading, Show, SignInButton } from '@clerk/nextjs';
import { CustomUserDropdown } from './CustomUserDropdown';
import { cn } from '@/lib/utils';
import { useEditorStore } from '@/providers/editor-store-provider';
import { useIsMobile } from '@/hooks/use-mobile';

interface TopNavbarProps {
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  handleSaveToGallery: () => void;
  handleExport: () => void;
  toggleFullscreen: () => void;
}

export function TopNavbar({
  undo, redo, canUndo, canRedo, handleSaveToGallery, handleExport, toggleFullscreen
}: TopNavbarProps) {
  const isCompact = useEditorStore((s) => s.isCompact);
  const hoverState = useEditorStore((s) => s.hoverState);
  const focusState = useEditorStore((s) => s.focusState);
  const setFocusState = useEditorStore((s) => s.setFocusState);
  const isExporting = useEditorStore((s) => s.isExporting);
  const setIsGalleryOpen = useEditorStore((s) => s.setIsGalleryOpen);
  const isFullscreen = useEditorStore((s) => s.isFullscreen);
  const isPropertiesOpenMobile = useEditorStore((s) => s.isPropertiesOpenMobile);
  const setIsPropertiesOpenMobile = useEditorStore((s) => s.setIsPropertiesOpenMobile);
  const canvas = useEditorStore((s) => s.canvas);
  const isMobile = useIsMobile();
  
  const showTop = !isCompact || hoverState.top || focusState.top;

  const handleFocus = () => setFocusState(prev => ({ ...prev, top: true }));
  const handleBlur = (e: React.FocusEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setFocusState(prev => ({ ...prev, top: false }));
    }
  };

  return (
    <motion.div 
      animate={{
        x: isCompact ? "-50%" : "0px",
        y: isCompact ? (showTop ? "0px" : "-80px") : "0px",
        opacity: isCompact ? (showTop ? 1 : 0) : 1,
        scale: isCompact ? (showTop ? 1 : 0.95) : 1,
      }}
      initial={false}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      onFocus={handleFocus}
      onBlur={handleBlur}
      style={{ pointerEvents: isCompact && !showTop ? "none" : "auto" }}
      className={cn(
        "absolute z-50 flex items-center justify-between shadow-2xl",
        isCompact 
          ? "top-4 left-1/2 h-12 px-2 sm:px-4 rounded-full border border-white/10 bg-neutral-900/60 backdrop-blur-2xl gap-4 sm:gap-6 lg:gap-8" 
          : "top-0 left-0 right-0 h-16 px-4 sm:px-6 border-b border-white/10 bg-neutral-950/70 backdrop-blur-xl transition-all duration-500"
      )}>
      <div className="flex items-center gap-2">
        <Layers className={cn(
          "text-indigo-500 transition-all duration-300",
           isCompact ? "w-4 h-4 sm:w-5 sm:h-5 hidden sm:block mr-3 sm:mr-4 lg:mr-6" : "w-5 h-5 sm:w-6 sm:h-6"
        )} />
        <h1 className={cn(
           "font-display font-medium tracking-tight transition-all duration-300",
           isCompact ? "text-base sm:text-lg hidden" : "text-lg sm:text-xl"
        )}>Cinetext</h1>
      </div>
      <div className={cn("flex items-center", isCompact ? "gap-1 sm:gap-2" : "gap-1 sm:gap-4")}>
        <button 
          onClick={undo}
          disabled={!canUndo}
          className={cn("rounded-lg transition-colors", canUndo ? "text-neutral-400 hover:text-white hover:bg-white/5" : "text-neutral-700 cursor-not-allowed", isCompact ? "p-1.5" : "p-1.5 sm:p-2")} 
          title="Undo (Ctrl+Z)"
        >
          <Undo className={cn(isCompact ? "w-4 h-4" : "w-4 h-4 sm:w-5 sm:h-5")} />
        </button>
        <button 
          onClick={redo}
          disabled={!canRedo}
          className={cn("rounded-lg transition-colors", canRedo ? "text-neutral-400 hover:text-white hover:bg-white/5" : "text-neutral-700 cursor-not-allowed", isCompact ? "p-1.5" : "p-1.5 sm:p-2")} 
          title="Redo (Ctrl+Y)"
        >
          <Redo className={cn(isCompact ? "w-4 h-4" : "w-4 h-4 sm:w-5 sm:h-5")} />
        </button>
        <div className="w-px h-6 bg-white/10 mx-1 sm:mx-2" />
        <button 
          onClick={handleSaveToGallery}
          className={cn("text-neutral-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors flex items-center gap-1.5 font-medium", isCompact ? "p-1.5 text-xs" : "p-1.5 sm:p-2 text-xs sm:text-sm")}
          title="Save to Gallery"
        >
          <Save className={cn(isCompact ? "w-4 h-4" : "w-4 h-4 sm:w-5 sm:h-5")} />
          {!isCompact && <span className="hidden lg:inline">Save</span>}
        </button>
        <button 
          onClick={() => setIsGalleryOpen(true)}
          className={cn("text-neutral-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors flex items-center gap-1.5 font-medium", isCompact ? "p-1.5 text-xs" : "p-1.5 sm:p-2 text-xs sm:text-sm sm:mr-2")}
        >
          <ImagePlay className={cn(isCompact ? "w-4 h-4" : "w-4 h-4 sm:w-5 sm:h-5")} />
          {!isCompact && <span className="hidden lg:inline">Gallery</span>}
        </button>
        <button 
          onClick={handleExport}
          disabled={isExporting || !canvas || canvas.getObjects().length === 0}
          className={cn(
            "bg-white text-black rounded-full font-medium flex items-center hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-1",
            isCompact ? "px-2 py-1.5 text-xs gap-1" : "px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm gap-1 sm:gap-2"
          )}
        >
          {isExporting ? <Loader2 className={cn("animate-spin", isCompact ? "w-3 h-3" : "w-3 h-3 sm:w-4 sm:h-4")} /> : <Download className={cn(isCompact ? "w-3 h-3" : "w-3 h-3 sm:w-4 sm:h-4")} />}
          <span className={cn("hidden", isCompact ? "hidden" : "sm:inline")}>Export</span>
        </button>
        <button 
          onClick={toggleFullscreen}
          className={cn("ml-1 rounded-lg transition-colors flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/5", isCompact ? "p-1.5" : "p-1.5 sm:p-2")}
          title="Toggle Fullscreen"
        >
          {isFullscreen ? <Minimize className={cn(isCompact ? "w-4 h-4" : "w-4 h-4 sm:w-5 sm:h-5")} /> : <Maximize className={cn(isCompact ? "w-4 h-4" : "w-4 h-4 sm:w-5 sm:h-5")} />}
        </button>

        <div className="ml-1 sm:ml-2 flex items-center justify-center">
          <ClerkLoading>
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white/10 animate-pulse" />
          </ClerkLoading>
          <ClerkLoaded>
            <Show when="signed-in">
              <CustomUserDropdown isCompact={isCompact} />
            </Show>
            <Show when="signed-out">
              <SignInButton mode="modal">
                <button className={cn("rounded-lg transition-colors flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/5", isCompact ? "p-1.5" : "p-1.5 sm:p-2")} title="Sign In">
                  <LogIn className={cn(isCompact ? "w-4 h-4" : "w-4 h-4 sm:w-5 sm:h-5")} />
                </button>
              </SignInButton>
            </Show>
          </ClerkLoaded>
        </div>
        
        {isMobile && (
          <button 
            onClick={() => setIsPropertiesOpenMobile(!isPropertiesOpenMobile)}
            className={cn("ml-1 p-1.5 sm:p-2 rounded-lg transition-colors", isPropertiesOpenMobile ? "text-white bg-white/10" : "text-neutral-400 hover:text-white hover:bg-white/5")} 
          >
            {isPropertiesOpenMobile ? <PanelRightClose className="w-5 h-5" /> : <PanelRightOpen className="w-5 h-5" />}
          </button>
        )}
      </div>
    </motion.div>
  );
}