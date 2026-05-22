# Technical Deep Dive: ML Masking Architecture

This document explains the technical implementation of machine learning-based masking in Layerly, focusing on how high-performance subject extraction is achieved directly in the browser.

---

## 1. Core Technologies

### WebAssembly (WASM) & SIMD
JavaScript's JIT compilation is insufficient for the tensor math required by deep learning. Layerly utilizes **WASM with SIMD (Single Instruction, Multiple Data)** extensions.
- **SIMD Optimization**: Allows the processor to perform the same operation on multiple data points simultaneously, which is critical for the matrix multiplications found in neural network layers.
- **WASM Threads**: The runtime leverages `SharedArrayBuffer` to distribute the inference workload across multiple web workers, preventing the main UI thread from freezing during "Auto-Mask" operations.

### ONNX Runtime (ORT) Web
The application uses `onnxruntime-web` to execute the pre-trained models.
- **Backend Selection**: ORT Web automatically selects the most efficient backend available:
    1. **WebGPU**: The next-gen API for high-performance GPU access (if available).
    2. **WASM + SIMD**: Highly optimized CPU execution.
    3. **WebGL**: Legacy GPU acceleration via fragment shaders.
- **Quantization**: To ensure fast downloads and low memory footprint, the ONNX models are often **8-bit quantized (INT8)**, reducing the model size from ~150MB to ~30MB with negligible loss in masking accuracy.

### The Model: ISNET (Highly Accurate Intermediate Feature Supervised Networks)
The underlying architecture is typically based on **ISNET** or similar **U-Net** variants optimized for salient object detection.
- **Global Context**: The encoder path captures the high-level "what" of the image (e.g., "this is a person").
- **Local Detail**: The decoder path and skip connections preserve the "where" (e.g., the fine strands of hair).

---

## 2. Implementation Workflow

### AI Extraction Lifecycle (`use-background-removal.ts`)
1. **Asset Fetching**: On first use, the app fetches the WASM binaries and the `.onnx` model file. These are cached in the browser's **Cache Storage** (via `@imgly/background-removal`) for instant subsequent loads.
2. **Preprocessing**: 
    - The input image is resized to the model's expected input shape (e.g., 1024x1024).
    - Normalization is applied (converting 0-255 RGB values to a 0.0-1.0 float range).
3. **Inference**: The tensor is passed through the model.
4. **Post-processing**: 
    - The output "probability map" is upsampled back to the original image dimensions.
    - A **Guided Filter** or similar matting technique is applied to refine the edges.

### Manual Refinement Logic (`Editor.tsx`)
Layerly uses a **Non-Destructive Vector Masking** approach within Fabric.js.

```typescript
// How the Eraser interacts with the ML result
const fgImg = canvas.getObjects().find(o => o.id === LAYER_IDS.FOREGROUND_IMAGE);

// Create a clipPath if it doesn't exist
if (!fgImg.clipPath) {
  fgImg.clipPath = new fabric.Group([], {
    inverted: true, // Key: The path SUBTRACTS from visibility
    absolutePositioned: true // Ensures the mask stays fixed relative to the canvas
  });
}

// Every brush stroke becomes a vector path in the mask
(fgImg.clipPath as fabric.Group).add(path);
```

---

## 3. Performance & Memory Management

- **Garbage Collection**: Layerly prefers **Data URLs (Base64)** for local persistence in IndexedDB. While `URL.revokeObjectURL()` is not needed for strings, the application ensures that temporary Blobs created during the ML process are handled efficiently by the garbage collector once the conversion to Data URL is complete.
- **Lazy Loading**: The `@imgly/background-removal` package is loaded using **Dynamic Imports** (`await import(...)`), ensuring that users who only want to use text or shapes don't download the heavy ML binaries.
- **Offscreen Processing**: All image processing (resizing, matting) is performed on an `OffscreenCanvas` (managed by the `@imgly` library) to keep the user interface responsive at 60fps.

---

## 4. Why This Architecture?

| Feature | Local ML (Layerly) | Server-Side AI (Traditional) |
| :--- | :--- | :--- |
| **Privacy** | Data never leaves the device. | Image sent to 3rd party servers. |
| **Cost** | Uses client hardware ($0). | Requires expensive GPU servers. |
| **Latency** | Instant (200ms - 800ms). | Dependent on upload speed (2s - 10s). |
| **Persistence** | Works offline. | Requires active internet. |
