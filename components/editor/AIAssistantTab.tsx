'use client';

import React, { useState, useCallback, useRef } from 'react';
import * as fabric from 'fabric';
import { Sparkles, Loader2, Type, Palette as PaletteIcon, Check, Wand2, Scissors } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useBackgroundRemoval } from '@/hooks/use-background-removal';
import { LAYER_IDS } from '@/lib/fabric-utils';
import { CustomFabricObject } from '@/types/editor';
import { generateIdeasAction } from '@/app/actions/generate-ideas';
import { useMutation } from '@tanstack/react-query';

interface AIAssistantTabProps {
  canvas: fabric.Canvas | null;
  activeObject: fabric.Object | null;
  isCompact: boolean;
}

interface AIResponseData {
  slogans: string[];
  palettes: string[][];
  typography: Array<{ font: string; style: string }>;
  shadows: Array<{ blur: number; offsetX: number; offsetY: number; color: string; name: string }>;
}

export function AIAssistantTab({ canvas, activeObject, isCompact }: AIAssistantTabProps) {
  const { removeBackground, isProcessing: bgProcessing } = useBackgroundRemoval();

  const ideaMutation = useMutation({
    mutationFn: async (base64Data: string) => {
      const resultObj = await generateIdeasAction(base64Data);
      return resultObj as AIResponseData;
    },
    onError: (e) => {
      console.error(e);
      toast.error('Failed to generate AI ideas. Please check API Key and try again.');
    }
  });

  const isGenerating = ideaMutation.isPending;
  const ideas = ideaMutation.isPending ? null : (ideaMutation.data || null);
  
  const generateIdeas = async () => {
    if (!canvas) return;
    
    try {
      // Create a low-res snapshot of the canvas to send to Gemini Vision
      const dataUrl = canvas.toDataURL({ format: 'jpeg', quality: 0.5, multiplier: 0.5 });
      const base64Data = dataUrl.split(',')[1];
      
      ideaMutation.mutate(base64Data);
    } catch (e) {
      console.error(e);
      toast.error('Failed to prepare image for AI analysis.');
    }
  };

  const reExtractSubject = async () => {
    if (!canvas) return;
    
    // Find the base image
    const baseImgObj = canvas.getObjects().find(o => (o as CustomFabricObject).id === LAYER_IDS.BASE_IMAGE) as fabric.Image;
    if (!baseImgObj || !baseImgObj.getSrc) {
      toast.error("No base image found on canvas to extract object from.");
      return;
    }
    
    try {
      const src = baseImgObj.getSrc();
      const res = await fetch(src);
      const blob = await res.blob();
      
      const fgUrl = await removeBackground(blob as any);
      
      // Remove old foreground if exists
      const existingFg = canvas.getObjects().find(o => (o as CustomFabricObject).id === LAYER_IDS.FOREGROUND_IMAGE);
      if (existingFg) canvas.remove(existingFg);
      
      fabric.FabricImage.fromURL(fgUrl).then((fgImg) => {
        fgImg.set({
          scaleX: baseImgObj.scaleX, scaleY: baseImgObj.scaleY,
          originX: 'center', originY: 'center',
          left: baseImgObj.left, top: baseImgObj.top,
          selectable: false, evented: false, 
          perPixelTargetFind: true,
        });
        (fgImg as CustomFabricObject).id = LAYER_IDS.FOREGROUND_IMAGE;
        (fgImg as CustomFabricObject).name = 'Foreground (AI Mask)';
        canvas.add(fgImg);
        canvas.bringObjectToFront(fgImg);
        canvas.requestRenderAll();
        canvas.fire('object:modified', { target: fgImg });
        toast.success("Foreground subject re-extracted successfully!");
      });
      
    } catch(e) {
      console.error(e);
      toast.error("Failed to re-extract subject.");
    }
  };

  const applyText = (text: string) => {
    if (activeObject && activeObject.type === 'i-text') {
      (activeObject as fabric.IText).set({ text: text.toUpperCase() });
      canvas?.requestRenderAll();
      canvas?.fire('object:modified', { target: activeObject });
    } else {
      if (!canvas) return;
      const textObj = new fabric.IText(text.toUpperCase(), {
        left: canvas.width! / 2,
        top: canvas.height! / 2,
        originX: 'center',
        originY: 'center',
        fontFamily: 'Inter',
        fontSize: 100,
        fontWeight: 'bold',
        fill: '#ffffff',
        textAlign: 'center'
      });
      // eslint-disable-next-line react-hooks/purity
      (textObj as CustomFabricObject).id = `text_${Date.now()}`;
      (textObj as CustomFabricObject).name = 'AI Text';
      canvas.add(textObj);
      
      // We want to put text behind the subject image if it exists
      const fgImg = canvas.getObjects().find(o => (o as CustomFabricObject).id === LAYER_IDS.FOREGROUND_IMAGE);
      if (fgImg) {
        canvas.moveObjectTo(textObj, canvas.getObjects().indexOf(fgImg));
      }

      canvas.setActiveObject(textObj);
      canvas.requestRenderAll();
      canvas.fire('object:added', { target: textObj });
    }
  };

  const applyFont = async (fontFamily: string) => {
    if (!activeObject || activeObject.type !== 'i-text' || !canvas) {
      toast('Select a text layer first to apply typography.');
      return;
    }
    
    const WebFont = (await import('webfontloader')).default;
    await new Promise<void>((resolve) => {
      WebFont.load({
        google: { families: [fontFamily] },
        active: resolve,
        inactive: resolve,
      });
    });
    
    try {
        await document.fonts.load(`10px "${fontFamily}"`);
    } catch (e) {}
    
    (activeObject as fabric.IText).set({ fontFamily });
    activeObject.setCoords();
    canvas.requestRenderAll();
    canvas.fire('object:modified', { target: activeObject });
    toast.success(`Applied ${fontFamily}`);
  };

  const applyColor = (color: string) => {
    if (!activeObject || typeof (activeObject as any).fill === 'undefined') {
       toast('Select a text or shape layer to apply color.');
       return;
    }
    activeObject.set({ fill: color });
    canvas?.requestRenderAll();
    canvas?.fire('object:modified', { target: activeObject });
  };

  const applyShadow = (shadowConfig: any) => {
    if (!activeObject || !canvas) {
       toast('Select a layer to apply shadow.');
       return;
    }
    
    const shadow = new fabric.Shadow({
      color: shadowConfig.color,
      blur: shadowConfig.blur || 0,
      offsetX: shadowConfig.offsetX || 0,
      offsetY: shadowConfig.offsetY || 0,
    });
    
    activeObject.set({ shadow });
    canvas.requestRenderAll();
    canvas.fire('object:modified', { target: activeObject });
    toast.success(`Applied ${shadowConfig.name} shadow`);
  };

  return (
    <div className="space-y-6 pb-20">
      
      <div className="space-y-4 pt-4">
        <div className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 p-4 rounded-xl border border-indigo-500/30">
           <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-2">
             <Sparkles className="w-4 h-4 text-indigo-400" /> AI Designer
           </h3>
           <p className="text-xs text-indigo-200/80 leading-relaxed mb-4">
             Get fast, context-aware suggestions for typography, slogans, palettes, and depth effects tailored to your current composition.
           </p>
           <button 
             onClick={generateIdeas} 
             disabled={isGenerating}
             className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
           >
             {isGenerating ? <Loader2 className="w-4 h-4 animate-spin"/> : <Wand2 className="w-4 h-4"/>}
             {isGenerating ? "Analyzing Scene..." : "Generate Magic Ideas"}
           </button>
        </div>
      </div>

      <div className="space-y-3 pt-2">
         <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Computer Vision</h4>
         <button 
            onClick={reExtractSubject}
            disabled={bgProcessing}
            className="w-full bg-neutral-800/80 hover:bg-neutral-700 text-neutral-200 border border-neutral-700/50 py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all text-xs font-medium"
         >
           {bgProcessing ? <Loader2 className="w-4 h-4 animate-spin text-indigo-400"/> : <Scissors className="w-4 h-4 text-indigo-400"/>}
           {bgProcessing ? "Extracting Foreground..." : "Auto-Mask Subject"}
         </button>
         <p className="text-[10px] text-neutral-500 italic text-center">Uses local AI ONNX models to extract the foreground.</p>
      </div>

      <div className="w-full h-px bg-neutral-800 my-4" />

      {ideas && (
        <div className="space-y-6">
           <div className="space-y-3">
             <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5"><Type className="w-3.5 h-3.5 text-indigo-400"/> Slogans</h4>
             <div className="grid grid-cols-1 gap-2">
                {ideas.slogans.map((slogan, i) => (
                  <button 
                    key={i} 
                    onClick={() => applyText(slogan)}
                    className="text-left text-sm bg-neutral-900 border border-neutral-800 hover:border-indigo-500/50 rounded-lg p-3 text-neutral-200 transition-all hover:bg-neutral-800"
                  >
                    &quot;{slogan}&quot;
                  </button>
                ))}
             </div>
           </div>
           
           <div className="space-y-3">
             <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5"><PaletteIcon className="w-3.5 h-3.5 text-indigo-400"/> Color Palettes</h4>
             <div className="space-y-3">
                {ideas.palettes.map((palette, i) => (
                   <div key={i} className="flex h-10 w-full rounded-lg overflow-hidden border border-neutral-800 cursor-pointer hover:scale-[1.02] transition-transform">
                      {palette.map((color, j) => (
                         <div 
                           key={j} 
                           className="flex-1 h-full hover:flex-[1.5] transition-all relative group" 
                           style={{ backgroundColor: color }}
                           onClick={() => applyColor(color)}
                         >
                           <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 text-white text-[10px] font-medium tracking-wide pointer-events-none">USE</span>
                         </div>
                      ))}
                   </div>
                ))}
             </div>
           </div>

           <div className="space-y-3">
             <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5"><Type className="w-3.5 h-3.5 text-indigo-400"/> Typography</h4>
             <div className="grid grid-cols-1 gap-2">
                {ideas.typography.map((typo, i) => (
                  <div key={i} className="bg-neutral-900 border border-neutral-800 rounded-lg p-3 flex flex-col items-start gap-1">
                      <div className="flex w-full justify-between items-center mb-1">
                        <span className="text-sm font-bold text-white capitalize">{typo.font}</span>
                        <button onClick={() => applyFont(typo.font)} className="text-[10px] uppercase font-bold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 px-2 py-1 rounded">Apply</button>
                      </div>
                      <span className="text-xs text-neutral-500">{typo.style}</span>
                  </div>
                ))}
             </div>
           </div>

           <div className="space-y-3">
             <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-indigo-400"/> Depth Sets</h4>
             <div className="grid grid-cols-1 gap-2">
                {ideas.shadows.map((shadow, i) => (
                  <div key={i} onClick={() => applyShadow(shadow)} className="bg-neutral-900 border border-neutral-800 hover:border-indigo-500/50 rounded-lg p-3 flex flex-col justify-center cursor-pointer transition-colors group">
                      <span className="text-sm font-medium text-white group-hover:text-indigo-300 transition-colors mb-1">{shadow.name}</span>
                      <span className="text-[10px] text-neutral-500 flex gap-2">
                        <span>blur: {shadow.blur}</span>
                        <span>offX: {shadow.offsetX}</span>
                        <span>offY: {shadow.offsetY}</span>
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: shadow.color }}></span> 
                          {shadow.color}
                        </span>
                      </span>
                  </div>
                ))}
             </div>
           </div>
           
        </div>
      )}

    </div>
  );
}
