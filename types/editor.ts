import * as fabric from 'fabric';

export type LayerInfo = {
  id: string;
  type: string;
  name: string;
  visible: boolean;
  locked: boolean;
};

// Fabric.js types and helpers
// We will augment fabric objects with custom Data
export interface CustomFabricObject extends fabric.Object {
  id?: string;
  name?: string;
  isForeground?: boolean;
}
