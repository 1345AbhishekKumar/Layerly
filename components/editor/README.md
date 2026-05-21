# Editor Components

This directory contains the core UI components for the Text Behind Image editor.

## Key Components

- **WorkspaceCanvas.tsx**: The main drawing area powered by Fabric.js. Handles file drops and background processing overlays.
- **Store**: Global state managed by **Zustand** (located in `/store/editor-store.ts`) and provided via `EditorStoreProvider` (located in `/providers/editor-store-provider.tsx`). This replaces the old React Context for better performance and Next.js compatibility.
- **TopNavbar.tsx**: Contains global actions like Undo/Redo, Export, and Gallery access.
- **LeftToolbar.tsx**: Tools for adding text, uploading images, and toggling the eraser.
- **RightSidebar.tsx**: Contextual panels for editing properties of the selected layer (Layers Panel, Properties Panel).
- **AIAssistantTab.tsx**: Integrates with Google Gemini to provide design suggestions based on the current canvas content.
