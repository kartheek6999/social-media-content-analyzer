import path from 'path';
import { PDFExtractionService, PDFExtractionResult } from './pdf.service.js';
import { OCRExtractionService, OCRExtractionResult } from './ocr.service.js';
import { AppError } from '../../middleware/errorHandler.js';

export interface UnifiedExtractionResult {
  text: string;
  source: 'PDF' | 'OCR';
  warning?: string;
  meta: Record<string, any>;
}

export class UnifiedExtractionService {
  public static async processFile(filePath: string, fileType: string): Promise<UnifiedExtractionResult> {
    const ext = path.extname(filePath).toLowerCase();

    if (fileType === 'application/pdf' || ext === '.pdf') {
      const pdfRes: PDFExtractionResult = await PDFExtractionService.extractText(filePath);
      
      let warning: string | undefined = undefined;
      if (pdfRes.isScannedOrEmpty) {
        warning = 'The PDF contained very little selectable text. It may be a scanned document or image-only PDF.';
      }

      return {
        text: pdfRes.text,
        source: 'PDF',
        warning,
        meta: {
          pageCount: pdfRes.pageCount,
        },
      };
    } else if (
      ['image/png', 'image/jpeg', 'image/jpg'].includes(fileType) ||
      ['.png', '.jpg', '.jpeg'].includes(ext)
    ) {
      const ocrRes: OCRExtractionResult = await OCRExtractionService.extractText(filePath);

      let warning: string | undefined = undefined;
      if (ocrRes.isLowConfidenceOrEmpty) {
        warning = 'OCR extracted very little or low-confidence text. Please verify accuracy or upload a higher-contrast image.';
      }

      return {
        text: ocrRes.text,
        source: 'OCR',
        warning,
        meta: {
          confidence: ocrRes.confidence,
        },
      };
    } else {
      throw new AppError(`Unsupported file format for text extraction: ${fileType}`, 400);
    }
  }
}
