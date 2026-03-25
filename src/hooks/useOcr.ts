"use client";

import { useState, useCallback } from "react";
import { recognizeImage } from "@/lib/ocr/tesseract";

interface UseOcrReturn {
  isProcessing: boolean;
  progress: number;
  error: string | null;
  processImage: (file: File) => Promise<string>;
}

export function useOcr(): UseOcrReturn {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const processImage = useCallback(async (file: File): Promise<string> => {
    setIsProcessing(true);
    setProgress(0);
    setError(null);

    try {
      const text = await recognizeImage(file, (percent) => {
        setProgress(percent);
      });
      return text;
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Could not read text from image. Please try a clearer photo or enter text manually.";
      setError(message);
      return "";
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return { isProcessing, progress, error, processImage };
}
