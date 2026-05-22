import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, set } from 'idb-keyval';

export interface GalleryImage {
  id: string;
  dataUrl: string;
  canvasState?: any;
  createdAt: number;
}

const GALLERY_KEY = 'cinetext_gallery';

export function useGallery() {
  const queryClient = useQueryClient();

  // 1. Fetching data with useQuery
  const { data: images = [], isLoading } = useQuery({
    queryKey: ['gallery'],
    queryFn: async () => {
      // Load from IndexedDB
      const stored = await get(GALLERY_KEY);
      
      if (stored) {
        return stored as GalleryImage[];
      }

      // Fallback for older localStorage images (migration)
      const oldStored = typeof window !== 'undefined' ? localStorage.getItem(GALLERY_KEY) : null;
      if (oldStored) {
        try {
          const parsed = JSON.parse(oldStored);
          await set(GALLERY_KEY, parsed); // Migrate to IDB
          localStorage.removeItem(GALLERY_KEY); // Clean up old storage
          return parsed as GalleryImage[];
        } catch (e) {
          console.error('Failed to parse gallery from local storage', e);
        }
      }
      
      return [] as GalleryImage[];
    },
    // Set a long stale time since this is local data and doesn't change 
    // unless the user takes an action
    staleTime: Infinity, 
  });

  // 2. Saving data with useMutation
  const saveMutation = useMutation({
    mutationFn: async ({ id, dataUrl, canvasState }: { id?: string; dataUrl: string; canvasState?: any }) => {
      const currentImages = queryClient.getQueryData<GalleryImage[]>(['gallery']) || [];
      
      let updatedImages: GalleryImage[];
      let finalId = id;

      if (id) {
        // Update existing image
        updatedImages = currentImages.map(img => 
          img.id === id 
            ? { ...img, dataUrl, canvasState, updatedAt: Date.now() } 
            : img
        );
      } else {
        // Create new image
        finalId = crypto.randomUUID();
        const newImage: GalleryImage = {
          id: finalId,
          dataUrl,
          canvasState,
          createdAt: Date.now(),
        };
        updatedImages = [newImage, ...currentImages];
      }
      
      await set(GALLERY_KEY, updatedImages);
      return { updatedImages, id: finalId };
    },
    onSuccess: () => {
      // Invalidate the gallery query to trigger a background refetch 
      // and ensure UI consistency
      queryClient.invalidateQueries({ queryKey: ['gallery'] });
    },
  });

  // 3. Deleting data with useMutation
  const deleteMutation = useMutation({
    mutationFn: async (idOrIds: string | string[]) => {
      const currentImages = queryClient.getQueryData<GalleryImage[]>(['gallery']) || [];
      const idsToDelete = Array.isArray(idOrIds) ? idOrIds : [idOrIds];
      const updatedImages = currentImages.filter(img => !idsToDelete.includes(img.id));
      
      await set(GALLERY_KEY, updatedImages);
      return updatedImages;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gallery'] });
    },
  });

  return { 
    images, 
    isLoading,
    saveImageToGallery: (dataUrl: string, canvasState?: any, id?: string) => 
      saveMutation.mutateAsync({ dataUrl, canvasState, id }), 
    deleteImage: (idOrIds: string | string[]) => deleteMutation.mutateAsync(idOrIds) 
  };
}
