# Canvas Image Centering Fix Plan

## Objective
Fix the issue where the canvas image shifts slightly to the right upon page refresh, page navigation, or autosave restoration.

## Key Files & Context
- `components/Editor.tsx`: Contains the `ResizeObserver` logic responsible for adjusting canvas object coordinates when the container size changes.
- `components/editor/WorkspaceCanvas.tsx`: Contains the actual `<canvas>` DOM element and its container.
- `hooks/use-autosave.ts`: Handles loading the saved JSON state.

## Root Cause Analysis
1. **Sub-pixel Drift**: The `ResizeObserver` calculates a coordinate shift (`dx`, `dy`) based on `contentRect.width` (float) versus the initial `clientWidth` (integer). This causes a tiny, persistent shift on the first frame if the actual width is a fractional pixel.
2. **Implicit Canvas Positioning**: The `<canvas>` element is absolutely positioned but lacks `left: 0; top: 0;`, relying entirely on flexbox centering which can conflict with Fabric.js's internal coordinate system during dynamic resizing.
3. **Restoration Mismatch**: When the canvas state is loaded from JSON (`use-autosave.ts`), it uses the exact coordinates from the previous session. If the new session's canvas size differs even slightly (e.g., sidebars animating in), the image won't be perfectly centered.

## Implementation Steps

### 1. Anchor the Canvas Element
**File**: `components/editor/WorkspaceCanvas.tsx`
- **Change**: Add `top-0 left-0` to the `<canvas>` element's className to ensure its coordinate system perfectly aligns with the container's top-left corner.

### 2. Fix ResizeObserver Logic
**File**: `components/Editor.tsx`
- **Change**: Initialize `prevWidth` and `prevHeight` accurately using the first `ResizeObserver` entry rather than the synchronous `clientWidth`.
- **Change**: Introduce a threshold (e.g., `Math.abs(dx) > 0.5`) to ignore sub-pixel shifts, preventing continuous drifting from browser rounding errors.

### 3. Implement Robust Re-centering
**File**: `components/Editor.tsx` / `hooks/use-autosave.ts`
- **Change**: After `canvas.loadFromJSON()` completes, add logic to explicitly find the `BASE_IMAGE` and `FOREGROUND_IMAGE` (using `LAYER_IDS`) and set their `left` and `top` properties to exactly `canvas.width / 2` and `canvas.height / 2`. This guarantees the images are mathematically centered regardless of layout state.

## Verification
- Load the application, drag an image in, and observe its center position.
- Refresh the page and ensure the image remains perfectly centered without shifting to the right.
- Navigate to another page and back, verifying the same behavior.
- Toggle sidebars (compact mode) to ensure the `ResizeObserver` shifts the image correctly without sub-pixel drift.