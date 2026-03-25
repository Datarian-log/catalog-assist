import { createWorker, Worker } from "tesseract.js";

export async function recognizeImage(
  imageFile: File,
  onProgress?: (percent: number) => void
): Promise<string> {
  let worker: Worker | null = null;
  try {
    worker = await createWorker("eng", undefined, {
      logger: (m) => {
        if (m.status === "recognizing text" && onProgress) {
          onProgress(Math.round(m.progress * 100));
        }
      },
    });
    const {
      data: { text },
    } = await worker.recognize(imageFile);
    return text.trim();
  } finally {
    if (worker) {
      await worker.terminate();
    }
  }
}
