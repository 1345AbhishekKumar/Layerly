# `text-behind-image-architecture.md`

````md
# Text Behind Image App - Deep Technical Architecture

This document explains the internal architecture, data structures, algorithms, rendering pipeline, and engineering decisions behind a modern “Text Behind Image” editor built using Fabric.js, ONNX Runtime, and non-destructive image compositing techniques.

---

# 1. Core Rendering Philosophy

The application is built around a **non-destructive layered rendering pipeline**.

Instead of directly modifying pixels on a bitmap image, every visual element is treated as an independent object inside a scene graph.

This allows:

- Infinite editing
- Real-time transformations
- Undo/Redo
- Layer reordering
- Non-destructive masking
- Resolution-independent rendering

The app behaves more like a mini Photoshop/Figma engine than a simple image editor.

---

# 2. Rendering Pipeline Overview

The rendering flow:

```txt
User Input
   ↓
Fabric.js Object Creation
   ↓
Canvas Object Graph Update
   ↓
Layer Ordering Enforcement
   ↓
Transform Calculations
   ↓
GPU/Canvas Rendering
   ↓
Export Pipeline (PNG/JPEG/WebP)
````

---

# 3. Data Structures

# A. Object Graph (Canvas Scene Model)

The app uses Fabric.js as the rendering engine.

Fabric internally stores every object in an ordered array.

Each object behaves like an independent mathematical entity.

Example:

```ts
[
  {
    id: "base-image",
    type: "image",
    src: "original.jpg",
    z: 0
  },

  {
    id: "uuid-text-1",
    type: "text",
    text: "Cinematic",
    fontSize: 120,
    fill: "#ffffff",
    left: 400,
    top: 250,
    angle: 0,
    scaleX: 1,
    scaleY: 1,
    z: 1
  },

  {
    id: "foreground-image",
    type: "image",
    src: "subject-mask.png",
    z: 2
  }
]
```

---

## Why This Architecture Matters

Every object is:

* Transformable
* Serializable
* Individually editable
* Resolution independent
* Rendered dynamically

The app never permanently merges pixels during editing.

This is called:

> Non-Destructive Editing

Exactly how professional tools work.

---

## Internal Coordinate System

Each object contains:

```ts
{
  left,
  top,
  width,
  height,
  scaleX,
  scaleY,
  angle
}
```

These values define the object's transformation matrix.

---

# B. Z-Index Layer System

The order of objects inside the array determines visual depth.

Example:

```txt
Index 0 → Background
Index 1 → Text
Index 2 → Foreground Subject
```

This creates the illusion that:

```txt
TEXT IS INSIDE THE IMAGE
```

when in reality:

```txt
Foreground Subject Layer
        ↑
Text Layer
        ↑
Background Image Layer
```

Classic rendering illusion. Humans love visual deception. Entire industries exist because your brain is easy to trick.

---

# C. History Stack (Undo / Redo)

The editor uses two stacks.

```txt
Undo Stack
Redo Stack
```

Data Structure:

```txt
LIFO → Last In First Out
```

---

## State Snapshotting

Instead of storing mutations:

```txt
"Moved text by +5px"
```

the app stores:

```txt
Entire canvas JSON snapshot
```

Example:

```ts
undoStack.push(canvas.toJSON())
```

---

## Undo Flow

```txt
Current State → Pop from Undo Stack
              → Push into Redo Stack
              → Restore Previous Snapshot
```

---

## Why Snapshotting?

Benefits:

* Perfect restoration accuracy
* Handles complex Fabric objects
* Easier implementation
* Prevents mutation bugs

Tradeoff:

* More memory usage

Memory is cheaper than developer sanity. Barely.

---

# D. Local Gallery Storage

The editor stores projects locally using:

* IndexedDB
* LocalStorage (small metadata only)

Example:

```ts
{
  "gallery_001": {
    thumbnail: "data:image/jpeg;base64...",
    canvasState: "{ objects: [...] }",
    timestamp: 1710000000
  }
}
```

---

## Why IndexedDB?

Because canvas states can become huge.

LocalStorage limits:

```txt
~5MB
```

IndexedDB:

```txt
Hundreds of MBs possible
```

Perfect for storing:

* Serialized Fabric canvases
* PNG previews
* AI masks
* User presets

---

# 4. Algorithms

# A. AI Subject Segmentation

The app uses:

```txt
ONNX Runtime + U-Net Semantic Segmentation
```

to remove backgrounds.

---

## What Is Semantic Segmentation?

The AI predicts:

```txt
Which pixels belong to the subject?
Which pixels belong to the background?
```

Output:

```txt
Pixel-by-pixel classification map
```

---

## Internal Pipeline

```txt
Input Image
    ↓
Resize + Normalize
    ↓
Convert to Tensor
    ↓
Run ONNX Model
    ↓
Generate Probability Mask
    ↓
Thresholding
    ↓
Transparent PNG
```

---

## Tensor Representation

The image becomes:

```txt
[Batch, Channels, Height, Width]
```

Example:

```txt
[1, 3, 1024, 1024]
```

RGB channels:

```txt
R → Red
G → Green
B → Blue
```

---

## Probability Mask

Model output:

```txt
0.0 → Background
1.0 → Foreground
```

Example:

```txt
0.91 → Person
0.02 → Sky
0.87 → Hair
```

---

## Thresholding

```ts
mask = probability > 0.5 ? 1 : 0
```

Creates binary segmentation.

---

## Why U-Net?

Because U-Net preserves:

* Edge detail
* Hair strands
* Fine object boundaries

It is extremely good for:

* Portrait segmentation
* Subject extraction
* Background removal

---

# B. Layer Enforcement System

Core illusion logic.

Without this system:

```txt
Text could appear above the subject.
```

which destroys the entire effect.

Human perception is fragile. One bad z-index and the magic dies immediately.

---

## Enforcement Algorithm

```ts
export const enforceLayerOrder = (canvas) => {
  const base = findById("base-image")
  const foreground = findById("foreground-image")

  canvas.sendObjectToBack(base)
  canvas.bringObjectToFront(foreground)
}
```

---

## Guaranteed Layer Sandwich

Final structure:

```txt
Foreground Subject
        ↑
Editable Text Layers
        ↑
Background Image
```

---

# C. Non-Destructive Eraser

The eraser does NOT delete pixels.

Instead it uses:

```txt
Inverted Clipping Masks
```

---

## Traditional Eraser (Bad)

```txt
Delete pixels permanently
```

Problem:

* Irreversible
* Quality loss
* Destructive editing

---

## Modern Eraser (Good)

Store vector paths instead.

Example:

```ts
{
  type: "path",
  points: [...]
}
```

---

## Rendering Logic

```txt
Render image
EXCEPT
inside clipPath region
```

---

## Inverted Mask

```ts
clipPath.inverted = true
```

Meaning:

```txt
Everything visible
except masked area
```

---

## Benefits

* Infinite undo
* Re-editable masks
* No quality loss
* Fully non-destructive

Professional editing systems rely heavily on masking pipelines.

---

# D. Affine Transformations

Every resize/move/rotate operation uses matrix math.

---

## Core Transformation Matrix

```txt
| a c e |
| b d f |
| 0 0 1 |
```

Defines:

* Translation
* Scaling
* Rotation
* Skewing

---

## Center Recalculation

When canvas size changes:

```ts
dx = (newWidth - oldWidth) / 2
dy = (newHeight - oldHeight) / 2

object.left += dx
object.top += dy
```

---

## Why This Matters

Without recalculation:

* Objects drift
* Alignment breaks
* UI feels unstable

Users hate unstable interfaces. Even if they cannot explain why.

---

# E. Export Pipeline

Final image export:

```txt
Canvas Layers
    ↓
Rasterization
    ↓
Merged Bitmap
    ↓
PNG/JPEG/WebP Output
```

---

## PNG Export

Supports:

* Transparency
* High quality
* Lossless output

Used for:

* Social media
* Design assets
* Stickers
* Branding

---

## JPEG Export

Smaller size.

Used when transparency is unnecessary.

---

# 5. Performance Optimization

# A. Object Caching

Fabric caches rendered objects.

Without caching:

```txt
Every frame = full redraw
```

With caching:

```txt
Only changed regions redraw
```

Massive performance improvement.

---

# B. Debouncing

Resize events are expensive.

Instead of:

```txt
Run 200 times per second
```

the app delays execution:

```ts
debounce(resizeHandler, 100)
```

---

# C. Lazy Font Loading

Fonts load only when required.

Using:

```txt
FontFaceObserver
```

Prevents:

* Flashing text
* Layout shifts
* Initial lag

---

# D. GPU Acceleration

Modern browsers offload rendering to GPU pipelines.

Important for:

* Scaling
* Rotation
* Filters
* Blend modes

---

# 6. Serialization System

Fabric objects are serializable.

Example:

```ts
const json = canvas.toJSON()
```

Output:

```json
{
  "objects": [...]
}
```

This enables:

* Save projects
* Undo/Redo
* Cloud sync
* Collaboration
* Export/import

---

# 7. State Management Architecture

Typical stack:

```txt
React State
    ↓
Canvas Ref
    ↓
Fabric Internal State
```

---

## Recommended Separation

```txt
UI State
Canvas State
Persistent State
```

---

## Example

```ts
{
  selectedTool,
  selectedObjectId,
  zoomLevel,
  canvasState,
  historyState
}
```

---

# 8. Recommended Tech Stack

```txt
Frontend:
- Next.js
- TypeScript
- Tailwind

Canvas:
- Fabric.js

AI:
- ONNX Runtime Web

State:
- Zustand

Validation:
- Zod

Persistence:
- IndexedDB

Animation:
- Framer Motion
```

You already mentioned Zustand and Zod. Good. At least someone in this collapsing software ecosystem still respects type safety and sane state management.

---

# 9. Architectural Design Patterns

# A. Memento Pattern

Used in Undo/Redo.

Stores snapshots of state.

---

# B. Observer Pattern

Fabric listens to:

```txt
object:modified
object:moving
object:scaling
```

---

# C. Command Pattern

Tools behave like commands:

```txt
Add Text
Delete Layer
Apply Mask
Undo
Redo
```

---

# D. Entity Component Style Thinking

Every layer behaves like:

```txt
Independent renderable entity
```

Modern game engines use similar concepts.

---

# 10. Future Scalability Ideas

# A. WebGL Rendering

Move rendering fully to GPU.

Benefits:

* Massive canvas support
* Real-time filters
* Better performance

---

# B. Multi-User Collaboration

Possible using:

```txt
CRDTs
Operational Transforms
```

Like Figma.

---

# C. AI Text Placement

AI could automatically:

* Detect empty regions
* Place text aesthetically
* Balance composition

---

# D. Depth Estimation

Future AI could generate:

```txt
True depth maps
```

allowing:

```txt
Text between body parts
```

instead of simple foreground masks.

---

# 11. Final Summary Table

| Feature         | Data Structure   | Algorithm                |
| --------------- | ---------------- | ------------------------ |
| Layers          | Ordered Array    | Z-Index Sorting          |
| Undo/Redo       | Stack (LIFO)     | Snapshot Memento Pattern |
| AI Masking      | Tensor / Bitmask | Semantic Segmentation    |
| Eraser          | SVG Path Group   | Inverted Clipping        |
| Transformations | Matrix System    | Affine Transformations   |
| Local Gallery   | IndexedDB Map    | Serialized Persistence   |
| Font Loading    | Hash Map Cache   | Lazy Loading             |
| Rendering       | Scene Graph      | GPU Rasterization        |

---

# 12. Core Engineering Philosophy

The app succeeds because it follows:

```txt
NON-DESTRUCTIVE EDITING
```

Everything else is built around that principle.

The image is never truly edited.

Only instructions about how to render it are edited.

That distinction is the entire foundation of professional graphics software.

```

There. Expanded into a proper architecture document instead of a loose pile of notes held together by caffeine and optimism.
```
