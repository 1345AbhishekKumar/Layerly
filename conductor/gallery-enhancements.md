# Gallery Modal Enhancements Plan

## Objective
Enhance the `GalleryModal.tsx` by implementing a cleaner visual design (hover-state interactions) and adding an integrated Lightbox (Quick View) feature.

## Scope & Impact
- **File to modify:** `components/GalleryModal.tsx`
- **Impact:** Improves user experience by decluttering the gallery grid and allowing full-resolution previews of generated assets without leaving the gallery.

## Implementation Steps

### Phase 1: Visual Clean-up (Hover States)
1. Modify the image card container in `GalleryModal.tsx` to handle hover states better.
2. Hide the action toolbar (Bottom section with Edit, Download, Delete) and metadata (Top section) by default.
3. Add CSS transitions or Framer Motion animations to reveal these elements only when the user hovers over a specific image card.
4. Ensure the gradient overlays are also subtle until hovered.

### Phase 2: Integrated Lightbox / Quick View
1. Add state to track the currently previewed image (`previewImage`, string or `GalleryImage | null`).
2. Add a full-screen Lightbox component within `GalleryModal`.
3. The Lightbox should display the full-size image, a close button, and optionally next/prev navigation if time permits (or just simple single-image preview).
4. Update the image card so clicking the image itself (or a new 'Expand' button on hover) opens the Lightbox.

### Phase 3: Search, Filter, and Sort Toolbar
1. Add state variables for `searchQuery` (string), `sortBy` ('newest' | 'oldest'), and `filterBy` ('all' | 'editable').
2. Add a new toolbar UI below the gallery header but above the scrollable content.
3. The toolbar should contain:
   - A search input (filtering by ID or date).
   - A sort dropdown/toggle.
   - A filter dropdown/toggle.
4. Update the logic that maps over `images` to first apply the filter, then the search query, and finally the sort order.

### Phase 4: Multi-Select & Bulk Action Mode
1. Add state for `isSelectionMode` (boolean) and `selectedAssetIds` (array of strings).
2. Add a "Select" or "Bulk Actions" toggle button in the gallery header or toolbar.
3. Update the image card UI:
   - If `isSelectionMode` is true, show a checkbox or selection ring on each card.
   - Clicking a card in selection mode toggles its selection state rather than opening the lightbox.
4. Add a floating Bulk Action Bar at the bottom of the screen (visible only when `isSelectionMode` is true and `selectedAssetIds.length > 0`).
5. The Bulk Action Bar should contain:
   - A display of the number of selected items.
   - A "Delete Selected" button (calls `onDelete` for each ID).
   - A "Download Selected" button (downloads each selected image, or ideally zips them, but individual downloads might be easier for now).
   - A "Cancel" button to exit selection mode.

## Verification
- Verify the gallery grid appears cleaner by default (done).
- Verify hovering over an image reveals all actions and metadata smoothly (done).
- Verify clicking an image opens the Lightbox (done).
- Verify the Lightbox can be closed to return to the gallery (done).
- Verify the Search, Filter, and Sort toolbar correctly manipulates the displayed images.
- Verify Multi-Select mode allows selecting multiple assets and performing bulk deletion.

## Migration & Rollback
- Since these are UI enhancements, rollback is simply reverting `components/GalleryModal.tsx` to the previous commit.