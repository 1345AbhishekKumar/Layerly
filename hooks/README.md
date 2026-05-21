# Custom Hooks

This directory contains specialized React hooks used throughout the application.

## Key Hooks

- **use-background-removal.ts**: Orchestrates the local ML background removal process using `@imgly/background-removal`.
- **use-history.ts**: Implements the undo/redo logic by tracking canvas state snapshots in IndexedDB.
- **use-autosave.ts**: Periodically saves the current canvas state to ensure work isn't lost.
- **use-gallery.ts**: Manages the local gallery of saved designs using `idb-keyval`.
- **use-shortcuts.ts**: Maps keyboard shortcuts (Ctrl+Z, Ctrl+Y, Delete, etc.) to editor actions.
- **use-mobile.ts**: Utility hook for detecting mobile screen sizes and adjusting UI layout.
