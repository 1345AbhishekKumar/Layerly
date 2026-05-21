import * as fabric from 'fabric';
import { v4 as uuidv4 } from 'uuid';
import { CustomFabricObject } from '../types/editor';

// Configure Fabric.js rendering capabilities globally
fabric.config.textureSize = 8192; // Increase maximum texture size for high-res images
fabric.config.enableGLFiltering = true; // Explicitly enable WebGL capable nodes
// Fabric v6+ handles filter backend automatically, but we can access it via getFilterBackend() if needed

// Constants for our layer system
export const LAYER_IDS = {
  BASE_IMAGE: 'base-image',
  FOREGROUND_IMAGE: 'foreground-image',
};

// Insert an object ensuring it stays below the foreground image
export const addTextToCanvas = (canvas: fabric.Canvas) => {
  const text = new fabric.IText('Cinematic', {
    left: canvas.width ? canvas.width / 2 : 200,
    top: canvas.height ? canvas.height / 2 : 200,
    fontFamily: 'Space Grotesk',
    fontSize: 120,
    fontWeight: 'bold',
    fill: '#ffffff',
    originX: 'center',
    originY: 'center',
    shadow: new fabric.Shadow({
      color: 'rgba(0,0,0,0.5)',
      blur: 15,
      offsetX: 0,
      offsetY: 10
    }),
    cornerStyle: 'circle',
    cornerColor: '#6366f1',
    borderColor: '#6366f1',
    transparentCorners: false,
    padding: 10,
  }) as CustomFabricObject;

  text.id = uuidv4();
  text.name = 'Text Layer';

  // Find where to insert it (below foreground if it exists)
  insertBelowForeground(canvas, text);
  
  canvas.setActiveObject(text);
  canvas.requestRenderAll();
};

export const insertBelowForeground = (canvas: fabric.Canvas, obj: CustomFabricObject) => {
  const objects = canvas.getObjects() as CustomFabricObject[];
  const fgIndex = objects.findIndex(o => o.id === LAYER_IDS.FOREGROUND_IMAGE);
  
  if (fgIndex !== -1) {
    canvas.add(obj);
    canvas.moveObjectTo(obj, fgIndex);
  } else {
    canvas.add(obj);
  }
};

// Keeps the layer order correct (Base -> Text -> Foreground)
export const enforceLayerOrder = (canvas: fabric.Canvas) => {
  const objects = canvas.getObjects() as CustomFabricObject[];
  
  const baseImg = objects.find(o => o.id === LAYER_IDS.BASE_IMAGE);
  const fgImg = objects.find(o => o.id === LAYER_IDS.FOREGROUND_IMAGE);
  
  // Send base to back
  if (baseImg) {
    canvas.sendObjectToBack(baseImg);
  }
  
  // Bring foreground to front
  if (fgImg) {
    canvas.bringObjectToFront(fgImg);
  }
};
