import { createStore } from 'zustand/vanilla';
import * as fabric from 'fabric';

export interface HoverState { top: boolean; left: boolean; right: boolean; bottom: boolean; }
export interface FocusState { top: boolean; left: boolean; right: boolean; bottom: boolean; }

export type EditorTab = 'properties' | 'layers' | 'ai';

export interface EditorState {
  canvas: fabric.Canvas | null;
  activeObject: fabric.Object | null;
  isEraserMode: boolean;
  eraserSize: number;
  isExporting: boolean;
  isGalleryOpen: boolean;
  isPropertiesOpenMobile: boolean;
  clipboard: any | null;
  isFullscreen: boolean;
  hoverState: HoverState;
  focusState: FocusState;
  activeTab: EditorTab;
  isCompact: boolean;
}

export interface EditorActions {
  setCanvas: (canvas: fabric.Canvas | null) => void;
  setActiveObject: (object: fabric.Object | null) => void;
  setIsEraserMode: (isEraserMode: boolean) => void;
  setEraserSize: (eraserSize: number) => void;
  setIsExporting: (isExporting: boolean) => void;
  setIsGalleryOpen: (isGalleryOpen: boolean) => void;
  setIsPropertiesOpenMobile: (isOpen: boolean) => void;
  setClipboard: (clipboard: any) => void;
  setIsFullscreen: (isFullscreen: boolean) => void;
  setHoverState: (hoverState: Partial<HoverState> | ((prev: HoverState) => HoverState)) => void;
  setFocusState: (focusState: Partial<FocusState> | ((prev: FocusState) => FocusState)) => void;
  setActiveTab: (tab: EditorTab) => void;
}

export type EditorStore = EditorState & EditorActions;

export const defaultInitState: EditorState = {
  canvas: null,
  activeObject: null,
  isEraserMode: false,
  eraserSize: 20,
  isExporting: false,
  isGalleryOpen: false,
  isPropertiesOpenMobile: false,
  clipboard: null,
  isFullscreen: false,
  hoverState: { top: false, left: false, right: false, bottom: false },
  focusState: { top: false, left: false, right: false, bottom: false },
  activeTab: 'properties',
  isCompact: true,
};

export const createEditorStore = (initState: EditorState = defaultInitState) => {
  return createStore<EditorStore>()((set) => ({
    ...initState,
    setCanvas: (canvas) => set({ canvas }),
    setActiveObject: (activeObject) => set({ activeObject }),
    setIsEraserMode: (isEraserMode) => set({ isEraserMode }),
    setEraserSize: (eraserSize) => set({ eraserSize }),
    setIsExporting: (isExporting) => set({ isExporting }),
    setIsGalleryOpen: (isGalleryOpen) => set({ isGalleryOpen }),
    setIsPropertiesOpenMobile: (isPropertiesOpenMobile) => set({ isPropertiesOpenMobile }),
    setClipboard: (clipboard) => set({ clipboard }),
    setIsFullscreen: (isFullscreen) => set({ isFullscreen }),
    setHoverState: (update) => 
      set((state) => ({ 
        hoverState: typeof update === 'function' ? update(state.hoverState) : { ...state.hoverState, ...update } 
      })),
    setFocusState: (update) => 
      set((state) => ({ 
        focusState: typeof update === 'function' ? update(state.focusState) : { ...state.focusState, ...update } 
      })),
    setActiveTab: (activeTab) => set({ activeTab }),
  }));
};
