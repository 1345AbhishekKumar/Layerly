# Gallery Auto-Save & Update Implementation Plan

## Objective
Implement auto-saving to the gallery and update logic for existing items to prevent duplicate entries, while preserving the existing session recovery functionality.

## Background & Motivation
Currently, every time a user clicks "Save" to save a design to the gallery, a new ID is generated, creating a duplicate entry even if the user is just updating a previously loaded design. Additionally, users want their gallery designs to automatically save as they work on them.

## Scope & Impact
- **State Management**: Track the currently active gallery item ID.
- **Gallery Logic**: Support "Upsert" (Update or Insert) operations.
- **Auto-save Logic**: Introduce a secondary, longer debounce to handle gallery auto-saving without impacting performance (generating thumbnails is more expensive than saving JSON).

## Proposed Solution

### 1. Track Active Design
Modify the Zustand store in `store/editor-store.ts` to include `currentGalleryId`:
- Add `currentGalleryId: string | null` to the state.
- Add `setCurrentGalleryId: (id: string | null) => void` to the actions.

### 2. Update Gallery Hook
Modify `hooks/use-gallery.ts` to support updating:
- Update `saveMutation` to accept an `id?: string`.
- If an `id` is provided, find and update the existing image.
- If no `id` is provided, create a new entry with a new UUID.
- Ensure the mutation returns the saved/generated ID so the editor can track it.

### 3. Update Editor Flow
Modify `components/Editor.tsx`:
- When an image is loaded from the gallery (`handleLoadFromGallery`), call `setCurrentGalleryId(image.id)`.
- When a new image is dropped or uploaded (`onDrop`), call `setCurrentGalleryId(null)`.
- Update `handleSaveToGallery` to pass `currentGalleryId` to the save hook. On successful save, if a new ID was generated, update `currentGalleryId`.
- Extract the thumbnail generation and saving logic into a shared function so it can be called by both manual and auto-save mechanisms.

### 4. Implement Gallery Auto-save
Modify `hooks/use-autosave.ts`:
- Accept a new `onGalleryAutoSave` callback (using `useRef` internally to keep it stable and avoid re-triggering effects).
- Add a secondary debounce timer (e.g., 3-5 seconds) for gallery saves.
- When an object is added/modified/removed, trigger both the immediate IDB session save (1s) and the delayed gallery auto-save (3-5s).

## Verification & Testing
1. **Manual Save**: Load an image, click Save multiple times, verify no duplicates are created.
2. **Auto-save**: Load an image, make changes, wait 5 seconds, open gallery and verify the thumbnail and state are updated without duplicates.
3. **Session Recovery**: Refresh the page with unsaved changes; ensure the design is restored correctly.
4. **New Design**: Drop a new image, ensure a new gallery item is created upon saving.