'use client';

import React, { useState, useEffect } from 'react';
import * as fabric from 'fabric';
import { AlignLeft, AlignCenter, AlignRight, AlignJustify, Italic, Underline, Baseline, Type, Blend, Palette, Droplet, Move3d, FlipHorizontal, FlipVertical, Crop, RotateCcw, SlidersHorizontal, Image as ImageIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import { LAYER_IDS } from '../lib/fabric-utils';

interface PropertiesPanelProps {
  activeObject: fabric.Object | null;
  canvas: fabric.Canvas | null;
  isCompact?: boolean;
}

const SANSSERIF_FONTS = [
  'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Inter', 'Source Sans Pro', 'Raleway', 'PT Sans', 'Noto Sans', 'Nunito', 'Prompt', 'Work Sans', 'Fira Sans', 'Rubik', 'Space Grotesk', 'Poppins', 'Josefin Sans', 'DM Sans', 'Ubuntu', 'Ranade', 'Manrope', 'Object Sans', 'Titillium Web', 'Mukta', 'Quicksand', 'Karla', 'Abel', 'Varela Round', 'Exo 2'
];

const SERIF_FONTS = [
  'Playfair Display', 'Merriweather', 'Lora', 'PT Serif', 'Noto Serif', 'Libre Baskerville', 'Crimson Text', 'Neuton', 'Soria', 'Bitter', 'Tinos', 'Cinzel'
];

const SLABSERIF_FONTS = [
  'Sreda', 'Arvo', 'Roboto Slab', 'Josefin Slab', 'Zilla Slab'
];

const DISPLAY_FONTS = [
  'Oswald', 'Concert One', 'Anton', 'Fjalla One', 'Cabin', 'Bebas Neue', 'Teko', 'Righteous', 'Lobster'
];

const HANDWRITING_FONTS = [
  'Dancing Script', 'Pacifico', 'Caveat', 'Satisfy'
];

const ALL_FONTS = [...SANSSERIF_FONTS, ...SERIF_FONTS, ...SLABSERIF_FONTS, ...DISPLAY_FONTS, ...HANDWRITING_FONTS];

const CUSTOM_FONTS = ['Ranade', 'Object Sans', 'Soria'];

const BLEND_MODES = [
  'source-over', 'lighter', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 
  'color-dodge', 'color-burn', 'hard-light', 'soft-light', 'difference', 'exclusion', 
  'hue', 'saturation', 'color', 'luminosity'
];

// Helper to manage filters
function applyFilter(obj: fabric.Image, filterType: string, filter: fabric.filters.BaseFilter<string> | false) {
  if (!obj.filters) obj.filters = [];
  const existingIdx = obj.filters.findIndex((f: any) => f && f.type === filterType);
  
  if (filter === false) {
    if (existingIdx > -1) {
      obj.filters.splice(existingIdx, 1);
    }
  } else {
    if (existingIdx > -1) {
      obj.filters[existingIdx] = filter as fabric.filters.BaseFilter<string>;
    } else {
      obj.filters.push(filter as fabric.filters.BaseFilter<string>);
    }
  }
  obj.applyFilters();
}

function getFilter(obj: fabric.Image, filterClass: string) {
  if (!obj.filters) return null;
  return obj.filters.find((f: any) => f && f.type === filterClass);
}

const FILTER_INDICES = {
  BRIGHTNESS: 0,
  CONTRAST: 1,
  SATURATION: 2,
  BLUR: 3,
  SHARPEN: 4,
  VINTAGE: 5,
  VINTAGE2: 6,
  BW: 7
};

export function PropertiesPanel({ activeObject, canvas, isCompact }: PropertiesPanelProps) {
  const [, forceUpdate] = React.useReducer((x) => x + 1, 0);
  const debouncedFireRef = React.useRef<NodeJS.Timeout | null>(null);

  const [bgBlur, setBgBlur] = useState(0);

  // Sync Global BG Blur
  useEffect(() => {
    if (!canvas) return;
    const baseImg = canvas.getObjects().find((o: any) => o.id === LAYER_IDS.BASE_IMAGE) as fabric.Image;
    if (baseImg && baseImg.filters) {
      const f = getFilter(baseImg, 'Blur') as any;
      if (f) setTimeout(() => setBgBlur(f.blur), 0);
    }
  }, [canvas, activeObject]);

  if (!activeObject) {
    return (
      <div className={cn("pb-20", isCompact ? "space-y-4" : "space-y-6")}>
        <div className={cn("text-center text-neutral-500 text-sm border border-neutral-800/50 rounded-xl", isCompact ? "mt-6 p-3" : "mt-10 p-4")}>
          Select a layer to edit properties.
        </div>
        {renderGlobalSettings()}
      </div>
    );
  }

  const isText = activeObject.type === 'i-text';
  const isImage = activeObject.type === 'image';
  const isGroup = activeObject.type === 'group';
  const isSelection = activeObject.type === 'activeSelection';

  const updateProperty = (key: string, value: any, targetObj: fabric.Object = activeObject) => {
    if (!canvas || !targetObj) return;

    if (key === 'fontFamily') {
      const loadFontAndApply = async () => {
        if (!CUSTOM_FONTS.includes(value)) {
          const WebFont = (await import('webfontloader')).default;
          await new Promise<void>((resolve) => {
            WebFont.load({
              google: { families: [value] },
              active: () => resolve(),
              inactive: () => resolve(),
              fontactive: () => resolve(),
              fontinactive: () => resolve(),
            });
          });
        }
        
        try {
          await document.fonts.load(`10px "${value}"`);
        } catch (e) {}

        (targetObj as fabric.IText).set('fontFamily', value);
        targetObj.setCoords();
        canvas.requestRenderAll();
        forceUpdate();

        if (debouncedFireRef.current) clearTimeout(debouncedFireRef.current);
        debouncedFireRef.current = setTimeout(() => {
          canvas.fire('object:modified', { target: targetObj });
        }, 500);
      };
      
      loadFontAndApply();
      return; 
    }

    if (key === 'gradient' && isText) {
      if (value) {
        const textObj = targetObj as fabric.IText;
        const gradient = new fabric.Gradient({
          type: 'linear',
          gradientUnits: 'pixels',
          coords: { x1: 0, y1: 0, x2: textObj.width || 100, y2: 0 },
          colorStops: [
            { offset: 0, color: '#ff0000' },
            { offset: 1, color: '#0000ff' }
          ]
        });
        targetObj.set('fill', gradient);
      } else {
        targetObj.set('fill', '#ffffff');
      }
    } else {
      targetObj.set(key as keyof fabric.Object, value);
    }
    
    targetObj.setCoords();
    canvas.requestRenderAll();
    forceUpdate();
    
    if (debouncedFireRef.current) clearTimeout(debouncedFireRef.current);
    debouncedFireRef.current = setTimeout(() => {
      canvas.fire('object:modified', { target: targetObj });
    }, 500);
  };

  const applyImageFilter = (filterName: string, filterClass: any, filterIndex: number, options: any) => {
    if (!isImage || !canvas) return;
    const imgObj = activeObject as fabric.Image;
    
    if (options === false) {
      applyFilter(imgObj, filterName, false);
    } else {
      const filter = new filterClass(options);
      applyFilter(imgObj, filterName, filter);
    }
    
    canvas.requestRenderAll();
    forceUpdate();
    
    if (debouncedFireRef.current) clearTimeout(debouncedFireRef.current);
    debouncedFireRef.current = setTimeout(() => {
      canvas.fire('object:modified', { target: imgObj });
    }, 500);
  };

  function renderGlobalSettings() {
    return (
      <div className={cn("border-t border-neutral-800", isCompact ? "space-y-3 pt-3" : "space-y-4 pt-4")}>
        <h3 className={cn("text-sm font-medium text-white flex items-center gap-2", isCompact ? "mb-1" : "mb-2")}>
          <Droplet className="w-4 h-4 text-indigo-400" /> Virtual Depth
        </h3>
        <div className={cn("bg-neutral-900/50 rounded-lg border border-neutral-800", isCompact ? "space-y-3 p-2" : "space-y-4 p-3")}>
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider flex justify-between">
              <span>Background Blur</span>
              <span>{bgBlur.toFixed(2)}</span>
            </label>
            <input 
              type="range" min="0" max="1" step="0.05"
              className="w-full accent-indigo-500"
              value={bgBlur}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setBgBlur(val);
                if (canvas) {
                  const baseImg = canvas.getObjects().find((o: any) => o.id === LAYER_IDS.BASE_IMAGE) as fabric.Image;
                  if (baseImg) {
                    if (val === 0) applyFilter(baseImg, 'Blur', false);
                    else applyFilter(baseImg, 'Blur', new fabric.filters.Blur({ blur: val }));
                    canvas.requestRenderAll();
                    if (debouncedFireRef.current) clearTimeout(debouncedFireRef.current);
                    debouncedFireRef.current = setTimeout(() => {
                      canvas.fire('object:modified', { target: baseImg });
                    }, 500);
                  }
                }
              }}
            />
          </div>
          <p className="text-[10px] text-neutral-500 italic">Blurs the base background. Extracted subjects stay sharp.</p>
        </div>
      </div>
    );
  }

  function renderTextProperties() {
    const textObj = activeObject as fabric.IText;
    const isGradient = textObj.fill && typeof textObj.fill === 'object' && 'colorStops' in (textObj.fill as any);

    return (
      <>
        {/* Font Family */}
        <div className={cn(isCompact ? "space-y-1.5" : "space-y-2")}>
          <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Font Family</label>
          <select 
            className={cn("w-full bg-neutral-800/50 border border-neutral-700/50 rounded-lg text-white focus:outline-none focus:ring-1 inset-ring focus:ring-indigo-500 font-sans", isCompact ? "p-1.5 text-xs" : "p-2 text-sm")}
            value={textObj.fontFamily || ALL_FONTS[0]}
            onChange={(e) => updateProperty('fontFamily', e.target.value)}
          >
            <optgroup label="Sans Serif">
              {SANSSERIF_FONTS.map(f => <option key={f} value={f}>{f}</option>)}
            </optgroup>
            <optgroup label="Serif">
              {SERIF_FONTS.map(f => <option key={f} value={f}>{f}</option>)}
            </optgroup>
            <optgroup label="Slab Serif">
              {SLABSERIF_FONTS.map(f => <option key={f} value={f}>{f}</option>)}
            </optgroup>
            <optgroup label="Display">
              {DISPLAY_FONTS.map(f => <option key={f} value={f}>{f}</option>)}
            </optgroup>
            <optgroup label="Handwriting">
              {HANDWRITING_FONTS.map(f => <option key={f} value={f}>{f}</option>)}
            </optgroup>
          </select>
        </div>

        {/* Style Toggles */}
        <div className={cn("flex", isCompact ? "gap-1.5" : "gap-2")}>
          <button
            onClick={() => updateProperty('fontStyle', textObj.fontStyle === 'italic' ? 'normal' : 'italic')}
            className={cn("flex-1 flex justify-center items-center rounded-lg border transition-colors", isCompact ? "p-1.5" : "p-2", textObj.fontStyle === 'italic' ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400' : 'bg-neutral-800/50 border-neutral-700/50 text-neutral-400 hover:text-white')}
            title="Italic"
          ><Italic className={cn(isCompact ? "w-3 h-3" : "w-4 h-4")} /></button>
          <button
            onClick={() => updateProperty('underline', !textObj.underline)}
            className={cn("flex-1 flex justify-center items-center rounded-lg border transition-colors", isCompact ? "p-1.5" : "p-2", textObj.underline ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400' : 'bg-neutral-800/50 border-neutral-700/50 text-neutral-400 hover:text-white')}
            title="Underline"
          ><Underline className={cn(isCompact ? "w-3 h-3" : "w-4 h-4")} /></button>
          
          {/* Alignment */}
          <div className="flex bg-neutral-800/50 border border-neutral-700/50 rounded-lg overflow-hidden shrink-0">
            {['left', 'center', 'right', 'justify'].map(align => (
              <button
                key={align}
                onClick={() => updateProperty('textAlign', align)}
                className={cn("transition-colors", isCompact ? "p-1.5" : "p-2", textObj.textAlign === align ? 'bg-neutral-700 text-white' : 'text-neutral-500 hover:text-white')}
                title={`Align ${align}`}
              >
                {align === 'left' && <AlignLeft className={cn(isCompact ? "w-3 h-3" : "w-4 h-4")} />}
                {align === 'center' && <AlignCenter className={cn(isCompact ? "w-3 h-3" : "w-4 h-4")} />}
                {align === 'right' && <AlignRight className={cn(isCompact ? "w-3 h-3" : "w-4 h-4")} />}
                {align === 'justify' && <AlignJustify className={cn(isCompact ? "w-3 h-3" : "w-4 h-4")} />}
              </button>
            ))}
          </div>
        </div>

        {/* Font Size & Weight */}
        <div className={cn(isCompact ? "space-y-3" : "space-y-4")}>
          <div className={cn("grid", isCompact ? "grid-cols-2 gap-2" : "grid-cols-2 gap-4")}>
            <div className={cn(isCompact ? "space-y-1.5" : "space-y-2")}>
              <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Size</label>
              <input 
                type="number" 
                className="w-full bg-neutral-800/50 border border-neutral-700/50 rounded-lg p-2 text-sm text-white"
                value={Number.isNaN(textObj.fontSize as number) ? '' : (textObj.fontSize ?? 40)}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  updateProperty('fontSize', isNaN(val) ? 40 : val);
                }}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Weight</label>
              <input 
                type="number" 
                step="100" min="100" max="900"
                className="w-full bg-neutral-800/50 border border-neutral-700/50 rounded-lg p-2 text-sm text-white"
                value={textObj.fontWeight === 'normal' ? 400 : textObj.fontWeight === 'bold' ? 700 : parseInt(textObj.fontWeight as string) || 400}
                onChange={(e) => updateProperty('fontWeight', isNaN(parseInt(e.target.value)) ? 400 : parseInt(e.target.value))}
              />
            </div>
          </div>
          
          {/* Spacing & Line Height */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] flex justify-between font-semibold text-neutral-400 uppercase tracking-wider"><span>Letter SP</span> <span>{textObj.charSpacing || 0}</span></label>
              <input 
                type="range" min="-200" max="1000" step="10"
                className="w-full accent-indigo-500"
                value={textObj.charSpacing || 0}
                onChange={(e) => updateProperty('charSpacing', parseInt(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] flex justify-between font-semibold text-neutral-400 uppercase tracking-wider"><span>Line HT</span> <span>{(textObj.lineHeight || 1.16).toFixed(2)}</span></label>
              <input 
                type="range" min="0.5" max="3" step="0.05"
                className="w-full accent-indigo-500"
                value={textObj.lineHeight || 1.16}
                onChange={(e) => updateProperty('lineHeight', parseFloat(e.target.value))}
              />
            </div>
          </div>
        </div>

        {/* Color & Opacity */}
        <div className="space-y-4 pt-4 border-t border-neutral-800">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Text Color</label>
            <div className="flex gap-1">
              <button
                onClick={() => updateProperty('gradient', false)}
                className={cn("px-2 py-0.5 text-[10px] rounded", !isGradient ? 'bg-neutral-700 text-white' : 'text-neutral-500')}
              >Solid</button>
              <button
                onClick={() => updateProperty('gradient', true)}
                className={cn("px-2 py-0.5 text-[10px] rounded", isGradient ? 'bg-neutral-700 text-white' : 'text-neutral-500')}
              >Gradient</button>
            </div>
          </div>
          
          {isGradient ? (
            <div className="space-y-2 bg-neutral-800/30 p-3 rounded-lg border border-neutral-800">
              <label className="text-xs text-neutral-400 block mb-1">Color Stops</label>
              <div className="flex gap-2 items-center">
                <input 
                  type="color" 
                  className="w-8 h-8 rounded shrink-0 bg-transparent border-0 p-0 m-0 cursor-pointer"
                  value={(textObj.fill as any)?.colorStops?.[0]?.color || '#ff0000'}
                  onChange={(e) => {
                    const currentStops = (textObj.fill as any).colorStops || [];
                    const newGradient = new fabric.Gradient({
                      type: 'linear', coords: { x1: 0, y1: 0, x2: textObj.width || 100, y2: 0 },
                      colorStops: [
                        { offset: 0, color: e.target.value },
                        { offset: 1, color: currentStops[1]?.color || '#0000ff' }
                      ]
                    });
                    updateProperty('fill', newGradient);
                  }}
                />
                <span className="text-xs text-neutral-500">to</span>
                <input 
                  type="color" 
                  className="w-8 h-8 rounded shrink-0 bg-transparent border-0 p-0 m-0 cursor-pointer"
                  value={(textObj.fill as any)?.colorStops?.[1]?.color || '#0000ff'}
                  onChange={(e) => {
                    const currentStops = (textObj.fill as any).colorStops || [];
                    const newGradient = new fabric.Gradient({
                      type: 'linear', coords: { x1: 0, y1: 0, x2: textObj.width || 100, y2: 0 },
                      colorStops: [
                        { offset: 0, color: currentStops[0]?.color || '#ff0000' },
                        { offset: 1, color: e.target.value }
                      ]
                    });
                    updateProperty('fill', newGradient);
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="flex bg-neutral-800/50 border border-neutral-700/50 rounded-lg p-1">
                <input 
                  type="color" 
                  className="w-8 h-8 rounded shrink-0 bg-transparent border-0 p-0 m-0 cursor-pointer"
                  value={typeof textObj.fill === 'string' ? textObj.fill : '#ffffff'}
                  onChange={(e) => updateProperty('fill', e.target.value)}
                />
                <input 
                  type="text" 
                  className="w-full bg-transparent text-sm text-white px-2 focus:outline-none uppercase"
                  value={typeof textObj.fill === 'string' ? textObj.fill : '#ffffff'}
                  onChange={(e) => updateProperty('fill', e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                 <span className="text-xs text-neutral-500">Opac.</span>
                 <input 
                   type="range" max="1" min="0" step="0.05"
                   className="w-full accent-indigo-500"
                   value={Number.isNaN(textObj.opacity as number) ? 1 : (textObj.opacity ?? 1)}
                   onChange={(e) => updateProperty('opacity', parseFloat(e.target.value))}
                 />
              </div>
            </div>
          )}
        </div>

        {/* Stroke / Outline */}
        <div className="space-y-4 pt-4 border-t border-neutral-800">
          <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Outline (Stroke)</label>
          <div className="flex items-center gap-3">
            <input 
              type="color" 
              className="w-8 h-8 rounded shrink-0 bg-neutral-800/50 border border-neutral-700/50 p-0 m-0 cursor-pointer"
              value={typeof textObj.stroke === 'string' ? textObj.stroke : '#000000'}
              onChange={(e) => updateProperty('stroke', e.target.value)}
            />
            <div className="flex-1 flex items-center gap-2">
              <span className="text-xs text-neutral-500">Width</span>
              <input 
                type="range" min="0" max="20" step="0.5"
                className="flex-1 accent-indigo-500"
                value={textObj.strokeWidth || 0}
                onChange={(e) => updateProperty('strokeWidth', parseFloat(e.target.value))}
              />
            </div>
          </div>
        </div>

        {/* Shadow */}
        <div className="space-y-4 pt-4 border-t border-neutral-800">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Drop Shadow / Glow</label>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <input 
                type="color"
                className="w-8 h-8 rounded shrink-0 bg-neutral-800/50 border border-neutral-700/50 p-0 m-0 cursor-pointer"
                value={(textObj.shadow as fabric.Shadow)?.color || '#000000'}
                onChange={(e) => {
                  const s = (textObj.shadow as fabric.Shadow) || { blur: 0, offsetX: 0, offsetY: 0 };
                  const shadow = new fabric.Shadow({ ...s, color: e.target.value });
                  updateProperty('shadow', shadow);
                }}
              />
              <div className="flex-1 flex items-center gap-2">
                <span className="text-xs text-neutral-500 w-12">Blur</span>
                <input 
                  type="range" min="0" max="100" 
                  className="flex-1 accent-indigo-500"
                  value={(textObj.shadow as fabric.Shadow)?.blur || 0}
                  onChange={(e) => {
                    const s = (textObj.shadow as fabric.Shadow) || { offsetX: 0, offsetY: 0, color: 'rgba(0,0,0,0.5)' };
                    const shadow = new fabric.Shadow({ ...s, blur: parseInt(e.target.value, 10) });
                    updateProperty('shadow', shadow);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  function renderImageProperties() {
    const imgObj = activeObject as fabric.Image;
    
    // Sometimes filters might be removed but object keeps ref.
    const brightnessFilter = getFilter(imgObj, 'Brightness') as any;
    const contrastFilter = getFilter(imgObj, 'Contrast') as any;
    const saturationFilter = getFilter(imgObj, 'Saturation') as any;
    const blurFilter = getFilter(imgObj, 'Blur') as any;
    const sharpenFilter = getFilter(imgObj, 'Convolute') as any;

    return (
      <div className="space-y-6">
        {/* Flip & Reset */}
        <div className="flex gap-2">
          <button
            onClick={() => updateProperty('flipX', !imgObj.flipX)}
            className={cn("flex-1 p-2 flex justify-center items-center rounded-lg border transition-colors", imgObj.flipX ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400' : 'bg-neutral-800/50 border-neutral-700/50 text-neutral-400 hover:text-white')}
            title="Flip Horizontally"
          ><FlipHorizontal className="w-4 h-4" /></button>
          <button
            onClick={() => updateProperty('flipY', !imgObj.flipY)}
            className={cn("flex-1 p-2 flex justify-center items-center rounded-lg border transition-colors", imgObj.flipY ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400' : 'bg-neutral-800/50 border-neutral-700/50 text-neutral-400 hover:text-white')}
            title="Flip Vertically"
          ><FlipVertical className="w-4 h-4" /></button>
          <button
            onClick={() => { updateProperty('scaleX', 1); updateProperty('scaleY', 1); updateProperty('angle', 0); }}
            className="flex-1 p-2 flex justify-center items-center rounded-lg border bg-neutral-800/50 border-neutral-700/50 text-neutral-400 hover:text-white"
            title="Reset Scale & Rotation"
          ><RotateCcw className="w-4 h-4" /></button>
        </div>

        {/* Adjustments */}
        <div className="space-y-4 pt-2">
          <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-2"><SlidersHorizontal className="w-3 h-3"/> Adjustments</label>
          
          <div className="space-y-3 bg-neutral-900/30 p-3 rounded-lg border border-neutral-800/50">
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-neutral-500">
                <span>Brightness</span>
              </div>
              <input 
                type="range" min="-1" max="1" step="0.05"
                className="w-full accent-indigo-500"
                value={brightnessFilter ? brightnessFilter.brightness : 0}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  applyImageFilter('Brightness', fabric.filters.Brightness, FILTER_INDICES.BRIGHTNESS, val === 0 ? false : { brightness: val });
                }}
              />
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-neutral-500">
                <span>Contrast</span>
              </div>
              <input 
                type="range" min="-1" max="1" step="0.05"
                className="w-full accent-indigo-500"
                value={contrastFilter ? contrastFilter.contrast : 0}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  applyImageFilter('Contrast', fabric.filters.Contrast, FILTER_INDICES.CONTRAST, val === 0 ? false : { contrast: val });
                }}
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-neutral-500">
                <span>Saturation</span>
              </div>
              <input 
                type="range" min="-1" max="1" step="0.05"
                className="w-full accent-indigo-500"
                value={saturationFilter ? saturationFilter.saturation : 0}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  applyImageFilter('Saturation', fabric.filters.Saturation, FILTER_INDICES.SATURATION, val === 0 ? false : { saturation: val });
                }}
              />
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-neutral-500">
                <span>Blur</span>
              </div>
              <input 
                type="range" min="0" max="1" step="0.05"
                className="w-full accent-indigo-500"
                value={blurFilter ? blurFilter.blur : 0}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  applyImageFilter('Blur', fabric.filters.Blur, FILTER_INDICES.BLUR, val === 0 ? false : { blur: val });
                }}
              />
            </div>
          </div>
        </div>

        {/* Image Opacity */}
        <div className="space-y-2 pt-2">
            <label className="text-[10px] flex justify-between font-semibold text-neutral-400 uppercase tracking-wider"><span>Opacity</span> <span>{Number.isNaN(imgObj.opacity as number) ? 1 : (imgObj.opacity ?? 1).toFixed(2)}</span></label>
            <input 
              type="range" max="1" min="0" step="0.05"
              className="w-full accent-indigo-500"
              value={Number.isNaN(imgObj.opacity as number) ? 1 : (imgObj.opacity ?? 1)}
              onChange={(e) => updateProperty('opacity', parseFloat(e.target.value))}
            />
        </div>

        {/* Filters */}
        <div className="space-y-4 pt-4 border-t border-neutral-800">
          <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-2"><ImageIcon className="w-3 h-3"/> Filters</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                const matrix = [ 0, -1,  0,
                                -1,  5, -1,
                                 0, -1,  0 ];
                const isSharpened = sharpenFilter !== null;
                applyImageFilter('Convolute', fabric.filters.Convolute, FILTER_INDICES.SHARPEN, isSharpened ? false : { matrix });
              }}
              className={cn("py-2 px-3 text-xs rounded-lg border transition-colors flex items-center justify-center gap-2", sharpenFilter ? "bg-indigo-500/20 border-indigo-500/50 text-white" : "bg-neutral-800/50 border-neutral-700/50 text-neutral-400 hover:text-white")}
            >
              Sharpen
            </button>

            <button
              onClick={() => {
                const isVintage = getFilter(imgObj, 'Vintage') !== null || getFilter(imgObj, 'Sepia') !== null;
                applyImageFilter('Sepia', fabric.filters.Sepia, FILTER_INDICES.VINTAGE, isVintage ? false : {});
              }}
              className={cn("py-2 px-3 text-xs rounded-lg border transition-colors flex items-center justify-center gap-2", getFilter(imgObj, 'Vintage') || getFilter(imgObj, 'Sepia') ? "bg-amber-900/40 border-amber-500/50 text-white" : "bg-neutral-800/50 border-neutral-700/50 text-neutral-400 hover:text-white")}
            >
              Vintage
            </button>

            <button
              onClick={() => {
                const isBW = getFilter(imgObj, 'Grayscale') !== null || getFilter(imgObj, 'BlackWhite') !== null;
                applyImageFilter('Grayscale', fabric.filters.Grayscale, FILTER_INDICES.BW, isBW ? false : {});
              }}
              className={cn("py-2 px-3 text-xs rounded-lg border transition-colors flex items-center justify-center gap-2", getFilter(imgObj, 'Grayscale') || getFilter(imgObj, 'BlackWhite') ? "bg-neutral-700 border-neutral-400 text-white" : "bg-neutral-800/50 border-neutral-700/50 text-neutral-400 hover:text-white")}
            >
              B&W
            </button>
            
            <button
              onClick={() => {
                // eslint-disable-next-line react-hooks/immutability
                imgObj.filters = [];
                imgObj.applyFilters();
                canvas?.requestRenderAll();
                forceUpdate();
                // eslint-disable-next-line react-hooks/refs
                if (debouncedFireRef.current) clearTimeout(debouncedFireRef.current);
                debouncedFireRef.current = setTimeout(() => {
                  canvas?.fire('object:modified', { target: imgObj });
                }, 500);
              }}
              className="py-2 px-3 text-xs rounded-lg border bg-neutral-900 border-red-900/50 text-red-400 hover:text-red-300 hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2"
            >
              Clear All
            </button>
          </div>
        </div>

      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      
      {/* Transform properties shown for both Text and Image */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
          {isText ? <Type className="w-4 h-4 text-indigo-400" /> : <ImageIcon className="w-4 h-4 text-indigo-400" />} 
          {isText ? 'Text Format' : (isGroup || isSelection) ? 'Group Format' : 'Layer Format'}
        </h3>
        
        {/* Rotation */}
        <div className="space-y-2 bg-neutral-800/30 p-3 rounded-lg border border-neutral-800/50">
          <label className="text-[10px] flex justify-between font-semibold text-neutral-400 uppercase tracking-wider">
            <span>Rotation</span>
            <span>{Math.round(activeObject.angle || 0)}°</span>
          </label>
          <div className="flex gap-2">
            <input 
              type="range" min="0" max="360" step="1"
              className="w-full accent-indigo-500"
              value={activeObject.angle || 0}
              onChange={(e) => updateProperty('angle', parseInt(e.target.value))}
            />
            <button 
              onClick={() => updateProperty('angle', 0)}
              className="text-neutral-500 hover:text-white"
              title="Reset Rotation"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Sizes */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Width</label>
            <input 
              type="number"
              className="w-full bg-neutral-800/50 border border-neutral-700/50 rounded-lg p-2 text-sm text-white"
              value={Math.round((activeObject.width || 0) * (activeObject.scaleX || 1))}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (val && activeObject.width) {
                  updateProperty('scaleX', val / activeObject.width);
                }
              }}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Height</label>
            <input 
              type="number"
              className="w-full bg-neutral-800/50 border border-neutral-700/50 rounded-lg p-2 text-sm text-white"
              value={Math.round((activeObject.height || 0) * (activeObject.scaleY || 1))}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (val && activeObject.height) {
                  updateProperty('scaleY', val / activeObject.height);
                }
              }}
            />
          </div>
        </div>

        {/* Blend Mode */}
        {isText && (
          <div className="space-y-2 pt-2">
            <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Blend Mode</label>
            <select 
              className="w-full bg-neutral-800/50 border border-neutral-700/50 rounded-lg p-2 text-sm text-white focus:outline-none focus:ring-1 inset-ring focus:ring-indigo-500"
              value={activeObject.globalCompositeOperation || 'source-over'}
              onChange={(e) => updateProperty('globalCompositeOperation', e.target.value)}
            >
              {BLEND_MODES.map(mode => <option key={mode} value={mode}>{mode.charAt(0).toUpperCase() + mode.slice(1)}</option>)}
            </select>
          </div>
        )}
      </div>

      <div className="w-full h-px bg-neutral-800 my-4" />

      {isText && renderTextProperties()}
      {isImage && renderImageProperties()}
      
      {(isGroup || isSelection) && (
        <div className="space-y-4 pt-4 border-t border-neutral-800">
          <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Grouping</label>
          {isSelection && (
            <button
              onClick={() => {
                if (canvas) {
                  const activeSelection = canvas.getActiveObject() as fabric.ActiveSelection;
                  if (activeSelection && activeSelection.type === 'activeSelection') {
                    const objects = activeSelection.removeAll();
                    const group = new fabric.Group(objects);
                    canvas.add(group);
                    canvas.setActiveObject(group);
                    canvas.requestRenderAll();
                    forceUpdate();
                    canvas.fire('selection:updated', { selected: [group], deselected: [activeSelection] });
                    if (debouncedFireRef.current) clearTimeout(debouncedFireRef.current);
                    debouncedFireRef.current = setTimeout(() => {
                      canvas.fire('object:modified', { target: group });
                    }, 500);
                  }
                }
              }}
              className="w-full py-2 px-3 text-xs rounded-lg border bg-indigo-500/20 border-indigo-500/50 text-white hover:bg-indigo-500/30 transition-colors"
            >
              Group Layers
            </button>
          )}
          {isGroup && (
            <button
              onClick={() => {
                if (canvas) {
                  const group = canvas.getActiveObject() as fabric.Group;
                  if (group && group.type === 'group') {
                    const objects = group.removeAll();
                    canvas.remove(group);
                    canvas.add(...objects);
                    const activeSelection = new fabric.ActiveSelection(objects, { canvas });
                    canvas.setActiveObject(activeSelection);
                    canvas.requestRenderAll();
                    forceUpdate();
                    canvas.fire('selection:updated', { selected: [activeSelection], deselected: [group] });
                    if (debouncedFireRef.current) clearTimeout(debouncedFireRef.current);
                    debouncedFireRef.current = setTimeout(() => {
                      canvas.fire('object:modified', { target: activeSelection });
                    }, 500);
                  }
                }
              }}
              className="w-full py-2 px-3 text-xs rounded-lg border bg-neutral-800/50 border-neutral-700/50 text-neutral-400 hover:text-white transition-colors"
            >
              Ungroup
            </button>
          )}
        </div>
      )}

      {renderGlobalSettings()}

    </div>
  );
}
