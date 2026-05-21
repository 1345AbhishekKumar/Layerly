'use client';

import React, { useRef } from 'react';
import { MousePointer2, Type, Eraser, Image as ImageIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { useEditorStore } from '@/providers/editor-store-provider';
import { useIsMobile } from '@/hooks/use-mobile';
import { addTextToCanvas } from '@/lib/fabric-utils';

interface LeftToolbarProps {
  onManualUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function LeftToolbar({ onManualUpload }: LeftToolbarProps) {
  const isCompact = useEditorStore((s) => s.isCompact);
  const hoverState = useEditorStore((s) => s.hoverState);
  const focusState = useEditorStore((s) => s.focusState);
  const setFocusState = useEditorStore((s) => s.setFocusState);
  const isEraserMode = useEditorStore((s) => s.isEraserMode);
  const setIsEraserMode = useEditorStore((s) => s.setIsEraserMode);
  const canvas = useEditorStore((s) => s.canvas);
  const isMobile = useIsMobile();
  
  const uploadInputRef = useRef<HTMLInputElement>(null);
  
  const showLeft = !isCompact || hoverState.left || focusState.left;

  const handleFocus = () => setFocusState(prev => ({ ...prev, left: true }));
  const handleBlur = (e: React.FocusEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setFocusState(prev => ({ ...prev, left: false }));
    }
  };

  return (
    <motion.div 
      animate={{
        x: isMobile ? "-50%" : (isCompact ? (showLeft ? "0px" : "-80px") : "0px"),
        y: isMobile ? "0px" : (isCompact ? "-50%" : "0px"),
        opacity: isMobile ? 1 : (isCompact ? (showLeft ? 1 : 0) : 1),
        scale: isMobile ? 1 : (isCompact ? (showLeft ? 1 : 0.95) : 1),
      }}
      initial={false}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      onFocus={handleFocus}
      onBlur={handleBlur}
      style={{ pointerEvents: (!isMobile && isCompact && !showLeft) ? "none" : "auto" }}
      className={cn(
        "bg-neutral-900/60 backdrop-blur-xl border-white/5 z-40 flex items-center shadow-2xl",
        isMobile 
          ? "absolute bottom-6 left-1/2 flex-row rounded-full px-4 py-2 gap-2 border w-max max-w-[90vw]" 
          : isCompact 
            ? "absolute left-4 top-1/2 w-12 flex-col py-4 gap-4 rounded-2xl border" 
            : "w-16 lg:w-20 border-r flex-col py-6 gap-6 transition-all duration-500"
      )}>
      <input 
        type="file" 
        ref={uploadInputRef} 
        onChange={onManualUpload} 
        className="hidden" 
        accept="image/*" 
      />
          
      <ToolButton 
        icon={<MousePointer2 />} 
        label="Select" 
        onClick={() => setIsEraserMode(false)} 
        isActive={!isEraserMode} 
        isMobile={isMobile}
        isCompact={isCompact}
      />
      <ToolButton 
        icon={<ImageIcon />} 
        label="Edit another image" 
        onClick={() => {
          setIsEraserMode(false);
          if (uploadInputRef.current) {
            uploadInputRef.current.value = '';
            uploadInputRef.current.click();
          }
        }} 
        isMobile={isMobile}
        isCompact={isCompact}
      />
      {!isMobile && <div className={cn("bg-white/10 transition-all duration-300", isCompact ? "w-6 h-px" : "w-6 lg:w-8 h-px")} />}
      {isMobile && <div className="w-px h-6 bg-white/10 mx-1" />}
      
      <ToolButton 
        icon={<Type />} 
        label="Text" 
        onClick={() => { setIsEraserMode(false); canvas && addTextToCanvas(canvas); }} 
        isMobile={isMobile} 
        isCompact={isCompact} 
      />
      
      {!isMobile && <div className={cn("bg-white/10 transition-all duration-300", isCompact ? "w-6 h-px" : "w-6 lg:w-8 h-px")} />}
      {isMobile && <div className="w-px h-6 bg-white/10 mx-1" />}
      
      <ToolButton 
        icon={<Eraser />} 
        label="Eraser" 
        onClick={() => setIsEraserMode(true)} 
        isActive={isEraserMode} 
        isMobile={isMobile}
        isCompact={isCompact}
      />
    </motion.div>
  );
}

function ToolButton({ icon, label, onClick, isActive, isMobile, isCompact }: { icon: React.ReactNode, label: string, onClick: () => void, isActive?: boolean, isMobile?: boolean, isCompact?: boolean }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center justify-center transition-colors group relative shrink-0",
        isMobile ? "p-3 rounded-full" : (isCompact ? "w-10 h-10 flex-col" : "flex-col gap-1.5 w-14"),
        isActive ? "text-indigo-400 bg-indigo-500/10" : "text-neutral-400 hover:text-white hover:bg-white/5"
      )}
      title={label}
    >
      <div className={cn(
        "transition-colors flex items-center justify-center",
        !isMobile && (isCompact ? "p-2 rounded-lg" : "p-2.5 rounded-xl shadow-sm"),
        (!isMobile && isActive) ? "bg-indigo-500/20" : (!isMobile && "bg-neutral-800/40 group-hover:bg-neutral-800/80")
      )}>
        {React.cloneElement(icon as React.ReactElement<any>, { className: isMobile ? "w-5 h-5" : (isCompact ? "w-4 h-4" : "w-5 h-5") })}
      </div>
      {!isMobile && !isCompact && <span className="text-[10px] font-medium tracking-wide uppercase">{label}</span>}
    </button>
  );
}
