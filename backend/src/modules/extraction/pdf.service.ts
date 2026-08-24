import fs from 'fs';
import { AppError } from '../../middleware/errorHandler.js';

export interface PDFExtractionResult {
  text: string;
  pageCount: number;
  info?: Record<string, any>;
  isScannedOrEmpty: boolean;
}

export class PDFExtractionService {
  public static async extractText(filePath: string): Promise<PDFExtractionResult> {
    if (!fs.existsSync(filePath)) {
      throw new AppError('PDF file not found on disk for extraction.', 404);
    }

    try {
      const dataBuffer = fs.readFileSync(filePath);
      const uint8Array = new Uint8Array(dataBuffer);

      // Use pdfjs-dist legacy node build
      // @ts-ignore
      const pdfjsLib = await import('pdfjs-dist/build/pdf.js');

      const loadingTask = pdfjsLib.getDocument({
        data: uint8Array,
        useSystemFonts: true,
        isEvalSupported: false,
      });

      const pdfDoc = await loadingTask.promise;
      const numPages = pdfDoc.numPages;
      let fullText = '';

      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = await pdfDoc.getPage(pageNum);
        const textContent = await page.getTextContent();

        let lastY: number | null = null;
        let pageText = '';

        for (const item of textContent.items as any[]) {
          if (!item.str) continue;

          const currentY = item.transform ? item.transform[5] : null;

          if (lastY !== null && currentY !== null && Math.abs(currentY - lastY) > 5) {
            pageText += '\n';
            if (Math.abs(currentY - lastY) > 14) {
              pageText += '\n';
            }
          } else if (pageText.length > 0 && !pageText.endsWith(' ') && !pageText.endsWith('\n')) {
            pageText += ' ';
          }

          pageText += item.str;
          lastY = currentY;
        }

        if (numPages > 1) {
          fullText += `--- Page ${pageNum} ---\n` + pageText.trim() + '\n\n';
        } else {
          fullText += pageText.trim();
        }
      }

      const normalizedText = fullText
        .replace(/\r\n/g, '\n')
        .replace(/[ \t]+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

      const isScannedOrEmpty = normalizedText.length < 10;

      return {
        text: normalizedText,
        pageCount: numPages,
        isScannedOrEmpty,
      };
    } catch (error: any) {
      console.error('[PDF EXTRACTION ERROR]', error);
      throw new AppError(
        `Failed to parse PDF document: ${error?.message || 'Invalid or corrupted PDF'}`,
        422
      );
    }
  }
}
