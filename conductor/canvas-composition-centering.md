# Comprehensive Centering Fix Plan

## Objective
Ensure that not only the background images, but *all* edited elements (including text) remain centered and maintain their relative positions upon page refresh or state restoration.

## Root Cause
My previous fix mathematically snapped the `BASE_IMAGE` and `FOREGROUND_IMAGE` to the exact center of the new canvas dimensions. However, it left other objects (like text) at their absolute coordinates from the saved JSON. If the new screen size differs from the saved one, the images would move to the new center, but the text would remain at the old coordinates, breaking the relative composition.

## Proposed Solution
Instead of snapping just the images to the center, we will calculate the vector delta required to move the `BASE_IMAGE` to the new center. We will then apply this exact delta (dx, dy) to **all** objects on the canvas. This guarantees that the entire composition moves as a single unified scene, perfectly preserving the layout that the user created while ensuring the main subject is centered.

## Implementation Steps

### 1. Update Centering Logic
**File**: `lib/fabric-utils.ts`
- **Change**: Modify `reCenterMainLayers` (perhaps rename it to `reCenterComposition`) to:
  1. Locate the `BASE_IMAGE`.
  2. If found, calculate the difference (`dx`, `dy`) between the canvas center (`cw / 2`, `ch / 2`) and the `BASE_IMAGE`'s current `left` and `top`.
  3. Apply this `dx` and `dy` shift to *every* object on the canvas, including their `clipPath` if absolute positioned.
  4. Ensure `setCoords()` is called on all shifted objects.

### 2. Update Import References
**File**: `components/Editor.tsx` & `hooks/use-autosave.ts`
- **Change**: Rename references from `reCenterMainLayers` to the new unified function name.

## Verification
- Add text and an image, move the text off-center.
- Trigger an autosave and refresh the page.
- Verify that both the image and the text maintain their relative positions and are correctly centered as a group.