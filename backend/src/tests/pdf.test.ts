import { describe, it, expect, beforeAll } from 'vitest';
import { PDFExtractionService } from '../modules/extraction/pdf.service.js';
import { createTestPdfFile } from './helpers.js';

describe('PDFExtractionService', () => {
  let samplePdfPath: string;

  beforeAll(async () => {
    samplePdfPath = await createTestPdfFile('pdfjs_test.pdf');
  });

  it('should parse PDF document text retaining layout', async () => {
    const result = await PDFExtractionService.extractText(samplePdfPath);

    expect(result.text).toContain('Social Media Strategy');
    expect(result.pageCount).toBe(1);
    expect(result.isScannedOrEmpty).toBe(false);
  });

  it('should throw an AppError when PDF file does not exist', async () => {
    await expect(PDFExtractionService.extractText('non_existent.pdf')).rejects.toThrow('PDF file not found');
  });
});
