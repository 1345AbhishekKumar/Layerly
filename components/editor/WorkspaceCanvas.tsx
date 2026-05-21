'use client';

import React, { useEffect } from 'react';
import * as fabric from 'fabric';
import { motion, AnimatePresence } from 'motion/react';
import { ImageIcon } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { cn } from '@/lib/utils';
import { useEditorStore } from '@/providers/editor-store-provider';

interface WorkspaceCanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  onDropFiles: (acceptedFiles: File[]) => void;
  bgProcessing: boolean;
  progress: number;
}

export function WorkspaceCanvas({ canvasRef, containerRef, onDropFiles, bgProcessing, progress }: WorkspaceCanvasProps) {
  const isCompact = useEditorStore((s) => s.isCompact);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop: onDropFiles, 
    accept: {'image/*': []},
    noClick: true
  });

  return (
    <div 
      {...getRootProps()} 
      className={cn(
        "flex-1 relative z-10 transition-all duration-500 flex items-center justify-center",
        isCompact ? "p-4 lg:p-16 pb-24 lg:pb-16" : "p-4 sm:p-8 lg:p-12 pb-24 lg:pb-12",
        isDragActive ? "bg-indigo-900/10" : "bg-neutral-950"
      )}
    >
      <input {...getInputProps()} />
      
      <div ref={containerRef} className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center bg-neutral-900/30">
        <canvas ref={canvasRef as any} className="absolute inline-block" />
      </div>
      
      {/* Drag overlay */}
      <AnimatePresence>
        {isDragActive && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={cn("absolute z-50 flex items-center justify-center bg-indigo-500/10 backdrop-blur-sm border-2 border-indigo-500/50 border-dashed rounded-2xl pointer-events-none", isCompact ? "inset-2 sm:inset-4 lg:inset-6" : "inset-4 sm:inset-8 lg:inset-12")}
          >
            <div className="text-center font-display text-indigo-200 pointer-events-none drop-shadow-xl bg-black/40 p-8 rounded-2xl backdrop-blur-md border border-white/10">
              <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-75 text-indigo-400" />
              <p className="text-3xl font-medium tracking-tight text-white mb-2">Drop photo here</p>
              <p className="opacity-80 text-sm">AI will automatically extract the foreground subject.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Processing overlay */}
      <AnimatePresence>
        {bgProcessing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn("absolute z-50 flex items-center justify-center bg-neutral-950/80 backdrop-blur-xl rounded-2xl border border-white/10", isCompact ? "inset-2 sm:inset-4 lg:inset-6" : "inset-4 sm:inset-8 lg:inset-12")}
          >
            <div className="text-center font-display space-y-6 max-w-sm w-full px-6">
              <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin"></div>
                <ImageIcon className="w-8 h-8 text-indigo-400" />
              </div>
              <div className="space-y-2">
                <p className="text-xl text-white font-medium tracking-tight animate-pulse">Extracting Subject</p>
                <p className="text-sm text-neutral-400">Our AI is separating the background...</p>
              </div>
              <div className="w-full h-2 bg-neutral-800/50 rounded-full overflow-hidden border border-white/5">
                <motion.div 
                  className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400" 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ ease: "linear", duration: 0.2 }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
