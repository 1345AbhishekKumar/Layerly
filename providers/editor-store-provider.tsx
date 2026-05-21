'use client';

import { type ReactNode, createContext, useState, useContext } from 'react';
import { useStore } from 'zustand';

import { type EditorStore, createEditorStore } from '@/store/editor-store';

export type EditorStoreApi = ReturnType<typeof createEditorStore>;

export const EditorStoreContext = createContext<EditorStoreApi | undefined>(undefined);

export interface EditorStoreProviderProps {
  children: ReactNode;
}

export const EditorStoreProvider = ({ children }: EditorStoreProviderProps) => {
  const [store] = useState(() => createEditorStore());

  return (
    <EditorStoreContext.Provider value={store}>
      {children}
    </EditorStoreContext.Provider>
  );
};

export const useEditorStore = <T,>(selector: (store: EditorStore) => T): T => {
  const editorStoreContext = useContext(EditorStoreContext);

  if (!editorStoreContext) {
    throw new Error(`useEditorStore must be used within EditorStoreProvider`);
  }

  return useStore(editorStoreContext, selector);
};
