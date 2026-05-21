'use client';
import { useState } from 'react';

export function useBackgroundRemoval() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const removeBackground = async (imageFile: File | Blob): Promise<string> => {
    setIsProcessing(true);
    setProgress(0);
    try {
      const pkg = await import('@imgly/background-removal');
      const imglyRemoveBackground = (pkg as any).removeBackground || (pkg as any).default || pkg;
      
      const blob = await imglyRemoveBackground(imageFile, {
        progress: (key: string, current: number, total: number) => {
          // Calculate overall progress roughly
          if (total > 0) {
            setProgress((current / total) * 100);
          }
        }
      });
      
      // Convert blob to Data URL for persistence
      const url = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      
      setIsProcessing(false);
      return url;
    } catch (error) {
      console.error('Error removing background:', error);
      setIsProcessing(false);
      throw error;
    }
  };

  return { removeBackground, isProcessing, progress };
}
