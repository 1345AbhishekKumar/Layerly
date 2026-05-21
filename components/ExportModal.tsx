import React, { useState, useEffect } from 'react';
import { X, Image as ImageIcon, Download, Settings, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as fabric from 'fabric';
import { toast } from 'sonner';
import { useEditorStore } from '../providers/editor-store-provider';
import { CustomFabricObject } from '../types/editor';
import { LAYER_IDS } from '../lib/fabric-utils';
import { cn } from '../lib/utils';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ASPECT_RATIOS = [
  { id: 'original', label: 'Original Size', w: 0, h: 0 },
  { id: '1:1', label: 'Square (1:1)', w: 1, h: 1 },
  { id: '16:9', label: 'Landscape (16:9)', w: 16, h: 9 },
  { id: '9:16', label: 'Story (9:16)', w: 9, h: 16 },
  { id: '4:5', label: 'Portrait (4:5)', w: 4, h: 5 },
  { id: 'custom', label: 'Custom', w: 0, h: 0 },
];

export function ExportModal({ isOpen, onClose }: ExportModalProps) {
  const canvas = useEditorStore((s) => s.canvas);
  const isExporting = useEditorStore((s) => s.isExporting);
  const setIsExporting = useEditorStore((s) => s.setIsExporting);
  
  const [format, setFormat] = useState<'png' | 'jpeg' | 'webp'>('png');
  const [quality, setQuality] = useState<number>(0.9);
  const [multiplier, setMultiplier] = useState<number>(2);
  const [aspectRatio, setAspectRatio] = useState<string>('original');
  const [customWidth, setCustomWidth] = useState<number>(1080);
  const [customHeight, setCustomHeight] = useState<number>(1080);
  const [transparentBg, setTransparentBg] = useState<boolean>(true);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  const getExportOptions = React.useCallback((baseImg: fabric.Object, isPreview: boolean = false) => {
    const baseW = baseImg.width! * (baseImg.scaleX || 1);
    const baseH = baseImg.height! * (baseImg.scaleY || 1);
    
    let targetW = baseW;
    let targetH = baseH;

    let aspect = baseW / baseH;

    if (aspectRatio === 'custom') {
      aspect = customWidth / (customHeight || 1);
    } else if (aspectRatio !== 'original') {
      const ratioObj = ASPECT_RATIOS.find(r => r.id === aspectRatio)!;
      aspect = ratioObj.w / ratioObj.h;
    }

    if (aspectRatio !== 'original') {
      // Fit within base image
      if (baseW / baseH > aspect) {
        targetH = baseH;
        targetW = baseH * aspect;
      } else {
        targetW = baseW;
        targetH = baseW / aspect;
      }
    }

    let finalMultiplier = isPreview ? (0.5 / (baseImg.scaleX || 1)) : (multiplier * (1 / (baseImg.scaleX || 1)));

    if (!isPreview && aspectRatio === 'custom' && customWidth > 0 && targetW > 0) {
      finalMultiplier = customWidth / targetW;
    }

    return {
      format: isPreview ? 'jpeg' : format, // Force jpeg for fast preview unless needed otherwise
      quality: isPreview ? 0.5 : quality,
      multiplier: finalMultiplier,
      left: baseImg.left! - targetW / 2,
      top: baseImg.top! - targetH / 2,
      width: targetW,
      height: targetH,
    };
  }, [aspectRatio, customHeight, customWidth, format, multiplier, quality]);

  const updatePreview = React.useCallback(() => {
    if (!canvas) return;
    
    // We want a fast preview
    canvas.discardActiveObject();
    
    const baseImg = canvas.getObjects().find(o => (o as CustomFabricObject).id === LAYER_IDS.BASE_IMAGE);
    if (!baseImg) {
      // If no base image, just get a preview of the whole canvas
      const pUrl = canvas.toDataURL({ format: 'jpeg', quality: 0.5, multiplier: 0.5 });
      setPreviewUrl(pUrl);
      return;
    }

    const exportOptions = getExportOptions(baseImg, true);
    
    const oldBg = canvas.backgroundColor;
    if (transparentBg && (format === 'png' || format === 'webp')) {
      canvas.set({ backgroundColor: '' });
    }
    
    canvas.requestRenderAll();
    
    try {
      const pUrl = canvas.toDataURL(exportOptions);
      setPreviewUrl(pUrl);
    } catch (e) {
      console.warn("Could not generate export preview.", e);
    }
    
    canvas.set({ backgroundColor: oldBg });
    canvas.requestRenderAll();
  }, [canvas, format, getExportOptions, transparentBg]);

  useEffect(() => {
    if (isOpen && canvas) {
      const timer = setTimeout(() => {
        updatePreview();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen, canvas, format, quality, multiplier, aspectRatio, customWidth, customHeight, transparentBg, updatePreview]);

  const handleExport = () => {
    if (!canvas) return;
    setIsExporting(true);
    
    // Slight delay to allow UI to show spinner
    setTimeout(() => {
      canvas.discardActiveObject();
      const baseImg = canvas.getObjects().find(o => (o as CustomFabricObject).id === LAYER_IDS.BASE_IMAGE);
      
      let options: any = { format, quality, multiplier };
      
      if (baseImg) {
        options = getExportOptions(baseImg, false);
      }
      
      const oldBg = canvas.backgroundColor;
      if (transparentBg && (format === 'png' || format === 'webp')) {
         canvas.backgroundColor = '';
      }
      
      canvas.requestRenderAll();

      try {
        const dataUrl = canvas.toDataURL(options);
        const link = document.createElement('a');
        link.download = `cinetext-${Date.now()}.${format}`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Image exported successfully!');
        onClose();
      } catch(e) {
        console.error('Export failed due to tainted canvas (CORS)', e);
        toast.error('Export failed. Ensure you only use local images to avoid CORS issues.');
      }
      
      canvas.backgroundColor = oldBg;
      canvas.requestRenderAll();
      setIsExporting(false);
    }, 50);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 sm:p-6 lg:p-8"
        >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className="bg-neutral-900 border border-neutral-800 shadow-2xl rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col md:flex-row overflow-hidden relative"
          >
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 z-10 p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Left side mapping preview */}
            <div className="w-full md:w-1/2 bg-neutral-950 p-6 flex flex-col items-center justify-center border-r border-neutral-800 shrink-0">
               <h3 className="w-full text-left text-sm font-medium text-neutral-400 mb-4 flex items-center gap-2">
                 <ImageIcon className="w-4 h-4" /> Preview
               </h3>
               <div className="w-full flex-1 flex items-center justify-center relative bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+CjxyZWN0IHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0iI2ZmZiIvPgo8cGF0aCBkPSJNMCAwcjEwaDEwdmEwdmwxMGgtMTB6bTEwIDEwaDEwdjEwaC0xMHoiIGZpbGw9IiNlNmU2ZTYiLz8KPC9zdmc+')] rounded-xl overflow-hidden border border-neutral-800 bg-repeat bg-[length:16px_16px]">
                 {previewUrl ? (
                   // eslint-disable-next-line @next/next/no-img-element
                   <img src={previewUrl} alt="Export Preview" className="max-w-full max-h-[full] object-contain shadow-2xl drop-shadow-2xl" />
                 ) : (
                   <span className="text-neutral-600 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Generating...
                   </span>
                 )}
               </div>
            </div>

            {/* Right side settings */}
            <div className="w-full md:w-1/2 p-6 overflow-y-auto">
              <h2 className="text-2xl font-display font-medium text-white mb-6 flex items-center gap-2">
                <Settings className="w-6 h-6 text-indigo-400" /> Export Settings
              </h2>
              
              <div className="space-y-6">
                
                {/* Format selection */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-neutral-300 block">Format</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['png', 'jpeg', 'webp'].map(f => (
                      <button
                        key={f}
                        onClick={() => setFormat(f as any)}
                        className={cn(
                          "py-2 px-3 text-sm font-medium rounded-lg uppercase transition-colors border",
                          format === f ? "bg-indigo-500 text-white border-indigo-400" : "bg-neutral-800 text-neutral-400 border-transparent hover:bg-neutral-700"
                        )}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Aspect Ratio */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-neutral-300 block">Aspect Ratio / Crop</label>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                    {ASPECT_RATIOS.map(ratio => (
                      <button
                        key={ratio.id}
                        onClick={() => setAspectRatio(ratio.id)}
                        className={cn(
                          "py-2 px-2 text-xs sm:text-sm font-medium rounded-lg transition-colors border text-center",
                          aspectRatio === ratio.id ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/50" : "bg-neutral-800 text-neutral-400 border-transparent hover:bg-neutral-700"
                        )}
                      >
                        {ratio.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom dimensions if needed */}
                <AnimatePresence>
                  {aspectRatio === 'custom' && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="grid grid-cols-2 gap-4 overflow-hidden"
                    >
                      <div className="space-y-2">
                        <label className="text-xs text-neutral-400">Width (px)</label>
                        <input 
                          type="number" 
                          value={customWidth}
                          onChange={(e) => setCustomWidth(Number(e.target.value))}
                          className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500 text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs text-neutral-400">Height (px)</label>
                        <input 
                          type="number" 
                          value={customHeight}
                          onChange={(e) => setCustomHeight(Number(e.target.value))}
                          className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500 text-sm"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Multiplier / Resolution */}
                {aspectRatio !== 'custom' && (
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-neutral-300 block">Resolution Multiplier</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[1, 2, 3].map(m => (
                        <button
                          key={m}
                          onClick={() => setMultiplier(m)}
                          className={cn(
                            "py-2 px-3 text-sm font-medium rounded-lg transition-colors border",
                            multiplier === m ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/50" : "bg-neutral-800 text-neutral-400 border-transparent hover:bg-neutral-700"
                          )}
                        >
                          {m}x
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-neutral-500">
                      Controls output resolution. Higher multiplier means slower export but sharper image.
                    </p>
                  </div>
                )}

                {/* Quality Slider (JPG/WEBP) */}
                {(format === 'jpeg' || format === 'webp') && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium text-neutral-300 block">Quality</label>
                      <span className="text-xs text-indigo-400 font-mono">{Math.round(quality * 100)}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0.1" 
                      max="1.0" 
                      step="0.1"
                      value={quality}
                      onChange={(e) => setQuality(parseFloat(e.target.value))}
                      className="w-full accent-indigo-500"
                    />
                  </div>
                )}

                {/* Transparent toggle (PNG/WEBP) */}
                {(format === 'png' || format === 'webp') && (
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative flex items-center justify-center">
                      <input 
                        type="checkbox" 
                        checked={transparentBg} 
                        onChange={(e) => setTransparentBg(e.target.checked)}
                        className="sr-only" 
                      />
                      <div className={cn("w-5 h-5 rounded border flex items-center justify-center transition-colors", transparentBg ? "bg-indigo-500 border-indigo-500" : "border-neutral-600 group-hover:border-neutral-500 bg-neutral-800")}>
                        {transparentBg && <div className="w-2.5 h-2.5 bg-white rounded-sm" />}
                      </div>
                    </div>
                    <span className="text-sm text-neutral-300 select-none group-hover:text-white transition-colors">
                      Transparent Canvas Background
                    </span>
                  </label>
                )}

              </div>

              {/* Action */}
              <div className="mt-8 pt-6 border-t border-neutral-800">
                <button
                  onClick={handleExport}
                  disabled={isExporting}
                  className="w-full bg-white text-black hover:bg-neutral-200 py-3 rounded-xl font-medium tracking-tight transition-colors disabled:opacity-50 flex flex-row items-center justify-center gap-2"
                >
                  {isExporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                  {isExporting ? 'Exporting...' : 'Export Image'}
                </button>
              </div>

            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
