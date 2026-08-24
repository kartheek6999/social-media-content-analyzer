import fs from 'fs';
import { createWorker } from 'tesseract.js';
import { AppError } from '../../middleware/errorHandler.js';

export interface OCRExtractionResult {
  text: string;
  confidence: number;
  isLowConfidenceOrEmpty: boolean;
}

export class OCRExtractionService {
  /**
   * Performs OCR on an image file using Tesseract.js with a strict timeout boundary.
   */
  public static async extractText(
    filePath: string,
    timeoutMs = 45000
  ): Promise<OCRExtractionResult> {
    if (!fs.existsSync(filePath)) {
      throw new AppError('Image file not found on disk for OCR.', 404);
    }

    let worker: any = null;

    try {
      // Race worker execution against timeout boundary to prevent hanging indefinitely
      const ocrTask = (async () => {
        worker = await createWorker('eng');
        const ret = await worker.recognize(filePath);
        await worker.terminate();
        worker = null;
        return ret;
      })();

      const timeoutTask = new Promise<never>((_, reject) => {
        const timer = setTimeout(() => {
          if (worker) {
            worker.terminate().catch(() => {});
          }
          reject(new AppError('OCR process timed out. Please try uploading a smaller or clearer image.', 408));
        }, timeoutMs);
        
        // Ensure timer doesn't keep node event loop open if ocrTask completes
        if (typeof timer.unref === 'function') {
          timer.unref();
        }
      });

      const res = await Promise.race([ocrTask, timeoutTask]);

      const rawText = res.data?.text || '';
      const confidence = res.data?.confidence || 0;

      const normalizedText = rawText
        .replace(/\r\n/g, '\n')
        .replace(/[ \t]+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

      const isLowConfidenceOrEmpty = normalizedText.length < 10 || confidence < 35;

      return {
        text: normalizedText,
        confidence,
        isLowConfidenceOrEmpty,
      };
    } catch (error: any) {
      if (worker) {
        worker.terminate().catch(() => {});
      }
      if (error instanceof AppError) {
        throw error;
      }
      console.error('[OCR EXTRACTION ERROR]', error);
      throw new AppError(
        `Failed to perform OCR on image: ${error?.message || 'Could not recognize text'}`,
        422
      );
    }
  }
}
